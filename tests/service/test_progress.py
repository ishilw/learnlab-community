"""Lesson completion and course progress.

Provisional (PR-01, PR-02, RP-01): completion is a learner action on a lesson of a published
course they are enrolled in; progress is completed divided by total lessons, floored to an
integer percent; a course with no lessons has 0 percent.
"""

import pytest

from src.service.progress_service import progress_percent
from src.types.enums import CourseStatus
from src.types.errors import ForbiddenError, NotFoundError


def course_with_lessons(world, count):
    course = world.published_course()
    module = world.content.create_module(world.instructor, course.id, "M")
    lessons = [
        world.content.create_lesson(world.instructor, module.id, f"L{i}", "c") for i in range(count)
    ]
    return course, lessons


@pytest.mark.parametrize(
    ("completed", "total", "expected"), [(0, 0, 0), (0, 3, 0), (1, 3, 33), (2, 3, 66), (3, 3, 100)]
)
def test_progress_percent_is_floored(completed, total, expected):
    assert progress_percent(completed, total) == expected


def test_completing_a_lesson_is_idempotent(world):
    course, lessons = course_with_lessons(world, 2)
    world.enrollment.enroll(world.learner, course.id)
    world.progress.complete_lesson(world.learner, lessons[0].id)
    world.progress.complete_lesson(world.learner, lessons[0].id)
    progress = world.progress.course_progress(world.learner, course.id)
    assert (progress.completed_lessons, progress.total_lessons, progress.percent) == (1, 2, 50)


def test_progress_floors_the_percentage(world):
    course, lessons = course_with_lessons(world, 3)
    world.enrollment.enroll(world.learner, course.id)
    world.progress.complete_lesson(world.learner, lessons[0].id)
    assert world.progress.course_progress(world.learner, course.id).percent == 33


def test_course_without_lessons_has_zero_progress(world):
    course = world.published_course()
    world.enrollment.enroll(world.learner, course.id)
    progress = world.progress.course_progress(world.learner, course.id)
    assert (progress.total_lessons, progress.percent) == (0, 0)


def test_unenrolled_learner_cannot_complete_lesson(world):
    _, lessons = course_with_lessons(world, 1)
    with pytest.raises(NotFoundError):
        world.progress.complete_lesson(world.learner, lessons[0].id)


def test_instructor_cannot_complete_lesson(world):
    _, lessons = course_with_lessons(world, 1)
    with pytest.raises(ForbiddenError):
        world.progress.complete_lesson(world.instructor, lessons[0].id)


def test_unpublished_course_blocks_completion(world):
    course, lessons = course_with_lessons(world, 1)
    world.enrollment.enroll(world.learner, course.id)
    world.courses_service.transition_course(world.instructor, course.id, CourseStatus.UNPUBLISHED)
    with pytest.raises(NotFoundError):
        world.progress.complete_lesson(world.learner, lessons[0].id)


def test_summary_aggregates_enrolled_learners(world):
    course, lessons = course_with_lessons(world, 2)
    world.enrollment.enroll(world.learner, course.id)
    world.enrollment.enroll(world.learner2, course.id)
    world.progress.complete_lesson(world.learner, lessons[0].id)
    summary = world.progress.course_summary(world.instructor, course.id)
    assert (summary.total_lessons, summary.enrolled_learners, summary.average_percent) == (2, 2, 25)
    assert {(p.learner_id, p.percent) for p in summary.learners} == {
        (world.learner.id, 50),
        (world.learner2.id, 0),
    }


def test_summary_without_enrollments_is_zero(world):
    course, _ = course_with_lessons(world, 1)
    summary = world.progress.course_summary(world.instructor, course.id)
    assert (summary.enrolled_learners, summary.average_percent, summary.learners) == (0, 0, [])


def test_admin_can_read_any_summary(world):
    course, _ = course_with_lessons(world, 1)
    assert world.progress.course_summary(world.admin, course.id).total_lessons == 1


@pytest.mark.parametrize("who", ["other", "learner"])
def test_non_managers_cannot_read_summary(world, who):
    course, _ = course_with_lessons(world, 1)
    with pytest.raises(ForbiddenError):
        world.progress.course_summary(getattr(world, who), course.id)

"""Enrollment rules.

Provisional: enrollment is allowed only into published courses, by learners, once per
course. Pending confirmation of EN-01 to EN-03 and ACT-02 in specs/spec.md.
"""

import pytest

from src.types.enums import CourseStatus
from src.types.errors import (
    CourseNotOpenError,
    DuplicateEnrollmentError,
    ForbiddenError,
    NotFoundError,
)


def published_course(world, title="Course"):
    course = world.courses_service.create_course(world.instructor, title, "")
    return world.courses_service.transition_course(
        world.instructor, course.id, CourseStatus.PUBLISHED
    )


def test_learner_enrolls_in_published_course(world):
    course = published_course(world)
    world.enrollment.enroll(world.learner, course.id)
    enrolled = world.enrollment.list_enrollments(world.learner)
    assert [c.id for c in enrolled] == [course.id]


def test_duplicate_enrollment_is_rejected(world):
    course = published_course(world)
    world.enrollment.enroll(world.learner, course.id)
    with pytest.raises(DuplicateEnrollmentError):
        world.enrollment.enroll(world.learner, course.id)


@pytest.mark.parametrize("status", [CourseStatus.DRAFT, CourseStatus.UNPUBLISHED, CourseStatus.ARCHIVED])
def test_enrollment_rejected_when_course_not_published(world, status):
    course = world.courses_service.create_course(world.instructor, "Course", "")
    if status == CourseStatus.UNPUBLISHED:
        world.courses_service.transition_course(world.instructor, course.id, CourseStatus.PUBLISHED)
        world.courses_service.transition_course(world.instructor, course.id, CourseStatus.UNPUBLISHED)
    elif status == CourseStatus.ARCHIVED:
        world.courses_service.transition_course(world.instructor, course.id, CourseStatus.ARCHIVED)
    with pytest.raises(CourseNotOpenError):
        world.enrollment.enroll(world.learner, course.id)


def test_instructor_cannot_enroll(world):
    course = published_course(world)
    with pytest.raises(ForbiddenError):
        world.enrollment.enroll(world.instructor, course.id)


def test_enrollment_into_missing_course_is_not_found(world):
    with pytest.raises(NotFoundError):
        world.enrollment.enroll(world.learner, 999)


def test_learner_sees_only_own_enrollments(world):
    first = published_course(world, "First")
    second = published_course(world, "Second")
    world.enrollment.enroll(world.learner, first.id)
    world.enrollment.enroll(world.learner2, second.id)
    assert [c.id for c in world.enrollment.list_enrollments(world.learner)] == [first.id]
    assert [c.id for c in world.enrollment.list_enrollments(world.learner2)] == [second.id]

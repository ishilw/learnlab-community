"""Modules and lessons: management rights, ordering, and learner access.

Provisional: learners see content only for published courses they are enrolled in
(Sprint 2 scope). Pending confirmation of ACT-02 to ACT-04 and CL-01 in specs/spec.md.
"""

import pytest

from src.types.enums import CourseStatus
from src.types.errors import CourseLockedError, ForbiddenError, NotFoundError


def published_course(world, title="Course"):
    course = world.courses_service.create_course(world.instructor, title, "")
    return world.courses_service.transition_course(
        world.instructor, course.id, CourseStatus.PUBLISHED
    )


def test_modules_are_listed_in_position_order(world):
    course = published_course(world)
    world.content.create_module(world.instructor, course.id, "First")
    world.content.create_module(world.instructor, course.id, "Second")
    titles = [m.title for m, _ in world.content.list_course_content(world.instructor, course.id)]
    assert titles == ["First", "Second"]


def test_lessons_are_listed_in_position_order(world):
    course = published_course(world)
    module = world.content.create_module(world.instructor, course.id, "M")
    world.content.create_lesson(world.instructor, module.id, "L1", "c1")
    world.content.create_lesson(world.instructor, module.id, "L2", "c2")
    content = world.content.list_course_content(world.instructor, course.id)
    lesson_titles = [lesson.title for lesson in content[0][1]]
    assert lesson_titles == ["L1", "L2"]


def test_other_instructor_cannot_add_module(world):
    course = published_course(world)
    with pytest.raises(ForbiddenError):
        world.content.create_module(world.other, course.id, "Intruder")


def test_admin_can_add_module_to_any_course(world):
    course = published_course(world)
    module = world.content.create_module(world.admin, course.id, "Admin module")
    assert module.course_id == course.id


def test_learner_cannot_add_module(world):
    course = published_course(world)
    with pytest.raises(ForbiddenError):
        world.content.create_module(world.learner, course.id, "Nope")


def test_unenrolled_learner_cannot_list_content(world):
    course = published_course(world)
    with pytest.raises(NotFoundError):
        world.content.list_course_content(world.learner, course.id)


def test_enrolled_learner_lists_content_of_published_course(world):
    course = published_course(world)
    world.content.create_module(world.instructor, course.id, "M")
    world.enrollment.enroll(world.learner, course.id)
    content = world.content.list_course_content(world.learner, course.id)
    assert [m.title for m, _ in content] == ["M"]


def test_enrolled_learner_cannot_see_content_of_unpublished_course(world):
    course = published_course(world)
    world.enrollment.enroll(world.learner, course.id)
    world.courses_service.transition_course(world.instructor, course.id, CourseStatus.UNPUBLISHED)
    with pytest.raises(NotFoundError):
        world.content.list_course_content(world.learner, course.id)


def test_content_is_locked_for_archived_course(world):
    course = published_course(world)
    world.courses_service.transition_course(world.instructor, course.id, CourseStatus.ARCHIVED)
    with pytest.raises(CourseLockedError):
        world.content.create_module(world.instructor, course.id, "Late")


def test_lesson_in_missing_module_is_not_found(world):
    with pytest.raises(NotFoundError):
        world.content.create_lesson(world.instructor, 999, "L", "c")

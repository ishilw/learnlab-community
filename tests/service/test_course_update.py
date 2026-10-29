"""Course update authorization and archived-course lock.

Provisional: pending confirmation of ACT-02 to ACT-04 in specs/spec.md. The rule that
archived courses are read-only is a provisional interpretation of the lifecycle.
"""

import pytest

from src.types.enums import CourseStatus
from src.types.errors import CourseLockedError, ForbiddenError, NotFoundError


def test_owner_updates_title_and_description(world):
    created = world.courses_service.create_course(world.instructor, "Old", "d1")
    updated = world.courses_service.update_course(
        world.instructor, created.id, title="New", description="d2"
    )
    assert (updated.title, updated.description) == ("New", "d2")
    assert updated.status == CourseStatus.DRAFT


def test_partial_update_keeps_other_fields(world):
    created = world.courses_service.create_course(world.instructor, "Old", "keep me")
    updated = world.courses_service.update_course(world.instructor, created.id, title="New")
    assert updated.title == "New"
    assert updated.description == "keep me"


def test_admin_updates_any_course(world):
    created = world.courses_service.create_course(world.instructor, "Old", "")
    updated = world.courses_service.update_course(world.admin, created.id, title="Admin edit")
    assert updated.title == "Admin edit"


def test_other_instructor_cannot_update(world):
    created = world.courses_service.create_course(world.instructor, "Old", "")
    with pytest.raises(ForbiddenError):
        world.courses_service.update_course(world.other, created.id, title="Hijack")


def test_learner_cannot_update_published_course(world):
    created = world.courses_service.create_course(world.instructor, "Old", "")
    world.courses_service.transition_course(world.instructor, created.id, CourseStatus.PUBLISHED)
    with pytest.raises(ForbiddenError):
        world.courses_service.update_course(world.learner, created.id, title="Nope")


def test_archived_course_is_locked(world):
    created = world.courses_service.create_course(world.instructor, "Old", "")
    world.courses_service.transition_course(world.instructor, created.id, CourseStatus.ARCHIVED)
    with pytest.raises(CourseLockedError):
        world.courses_service.update_course(world.instructor, created.id, title="New")


def test_update_missing_course_is_not_found(world):
    with pytest.raises(NotFoundError):
        world.courses_service.update_course(world.instructor, 999, title="x")

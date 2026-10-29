"""Role-based authorization for course operations.

Provisional: the permission matrix is pending confirmation of requirements
ACT-02 to ACT-04 in specs/spec.md. These tests pin the provisional matrix only.
"""

from src.service.authorization import can_create_course, can_manage_course, can_view_course
from src.types.enums import CourseStatus, Role
from src.types.models import Course, User

LEARNER = User(id=1, name="l", role=Role.LEARNER)
INSTRUCTOR = User(id=2, name="i", role=Role.INSTRUCTOR)
OTHER_INSTRUCTOR = User(id=3, name="o", role=Role.INSTRUCTOR)
ADMIN = User(id=4, name="a", role=Role.ADMIN)


def course(status, owner_id=2):
    return Course(id=10, title="t", description="", owner_id=owner_id, status=status)


def test_only_instructors_and_admins_create_courses():
    assert not can_create_course(LEARNER)
    assert can_create_course(INSTRUCTOR)
    assert can_create_course(ADMIN)


def test_owner_and_admin_manage_course():
    draft = course(CourseStatus.DRAFT)
    assert can_manage_course(INSTRUCTOR, draft)
    assert can_manage_course(ADMIN, draft)


def test_other_instructor_and_learner_cannot_manage_course():
    draft = course(CourseStatus.DRAFT)
    assert not can_manage_course(OTHER_INSTRUCTOR, draft)
    assert not can_manage_course(LEARNER, draft)


def test_anyone_can_view_published_course():
    published = course(CourseStatus.PUBLISHED)
    assert can_view_course(LEARNER, published)
    assert can_view_course(OTHER_INSTRUCTOR, published)


def test_draft_is_visible_only_to_managers():
    draft = course(CourseStatus.DRAFT)
    assert can_view_course(INSTRUCTOR, draft)
    assert can_view_course(ADMIN, draft)
    assert not can_view_course(LEARNER, draft)
    assert not can_view_course(OTHER_INSTRUCTOR, draft)


def test_archived_is_visible_only_to_managers():
    archived = course(CourseStatus.ARCHIVED)
    assert not can_view_course(LEARNER, archived)
    assert can_view_course(INSTRUCTOR, archived)

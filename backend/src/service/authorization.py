"""Role-based authorization for course operations.

Provisional: the permission matrix is pending confirmation of requirements
ACT-02 to ACT-04 in specs/spec.md. Enforced here in the service layer, and the
API layer maps the outcome to HTTP status codes.
"""

from src.types.enums import CourseStatus, Role
from src.types.models import Course, User


def can_create_course(actor: User) -> bool:
    return actor.role in (Role.INSTRUCTOR, Role.ADMIN)


def can_enroll(actor: User) -> bool:
    """Provisional (EN-01..03, ACT-02): only learners enroll, and only themselves."""
    return actor.role == Role.LEARNER


def can_manage_course(actor: User, course: Course) -> bool:
    if actor.role == Role.ADMIN:
        return True
    return actor.role == Role.INSTRUCTOR and course.owner_id == actor.id


def can_view_course(actor: User, course: Course) -> bool:
    if course.status == CourseStatus.PUBLISHED:
        return True
    return can_manage_course(actor, course)

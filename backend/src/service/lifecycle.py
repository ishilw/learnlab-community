"""Course lifecycle transitions.

Provisional: the states and allowed transitions are pending confirmation of
requirement CL-01 in specs/spec.md. Archived is treated as terminal.
"""

from src.types.enums import CourseStatus
from src.types.errors import InvalidCourseStateException

_TRANSITIONS: dict[CourseStatus, frozenset[CourseStatus]] = {
    CourseStatus.DRAFT: frozenset({CourseStatus.PUBLISHED, CourseStatus.ARCHIVED}),
    CourseStatus.PUBLISHED: frozenset({CourseStatus.UNPUBLISHED, CourseStatus.ARCHIVED}),
    CourseStatus.UNPUBLISHED: frozenset({CourseStatus.PUBLISHED, CourseStatus.ARCHIVED}),
    CourseStatus.ARCHIVED: frozenset(),
}


def allowed_targets(current: CourseStatus) -> frozenset[CourseStatus]:
    return _TRANSITIONS[current]


def ensure_transition(current: CourseStatus, target: CourseStatus) -> None:
    if target not in _TRANSITIONS[current]:
        raise InvalidCourseStateException(current, target)

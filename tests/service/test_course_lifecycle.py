"""Course lifecycle transitions.

Provisional: the allowed states and transitions are pending confirmation of
requirement CL-01 in specs/spec.md. Sprint 2 adds UNPUBLISHED as a provisional
state. These tests pin the provisional rules only.
"""

import pytest

from src.service.lifecycle import allowed_targets, ensure_transition
from src.types.enums import CourseStatus
from src.types.errors import InvalidCourseStateException


@pytest.mark.parametrize(
    ("current", "target"),
    [
        (CourseStatus.DRAFT, CourseStatus.PUBLISHED),
        (CourseStatus.DRAFT, CourseStatus.ARCHIVED),
        (CourseStatus.PUBLISHED, CourseStatus.UNPUBLISHED),
        (CourseStatus.PUBLISHED, CourseStatus.ARCHIVED),
        (CourseStatus.UNPUBLISHED, CourseStatus.PUBLISHED),
        (CourseStatus.UNPUBLISHED, CourseStatus.ARCHIVED),
    ],
)
def test_valid_transitions_are_allowed(current, target):
    ensure_transition(current, target)


@pytest.mark.parametrize(
    ("current", "target"),
    [
        (CourseStatus.DRAFT, CourseStatus.DRAFT),
        (CourseStatus.DRAFT, CourseStatus.UNPUBLISHED),
        (CourseStatus.PUBLISHED, CourseStatus.DRAFT),
        (CourseStatus.PUBLISHED, CourseStatus.PUBLISHED),
        (CourseStatus.UNPUBLISHED, CourseStatus.DRAFT),
        (CourseStatus.UNPUBLISHED, CourseStatus.UNPUBLISHED),
        (CourseStatus.ARCHIVED, CourseStatus.DRAFT),
        (CourseStatus.ARCHIVED, CourseStatus.PUBLISHED),
        (CourseStatus.ARCHIVED, CourseStatus.UNPUBLISHED),
        (CourseStatus.ARCHIVED, CourseStatus.ARCHIVED),
    ],
)
def test_invalid_transitions_raise(current, target):
    with pytest.raises(InvalidCourseStateException) as excinfo:
        ensure_transition(current, target)
    assert excinfo.value.from_state == current
    assert excinfo.value.to_state == target


def test_archived_is_terminal():
    assert allowed_targets(CourseStatus.ARCHIVED) == frozenset()


def test_draft_allows_publish_and_archive():
    assert allowed_targets(CourseStatus.DRAFT) == frozenset(
        {CourseStatus.PUBLISHED, CourseStatus.ARCHIVED}
    )


def test_published_allows_unpublish_and_archive():
    assert allowed_targets(CourseStatus.PUBLISHED) == frozenset(
        {CourseStatus.UNPUBLISHED, CourseStatus.ARCHIVED}
    )


def test_unpublished_allows_publish_and_archive():
    assert allowed_targets(CourseStatus.UNPUBLISHED) == frozenset(
        {CourseStatus.PUBLISHED, CourseStatus.ARCHIVED}
    )

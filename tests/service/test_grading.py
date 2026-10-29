"""Deterministic grading.

Provisional (QZ-02): scores are integer percentages, floored. No pass threshold exists.
Pending confirmation of QZ-01 to QZ-04 in specs/spec.md.
"""

import pytest

from src.service.grading import grade
from src.types.errors import InvalidSubmissionError

KEY = {1: 10, 2: 20, 3: 30}


def test_all_correct_is_100_percent():
    assert grade(KEY, {1: 10, 2: 20, 3: 30}) == (3, 3, 100)


def test_score_is_floored_integer_percent():
    assert grade(KEY, {1: 10, 2: 99, 3: 99}) == (1, 3, 33)
    assert grade(KEY, {1: 10, 2: 20, 3: 99}) == (2, 3, 66)


def test_unanswered_questions_count_as_wrong():
    assert grade(KEY, {1: 10}) == (1, 3, 33)


def test_no_correct_answers_is_zero():
    assert grade(KEY, {1: 99, 2: 99, 3: 99}) == (0, 3, 0)


def test_grading_is_deterministic():
    answers = {1: 10, 2: 99}
    assert grade(KEY, answers) == grade(KEY, answers)


def test_quiz_without_questions_cannot_be_graded():
    with pytest.raises(InvalidSubmissionError):
        grade({}, {})

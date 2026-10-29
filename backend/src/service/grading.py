"""Deterministic quiz grading.

Provisional (QZ-02): the score is the integer percentage of correct answers, rounded
down. Unanswered questions count as wrong. No pass threshold is defined or implied.
"""

from collections.abc import Mapping

from src.types.errors import InvalidSubmissionError


def grade(key: Mapping[int, int], answers: Mapping[int, int]) -> tuple[int, int, int]:
    """Return (correct count, total questions, integer percent score).

    The same key and answers always give the same result. No model or randomness is used.
    """
    total = len(key)
    if total == 0:
        raise InvalidSubmissionError("quiz has no questions to grade")
    correct = sum(1 for question_id, option_id in key.items() if answers.get(question_id) == option_id)
    return correct, total, correct * 100 // total

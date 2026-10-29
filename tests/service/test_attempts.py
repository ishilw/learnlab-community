"""Quiz attempts: grading, immutability, best score, and access.

Provisional (QZ-02 to QZ-04, EN-01, ACT-02): only enrolled learners submit; attempts are
append-only; the best score is the maximum recorded score. No pass threshold is defined.
"""

import pytest

from src.types.enums import CourseStatus
from src.types.errors import ForbiddenError, InvalidSubmissionError, NotFoundError


def test_perfect_submission_scores_100(world):
    _, quiz = world.enrolled_quiz()
    attempt = world.attempt_service.submit(world.learner, quiz.id, world.correct_answers(quiz.id))
    assert (attempt.correct_count, attempt.total_questions, attempt.score) == (3, 3, 100)


def test_partial_submission_scores_floored_percent(world):
    _, quiz = world.enrolled_quiz()
    answers = world.wrong_answers(quiz.id)
    first = world.quizzes.list_questions(quiz.id)[0].id
    answers[first] = world.correct_answers(quiz.id)[first]
    attempt = world.attempt_service.submit(world.learner, quiz.id, answers)
    assert (attempt.correct_count, attempt.score) == (1, 33)


def test_every_attempt_is_kept_in_submission_order_with_timestamps(world):
    _, quiz = world.enrolled_quiz()
    world.attempt_service.submit(world.learner, quiz.id, world.wrong_answers(quiz.id))
    world.attempt_service.submit(world.learner, quiz.id, world.correct_answers(quiz.id))
    attempts = world.attempt_service.list_attempts(world.learner, quiz.id)
    assert [a.score for a in attempts] == [0, 100]
    assert attempts[0].submitted_at < attempts[1].submitted_at


def test_earlier_attempts_are_unchanged_by_later_ones(world):
    _, quiz = world.enrolled_quiz()
    first = world.attempt_service.submit(world.learner, quiz.id, world.wrong_answers(quiz.id))
    world.attempt_service.submit(world.learner, quiz.id, world.correct_answers(quiz.id))
    assert world.attempt_service.list_attempts(world.learner, quiz.id)[0] == first


def test_best_score_is_maximum_and_never_drops(world):
    _, quiz = world.enrolled_quiz()
    world.attempt_service.submit(world.learner, quiz.id, world.correct_answers(quiz.id))
    world.attempt_service.submit(world.learner, quiz.id, world.wrong_answers(quiz.id))
    best = world.attempt_service.best_score(world.learner, quiz.id)
    assert (best.best_score, best.attempts) == (100, 2)


def test_best_score_is_none_before_any_attempt(world):
    _, quiz = world.enrolled_quiz()
    best = world.attempt_service.best_score(world.learner, quiz.id)
    assert (best.best_score, best.attempts) == (None, 0)


def test_attempts_belong_to_their_learner(world):
    course, quiz = world.enrolled_quiz()
    world.enrollment.enroll(world.learner2, course.id)
    world.attempt_service.submit(world.learner, quiz.id, world.correct_answers(quiz.id))
    assert world.attempt_service.list_attempts(world.learner2, quiz.id) == []


def test_unenrolled_learner_cannot_see_or_submit(world):
    _, quiz = world.enrolled_quiz()
    with pytest.raises(NotFoundError):
        world.attempt_service.submit(world.learner2, quiz.id, world.correct_answers(quiz.id))


def test_instructor_cannot_submit(world):
    _, quiz = world.enrolled_quiz()
    with pytest.raises(ForbiddenError):
        world.attempt_service.submit(world.instructor, quiz.id, world.correct_answers(quiz.id))


def test_unpublished_course_hides_quiz_from_learners(world):
    course, quiz = world.enrolled_quiz()
    world.courses_service.transition_course(world.instructor, course.id, CourseStatus.UNPUBLISHED)
    with pytest.raises(NotFoundError):
        world.attempt_service.submit(world.learner, quiz.id, world.correct_answers(quiz.id))


def test_option_from_another_question_is_rejected(world):
    _, quiz = world.enrolled_quiz()
    answers = world.correct_answers(quiz.id)
    first, second = list(answers)[:2]
    answers[first] = answers[second]
    with pytest.raises(InvalidSubmissionError):
        world.attempt_service.submit(world.learner, quiz.id, answers)


def test_unknown_question_is_rejected(world):
    _, quiz = world.enrolled_quiz()
    answers = world.correct_answers(quiz.id)
    answers[9999] = 1
    with pytest.raises(InvalidSubmissionError):
        world.attempt_service.submit(world.learner, quiz.id, answers)


def test_rejected_submission_is_not_recorded(world):
    _, quiz = world.enrolled_quiz()
    with pytest.raises(InvalidSubmissionError):
        world.attempt_service.submit(world.learner, quiz.id, {9999: 1})
    assert world.attempt_service.list_attempts(world.learner, quiz.id) == []

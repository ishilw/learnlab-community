"""Quiz authoring: rights, validation, and answer secrecy.

Provisional (QZ-01, ACT-03): owners and admins author quizzes; MCQ takes 2 to 6 choices;
questions cannot change after the first attempt. Pending specs/spec.md confirmation.
"""

import pytest

from src.types.enums import CourseStatus
from src.types.errors import (
    CourseLockedError,
    ForbiddenError,
    InvalidQuestionError,
    NotFoundError,
    QuizLockedError,
)


def test_owner_creates_quiz_for_lesson(world):
    lesson = world.lesson_in(world.published_course())
    quiz = world.quiz_service.create_quiz(world.instructor, lesson.id, "Week 1")
    assert (quiz.lesson_id, quiz.title) == (lesson.id, "Week 1")


def test_admin_creates_quiz_in_any_course(world):
    lesson = world.lesson_in(world.published_course())
    assert world.quiz_service.create_quiz(world.admin, lesson.id, "Admin quiz").id


@pytest.mark.parametrize("who", ["other", "learner"])
def test_non_managers_cannot_create_quiz(world, who):
    lesson = world.lesson_in(world.published_course())
    with pytest.raises(ForbiddenError):
        world.quiz_service.create_quiz(getattr(world, who), lesson.id, "No")


def test_quiz_for_missing_lesson_is_not_found(world):
    with pytest.raises(NotFoundError):
        world.quiz_service.create_quiz(world.instructor, 999, "No")


def test_archived_course_locks_quiz_creation(world):
    course = world.published_course()
    lesson = world.lesson_in(course)
    world.courses_service.transition_course(world.instructor, course.id, CourseStatus.ARCHIVED)
    with pytest.raises(CourseLockedError):
        world.quiz_service.create_quiz(world.instructor, lesson.id, "Late")


def test_owner_updates_quiz_title(world):
    quiz = world.quiz_for(world.lesson_in(world.published_course()))
    updated = world.quiz_service.update_quiz(world.instructor, quiz.id, "Renamed")
    assert updated.title == "Renamed"


def test_other_instructor_cannot_update_quiz(world):
    quiz = world.quiz_for(world.lesson_in(world.published_course()))
    with pytest.raises(ForbiddenError):
        world.quiz_service.update_quiz(world.other, quiz.id, "Hijack")


@pytest.mark.parametrize(
    ("prompt", "choices", "correct_index"),
    [("Q", ["only one"], 0), ("Q", ["a", "b"], 2), ("Q", ["a", "b"], -1), ("  ", ["a", "b"], 0)],
)
def test_invalid_mcq_is_rejected(world, prompt, choices, correct_index):
    quiz = world.quiz_service.create_quiz(
        world.instructor, world.lesson_in(world.published_course()).id, "Quiz"
    )
    with pytest.raises(InvalidQuestionError):
        world.quiz_service.add_mcq_question(
            world.instructor, quiz.id, prompt, choices, correct_index
        )


def test_true_false_question_has_true_and_false_options(world):
    quiz = world.quiz_service.create_quiz(
        world.instructor, world.lesson_in(world.published_course()).id, "Quiz"
    )
    view = world.quiz_service.add_true_false_question(world.instructor, quiz.id, "Sky is blue", True)
    assert [o.text for o in view.options] == ["True", "False"]
    key = world.correct_answers(quiz.id)[view.question.id]
    assert next(o.text for o in view.options if o.id == key) == "True"


def test_viewed_options_never_expose_correctness(world):
    quiz = world.quiz_for(world.lesson_in(world.published_course()))
    view = world.quiz_service.get_quiz(world.instructor, quiz.id)
    for question_view in view.questions:
        for option in question_view.options:
            assert not hasattr(option, "is_correct")
            assert not hasattr(option, "correct")


def test_questions_are_locked_after_first_attempt(world):
    course, quiz = world.enrolled_quiz()
    world.attempt_service.submit(world.learner, quiz.id, world.correct_answers(quiz.id))
    with pytest.raises(QuizLockedError):
        world.quiz_service.add_true_false_question(world.instructor, quiz.id, "Late", True)


def test_owner_lists_persisted_quizzes_for_a_lesson(world):
    lesson = world.lesson_in(world.published_course())
    first = world.quiz_service.create_quiz(world.instructor, lesson.id, "One")
    second = world.quiz_service.create_quiz(world.instructor, lesson.id, "Two")
    listed = world.quiz_service.list_quizzes_for_lesson(world.instructor, lesson.id)
    assert [q.id for q in listed] == [first.id, second.id]


def test_admin_lists_quizzes_in_any_course(world):
    lesson = world.lesson_in(world.published_course())
    world.quiz_service.create_quiz(world.instructor, lesson.id, "One")
    assert len(world.quiz_service.list_quizzes_for_lesson(world.admin, lesson.id)) == 1


def test_lesson_without_quizzes_lists_empty(world):
    lesson = world.lesson_in(world.published_course())
    assert world.quiz_service.list_quizzes_for_lesson(world.instructor, lesson.id) == []


@pytest.mark.parametrize("who", ["other", "learner"])
def test_non_managers_cannot_list_lesson_quizzes(world, who):
    lesson = world.lesson_in(world.published_course())
    with pytest.raises(ForbiddenError):
        world.quiz_service.list_quizzes_for_lesson(getattr(world, who), lesson.id)


def test_listing_quizzes_for_a_missing_lesson_is_not_found(world):
    with pytest.raises(NotFoundError):
        world.quiz_service.list_quizzes_for_lesson(world.instructor, 999)


def test_archived_course_quizzes_can_still_be_listed(world):
    course = world.published_course()
    lesson = world.lesson_in(course)
    world.quiz_service.create_quiz(world.instructor, lesson.id, "Kept")
    world.courses_service.transition_course(world.instructor, course.id, CourseStatus.ARCHIVED)
    assert len(world.quiz_service.list_quizzes_for_lesson(world.instructor, lesson.id)) == 1

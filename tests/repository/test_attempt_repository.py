import sqlite3

import pytest

from src.repository.attempt_repository import AttemptRepository
from src.repository.course_repository import CourseRepository
from src.repository.database import connect, init_schema
from src.repository.lesson_repository import LessonRepository
from src.repository.module_repository import ModuleRepository
from src.repository.quiz_repository import QuizRepository
from src.repository.user_repository import UserRepository
from src.types.enums import QuestionKind, Role


def setup_quiz(tmp_path):
    conn = connect(str(tmp_path / "attempt.db"))
    init_schema(conn)
    users = UserRepository(conn)
    owner = users.add("owner", Role.INSTRUCTOR)
    learner = users.add("learner", Role.LEARNER)
    course = CourseRepository(conn).add("Course", "", owner.id)
    module = ModuleRepository(conn).add(course.id, "M")
    lesson = LessonRepository(conn).add(module.id, "L", "c")
    quizzes = QuizRepository(conn)
    quiz = quizzes.add_quiz(lesson.id, "Quiz")
    question = quizzes.add_question(quiz.id, QuestionKind.MCQ, "Q", ["a", "b"], 0)
    option = quizzes.list_options(question.id)[0]
    return conn, quiz, learner, question, option


def test_attempt_is_stored_with_timestamp_and_answers(tmp_path):
    conn, quiz, learner, question, option = setup_quiz(tmp_path)
    attempts = AttemptRepository(conn)
    stored = attempts.add(quiz.id, learner.id, 100, 1, 1, "2026-01-01T00:00:00+00:00", {question.id: option.id})
    assert stored.submitted_at == "2026-01-01T00:00:00+00:00"
    assert attempts.list_for_learner(quiz.id, learner.id) == [stored]
    rows = conn.execute("SELECT question_id, option_id FROM attempt_answers").fetchall()
    assert [(r[0], r[1]) for r in rows] == [(question.id, option.id)]


def test_best_score_and_count(tmp_path):
    conn, quiz, learner, question, option = setup_quiz(tmp_path)
    attempts = AttemptRepository(conn)
    assert attempts.best_score(quiz.id, learner.id) is None
    attempts.add(quiz.id, learner.id, 40, 1, 2, "2026-01-01T00:00:01+00:00", {})
    attempts.add(quiz.id, learner.id, 90, 2, 2, "2026-01-01T00:00:02+00:00", {})
    attempts.add(quiz.id, learner.id, 10, 0, 2, "2026-01-01T00:00:03+00:00", {})
    assert attempts.best_score(quiz.id, learner.id) == 90
    assert attempts.count_for_quiz(quiz.id) == 3


def test_attempts_cannot_be_updated(tmp_path):
    conn, quiz, learner, _, _ = setup_quiz(tmp_path)
    AttemptRepository(conn).add(quiz.id, learner.id, 50, 1, 2, "2026-01-01T00:00:00+00:00", {})
    with pytest.raises(sqlite3.DatabaseError):
        conn.execute("UPDATE attempts SET score = 100")


def test_attempts_cannot_be_deleted(tmp_path):
    conn, quiz, learner, _, _ = setup_quiz(tmp_path)
    AttemptRepository(conn).add(quiz.id, learner.id, 50, 1, 2, "2026-01-01T00:00:00+00:00", {})
    with pytest.raises(sqlite3.DatabaseError):
        conn.execute("DELETE FROM attempts")


def test_attempt_answers_cannot_be_changed_or_deleted(tmp_path):
    conn, quiz, learner, question, option = setup_quiz(tmp_path)
    AttemptRepository(conn).add(quiz.id, learner.id, 100, 1, 1, "2026-01-01T00:00:00+00:00", {question.id: option.id})
    with pytest.raises(sqlite3.DatabaseError):
        conn.execute("UPDATE attempt_answers SET option_id = 0")
    with pytest.raises(sqlite3.DatabaseError):
        conn.execute("DELETE FROM attempt_answers")

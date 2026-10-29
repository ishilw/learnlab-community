from datetime import datetime, timedelta, timezone

import pytest

from src.repository.attempt_repository import AttemptRepository
from src.repository.completion_repository import CompletionRepository
from src.repository.course_repository import CourseRepository
from src.repository.quiz_repository import QuizRepository
from src.service.attempt_service import AttemptService
from src.service.progress_service import ProgressService
from src.service.quiz_service import QuizService
from src.repository.database import connect, init_schema
from src.repository.enrollment_repository import EnrollmentRepository
from src.repository.lesson_repository import LessonRepository
from src.repository.module_repository import ModuleRepository
from src.repository.user_repository import UserRepository
from src.service.content_service import ContentService
from src.service.course_service import CourseService
from src.service.enrollment_service import EnrollmentService
from src.types.enums import CourseStatus, Role


class Clock:
    """Deterministic clock: each call returns a time one second later."""

    def __init__(self) -> None:
        self._now = datetime(2026, 1, 1, tzinfo=timezone.utc)

    def __call__(self) -> datetime:
        self._now += timedelta(seconds=1)
        return self._now


class World:
    """Repositories, services, and one user per role, on a temporary database."""

    def __init__(self, db_path: str) -> None:
        self.conn = connect(db_path)
        init_schema(self.conn)
        self.courses = CourseRepository(self.conn)
        self.modules = ModuleRepository(self.conn)
        self.lessons = LessonRepository(self.conn)
        self.enrollments = EnrollmentRepository(self.conn)
        users = UserRepository(self.conn)
        self.learner = users.add("learner", Role.LEARNER)
        self.learner2 = users.add("learner2", Role.LEARNER)
        self.instructor = users.add("instructor", Role.INSTRUCTOR)
        self.other = users.add("other", Role.INSTRUCTOR)
        self.admin = users.add("admin", Role.ADMIN)
        self.courses_service = CourseService(self.courses)
        self.content = ContentService(self.courses, self.modules, self.lessons, self.enrollments)
        self.enrollment = EnrollmentService(self.courses, self.enrollments)
        self.quizzes = QuizRepository(self.conn)
        self.attempts = AttemptRepository(self.conn)
        self.completions = CompletionRepository(self.conn)
        self.clock = Clock()
        self.quiz_service = QuizService(
            self.courses, self.lessons, self.quizzes, self.attempts, self.enrollments
        )
        self.attempt_service = AttemptService(
            self.courses, self.quizzes, self.attempts, self.enrollments, self.clock
        )
        self.progress = ProgressService(
            self.courses, self.lessons, self.enrollments, self.completions, self.clock
        )

    def published_course(self, title="Course"):
        course = self.courses_service.create_course(self.instructor, title, "")
        return self.courses_service.transition_course(
            self.instructor, course.id, CourseStatus.PUBLISHED
        )

    def lesson_in(self, course, title="L"):
        module = self.content.create_module(self.instructor, course.id, "M")
        return self.content.create_lesson(self.instructor, module.id, title, "content")

    def quiz_for(self, lesson):
        """A quiz with two MCQ questions and one True/False question."""
        quiz = self.quiz_service.create_quiz(self.instructor, lesson.id, "Quiz")
        self.quiz_service.add_mcq_question(self.instructor, quiz.id, "Q1", ["a", "b", "c"], 1)
        self.quiz_service.add_mcq_question(self.instructor, quiz.id, "Q2", ["x", "y"], 0)
        self.quiz_service.add_true_false_question(self.instructor, quiz.id, "Q3", True)
        return quiz

    def enrolled_quiz(self, learner=None):
        """Published course, one lesson, a three-question quiz, and an enrolled learner."""
        learner = learner or self.learner
        course = self.published_course()
        quiz = self.quiz_for(self.lesson_in(course))
        self.enrollment.enroll(learner, course.id)
        return course, quiz

    def correct_answers(self, quiz_id):
        return dict(self.quizzes.correct_option_ids(quiz_id))

    def wrong_answers(self, quiz_id):
        key = self.quizzes.correct_option_ids(quiz_id)
        answers = {}
        for question in self.quizzes.list_questions(quiz_id):
            options = self.quizzes.list_options(question.id)
            answers[question.id] = next(o.id for o in options if o.id != key[question.id])
        return answers


@pytest.fixture
def world(tmp_path):
    return World(str(tmp_path / "world.db"))

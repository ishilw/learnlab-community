from dataclasses import replace

from src.repository.attempt_repository import AttemptRepository
from src.repository.course_repository import CourseRepository
from src.repository.enrollment_repository import EnrollmentRepository
from src.repository.lesson_repository import LessonRepository
from src.repository.quiz_repository import QuizRepository
from src.service.access import (
    course_of_quiz,
    course_or_not_found,
    require_course_management,
)
from src.service.authorization import can_manage_course
from src.types.enums import CourseStatus, QuestionKind, Role
from src.types.errors import (
    ForbiddenError,
    InvalidQuestionError,
    NotFoundError,
    QuizLockedError,
)
from src.types.models import Course, QuestionView, Quiz, QuizView, User

MIN_CHOICES = 2
MAX_CHOICES = 6


class QuizService:
    """Quiz authoring and viewing.

    Provisional (QZ-01, ACT-03): owners and admins author; questions are fixed once an
    attempt exists; learners see questions without any answer key.
    """

    def __init__(
        self,
        courses: CourseRepository,
        lessons: LessonRepository,
        quizzes: QuizRepository,
        attempts: AttemptRepository,
        enrollments: EnrollmentRepository,
    ) -> None:
        self._courses = courses
        self._lessons = lessons
        self._quizzes = quizzes
        self._attempts = attempts
        self._enrollments = enrollments

    def create_quiz(self, actor: User, lesson_id: int, title: str) -> Quiz:
        course = course_or_not_found(
            self._courses, self._lessons.course_id_for_lesson(lesson_id), f"lesson {lesson_id}"
        )
        require_course_management(actor, course)
        return self._quizzes.add_quiz(lesson_id, title)

    def list_quizzes_for_lesson(self, actor: User, lesson_id: int) -> list[Quiz]:
        """Quiz metadata for managers. Reading stays allowed on archived courses."""
        course = course_or_not_found(
            self._courses, self._lessons.course_id_for_lesson(lesson_id), f"lesson {lesson_id}"
        )
        if not can_manage_course(actor, course):
            raise ForbiddenError("only the course owner or an administrator may manage this")
        return self._quizzes.list_for_lesson(lesson_id)

    def update_quiz(self, actor: User, quiz_id: int, title: str) -> Quiz:
        course = course_of_quiz(self._courses, self._quizzes, quiz_id)
        require_course_management(actor, course)
        quiz = self._require_quiz(quiz_id)
        self._quizzes.update_title(quiz_id, title)
        return replace(quiz, title=title)

    def add_mcq_question(
        self, actor: User, quiz_id: int, prompt: str, choices: list[str], correct_index: int
    ) -> QuestionView:
        self._authorize_question_change(actor, quiz_id)
        _validate_question(prompt, choices, correct_index)
        return self._store_question(quiz_id, QuestionKind.MCQ, prompt, choices, correct_index)

    def add_true_false_question(
        self, actor: User, quiz_id: int, prompt: str, correct: bool
    ) -> QuestionView:
        self._authorize_question_change(actor, quiz_id)
        _validate_question(prompt, ["True", "False"], 0)
        index = 0 if correct else 1
        return self._store_question(quiz_id, QuestionKind.TRUE_FALSE, prompt, ["True", "False"], index)

    def get_quiz(self, actor: User, quiz_id: int) -> QuizView:
        course = course_of_quiz(self._courses, self._quizzes, quiz_id)
        if not self._can_read(actor, course):
            raise NotFoundError(f"quiz {quiz_id} not found")
        quiz = self._require_quiz(quiz_id)
        questions = [
            QuestionView(question, self._quizzes.list_options(question.id))
            for question in self._quizzes.list_questions(quiz_id)
        ]
        return QuizView(quiz, questions)

    def _authorize_question_change(self, actor: User, quiz_id: int) -> None:
        course = course_of_quiz(self._courses, self._quizzes, quiz_id)
        require_course_management(actor, course)
        if self._attempts.count_for_quiz(quiz_id) > 0:
            raise QuizLockedError("questions cannot change after the first attempt")

    def _store_question(
        self, quiz_id: int, kind: QuestionKind, prompt: str, choices: list[str], index: int
    ) -> QuestionView:
        question = self._quizzes.add_question(quiz_id, kind, prompt, choices, index)
        return QuestionView(question, self._quizzes.list_options(question.id))

    def _require_quiz(self, quiz_id: int) -> Quiz:
        quiz = self._quizzes.get(quiz_id)
        if quiz is None:
            raise NotFoundError(f"quiz {quiz_id} not found")
        return quiz

    def _can_read(self, actor: User, course: Course) -> bool:
        if can_manage_course(actor, course):
            return True
        return (
            actor.role == Role.LEARNER
            and course.status == CourseStatus.PUBLISHED
            and self._enrollments.exists(course.id, actor.id)
        )


def _validate_question(prompt: str, choices: list[str], correct_index: int) -> None:
    if not prompt.strip():
        raise InvalidQuestionError("question prompt must not be blank")
    if not MIN_CHOICES <= len(choices) <= MAX_CHOICES:
        raise InvalidQuestionError(f"a question needs {MIN_CHOICES} to {MAX_CHOICES} choices")
    if any(not choice.strip() for choice in choices):
        raise InvalidQuestionError("choices must not be blank")
    if not 0 <= correct_index < len(choices):
        raise InvalidQuestionError("correct choice index is out of range")

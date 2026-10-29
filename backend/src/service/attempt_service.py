from collections.abc import Callable
from datetime import datetime, timezone

from src.repository.attempt_repository import AttemptRepository
from src.repository.course_repository import CourseRepository
from src.repository.enrollment_repository import EnrollmentRepository
from src.repository.quiz_repository import QuizRepository
from src.service.access import course_of_quiz, require_learner_access
from src.service.grading import grade
from src.types.errors import InvalidSubmissionError
from src.types.models import Attempt, BestScore, User


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AttemptService:
    """Quiz attempts.

    Provisional (QZ-02 to QZ-04, EN-01, ACT-02): only enrolled learners submit; every attempt is
    stored with a timestamp and never changed or removed; the best score is the maximum.
    """

    def __init__(
        self,
        courses: CourseRepository,
        quizzes: QuizRepository,
        attempts: AttemptRepository,
        enrollments: EnrollmentRepository,
        clock: Callable[[], datetime] = _utc_now,
    ) -> None:
        self._courses = courses
        self._quizzes = quizzes
        self._attempts = attempts
        self._enrollments = enrollments
        self._clock = clock

    def submit(self, actor: User, quiz_id: int, answers: dict[int, int]) -> Attempt:
        self._authorize(actor, quiz_id)
        self._validate_answers(quiz_id, answers)
        correct, total, score = grade(self._quizzes.correct_option_ids(quiz_id), answers)
        submitted_at = self._clock().isoformat()
        return self._attempts.add(quiz_id, actor.id, score, correct, total, submitted_at, answers)

    def list_attempts(self, actor: User, quiz_id: int) -> list[Attempt]:
        self._authorize(actor, quiz_id)
        return self._attempts.list_for_learner(quiz_id, actor.id)

    def best_score(self, actor: User, quiz_id: int) -> BestScore:
        self._authorize(actor, quiz_id)
        history = self._attempts.list_for_learner(quiz_id, actor.id)
        best = max((attempt.score for attempt in history), default=None)
        return BestScore(quiz_id, best, len(history))

    def _authorize(self, actor: User, quiz_id: int) -> None:
        course = course_of_quiz(self._courses, self._quizzes, quiz_id)
        require_learner_access(actor, course, self._enrollments)

    def _validate_answers(self, quiz_id: int, answers: dict[int, int]) -> None:
        valid = self._quizzes.valid_option_ids(quiz_id)
        for question_id, option_id in answers.items():
            if question_id not in valid:
                raise InvalidSubmissionError(f"question {question_id} is not part of this quiz")
            if option_id not in valid[question_id]:
                raise InvalidSubmissionError(f"option {option_id} is not valid for question {question_id}")

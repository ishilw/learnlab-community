from collections.abc import Callable
from datetime import datetime, timezone

from src.repository.completion_repository import CompletionRepository
from src.repository.course_repository import CourseRepository
from src.repository.enrollment_repository import EnrollmentRepository
from src.repository.lesson_repository import LessonRepository
from src.service.access import course_or_not_found, require_learner_access
from src.service.authorization import can_manage_course
from src.types.errors import ForbiddenError
from src.types.models import CourseProgress, LearnerProgress, ProgressSummary, User


def progress_percent(completed: int, total: int) -> int:
    """Provisional (PR-02): completed over total, rounded down. No lessons means 0."""
    return 0 if total == 0 else completed * 100 // total


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ProgressService:
    """Lesson completion and course progress.

    Provisional (PR-01, PR-02, RP-01): only enrolled learners complete lessons of published
    courses; completion is idempotent; owners and admins read aggregate summaries.
    """

    def __init__(
        self,
        courses: CourseRepository,
        lessons: LessonRepository,
        enrollments: EnrollmentRepository,
        completions: CompletionRepository,
        clock: Callable[[], datetime] = _utc_now,
    ) -> None:
        self._courses = courses
        self._lessons = lessons
        self._enrollments = enrollments
        self._completions = completions
        self._clock = clock

    def complete_lesson(self, actor: User, lesson_id: int) -> None:
        course = course_or_not_found(
            self._courses, self._lessons.course_id_for_lesson(lesson_id), f"lesson {lesson_id}"
        )
        require_learner_access(actor, course, self._enrollments)
        self._completions.add(lesson_id, actor.id, self._clock().isoformat())

    def course_progress(self, actor: User, course_id: int) -> CourseProgress:
        course = course_or_not_found(self._courses, course_id, f"course {course_id}")
        require_learner_access(actor, course, self._enrollments)
        total = self._lessons.count_for_course(course_id)
        done = self._completions.completed_count(actor.id, course_id)
        return CourseProgress(course_id, done, total, progress_percent(done, total))

    def course_summary(self, actor: User, course_id: int) -> ProgressSummary:
        course = course_or_not_found(self._courses, course_id, f"course {course_id}")
        if not can_manage_course(actor, course):
            raise ForbiddenError("only the course owner or an administrator may read progress")
        total = self._lessons.count_for_course(course_id)
        learners = [
            LearnerProgress(learner_id, done, progress_percent(done, total))
            for learner_id, done in self._completions.enrolled_progress(course_id)
        ]
        average = sum(item.percent for item in learners) // len(learners) if learners else 0
        return ProgressSummary(course_id, total, len(learners), average, learners)

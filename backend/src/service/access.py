"""Shared access rules for course content.

Provisional (ACT-02, ACT-03, EN-01, CL-01): only enrolled learners use published course
content; owners and admins manage it; archived courses are read-only.
"""

from src.repository.course_repository import CourseRepository
from src.repository.enrollment_repository import EnrollmentRepository
from src.repository.quiz_repository import QuizRepository
from src.service.authorization import can_manage_course
from src.types.enums import CourseStatus, Role
from src.types.errors import CourseLockedError, ForbiddenError, NotFoundError
from src.types.models import Course, User


def course_or_not_found(courses: CourseRepository, course_id: int | None, what: str) -> Course:
    course = None if course_id is None else courses.get(course_id)
    if course is None:
        raise NotFoundError(f"{what} not found")
    return course


def course_of_quiz(courses: CourseRepository, quizzes: QuizRepository, quiz_id: int) -> Course:
    return course_or_not_found(courses, quizzes.course_id_for_quiz(quiz_id), f"quiz {quiz_id}")


def require_course_management(actor: User, course: Course) -> None:
    if not can_manage_course(actor, course):
        raise ForbiddenError("only the course owner or an administrator may manage this")
    if course.status == CourseStatus.ARCHIVED:
        raise CourseLockedError("archived courses are read-only")


def require_learner_access(
    actor: User, course: Course, enrollments: EnrollmentRepository
) -> None:
    """Learners act on a course only when it is published and they are enrolled."""
    if actor.role != Role.LEARNER:
        raise ForbiddenError("only learners may do this")
    if course.status != CourseStatus.PUBLISHED or not enrollments.exists(course.id, actor.id):
        raise NotFoundError(f"course {course.id} not found")

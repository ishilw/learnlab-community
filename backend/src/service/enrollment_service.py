from src.repository.course_repository import CourseRepository
from src.repository.enrollment_repository import EnrollmentRepository
from src.service.authorization import can_enroll
from src.types.enums import CourseStatus
from src.types.errors import (
    CourseNotOpenError,
    DuplicateEnrollmentError,
    ForbiddenError,
    NotFoundError,
)
from src.types.models import Course, User


class EnrollmentService:
    """Provisional (EN-01..03, ACT-02): learners enroll once, only in published courses."""

    def __init__(self, courses: CourseRepository, enrollments: EnrollmentRepository) -> None:
        self._courses = courses
        self._enrollments = enrollments

    def enroll(self, actor: User, course_id: int) -> None:
        if not can_enroll(actor):
            raise ForbiddenError("only learners enroll in courses")
        course = self._courses.get(course_id)
        if course is None:
            raise NotFoundError(f"course {course_id} not found")
        if course.status != CourseStatus.PUBLISHED:
            raise CourseNotOpenError("only published courses accept enrollment")
        if not self._enrollments.add(course_id, actor.id):
            raise DuplicateEnrollmentError("learner is already enrolled in this course")

    def list_enrollments(self, actor: User) -> list[Course]:
        course_ids = self._enrollments.course_ids_for_learner(actor.id)
        found = (self._courses.get(course_id) for course_id in course_ids)
        return [course for course in found if course is not None]

from dataclasses import replace

from src.repository.course_repository import CourseRepository
from src.service.authorization import can_create_course, can_manage_course, can_view_course
from src.service.lifecycle import ensure_transition
from src.types.enums import CourseStatus
from src.types.errors import CourseLockedError, ForbiddenError, NotFoundError
from src.types.models import Course, User


class CourseService:
    def __init__(self, courses: CourseRepository) -> None:
        self._courses = courses

    def create_course(self, actor: User, title: str, description: str) -> Course:
        if not can_create_course(actor):
            raise ForbiddenError("only instructors and administrators create courses")
        return self._courses.add(title, description, actor.id)

    def get_course(self, actor: User, course_id: int) -> Course:
        course = self._courses.get(course_id)
        if course is None or not can_view_course(actor, course):
            raise NotFoundError(f"course {course_id} not found")
        return course

    def list_catalog(self, actor: User, search: str | None = None) -> list[Course]:
        courses = self._courses.list_with_status([CourseStatus.PUBLISHED])

        if not search or not search.strip():
            return courses

        query = search.strip().casefold()

        return [
            course
            for course in courses
            if query in course.title.casefold()
            or query in course.description.casefold()
        ]

    def update_course(
        self,
        actor: User,
        course_id: int,
        title: str | None = None,
        description: str | None = None,
    ) -> Course:
        """Provisional (ACT-03, CL-01): owners and admins update; archived courses are read-only."""
        course = self._courses.get(course_id)
        if course is None:
            raise NotFoundError(f"course {course_id} not found")
        if not can_manage_course(actor, course):
            raise ForbiddenError("only the course owner or an administrator may update it")
        if course.status == CourseStatus.ARCHIVED:
            raise CourseLockedError("archived courses cannot be updated")
        new_title = course.title if title is None else title
        new_description = course.description if description is None else description
        self._courses.update(course.id, new_title, new_description)
        return replace(course, title=new_title, description=new_description)

    def transition_course(self, actor: User, course_id: int, target: CourseStatus) -> Course:
        course = self._courses.get(course_id)
        if course is None:
            raise NotFoundError(f"course {course_id} not found")
        if not can_manage_course(actor, course):
            raise ForbiddenError("only the course owner or an administrator may change its state")
        ensure_transition(course.status, target)
        self._courses.set_status(course.id, target)
        return replace(course, status=target)

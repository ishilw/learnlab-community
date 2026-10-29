from src.repository.course_repository import CourseRepository
from src.repository.enrollment_repository import EnrollmentRepository
from src.repository.lesson_repository import LessonRepository
from src.repository.module_repository import ModuleRepository
from src.service.authorization import can_manage_course
from src.types.enums import CourseStatus
from src.types.errors import CourseLockedError, ForbiddenError, NotFoundError
from src.types.models import Course, Lesson, Module, User


class ContentService:
    """Modules and lessons.

    Provisional (ACT-02, ACT-03, CL-01, ML-01, ML-02): owners and admins manage content;
    learners read content only for published courses they are enrolled in; archived
    courses are read-only.
    """

    def __init__(
        self,
        courses: CourseRepository,
        modules: ModuleRepository,
        lessons: LessonRepository,
        enrollments: EnrollmentRepository,
    ) -> None:
        self._courses = courses
        self._modules = modules
        self._lessons = lessons
        self._enrollments = enrollments

    def create_module(self, actor: User, course_id: int, title: str) -> Module:
        self._course_for_management(actor, course_id)
        return self._modules.add(course_id, title)

    def create_lesson(self, actor: User, module_id: int, title: str, content: str) -> Lesson:
        module = self._modules.get(module_id)
        if module is None:
            raise NotFoundError(f"module {module_id} not found")
        self._course_for_management(actor, module.course_id)
        return self._lessons.add(module_id, title, content)

    def list_course_content(
        self, actor: User, course_id: int
    ) -> list[tuple[Module, list[Lesson]]]:
        course = self._courses.get(course_id)
        if course is None or not self._can_read_content(actor, course):
            raise NotFoundError(f"course {course_id} not found")
        return [
            (module, self._lessons.list_for_module(module.id))
            for module in self._modules.list_for_course(course_id)
        ]

    def _course_for_management(self, actor: User, course_id: int) -> Course:
        course = self._courses.get(course_id)
        if course is None:
            raise NotFoundError(f"course {course_id} not found")
        if not can_manage_course(actor, course):
            raise ForbiddenError("only the course owner or an administrator may manage content")
        if course.status == CourseStatus.ARCHIVED:
            raise CourseLockedError("archived courses cannot be changed")
        return course

    def _can_read_content(self, actor: User, course: Course) -> bool:
        if can_manage_course(actor, course):
            return True
        return course.status == CourseStatus.PUBLISHED and self._enrollments.exists(
            course.id, actor.id
        )

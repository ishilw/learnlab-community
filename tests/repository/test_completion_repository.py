from src.repository.completion_repository import CompletionRepository
from src.repository.course_repository import CourseRepository
from src.repository.database import connect, init_schema
from src.repository.enrollment_repository import EnrollmentRepository
from src.repository.lesson_repository import LessonRepository
from src.repository.module_repository import ModuleRepository
from src.repository.user_repository import UserRepository
from src.types.enums import Role


def setup_course(tmp_path):
    conn = connect(str(tmp_path / "completion.db"))
    init_schema(conn)
    users = UserRepository(conn)
    owner = users.add("owner", Role.INSTRUCTOR)
    one = users.add("one", Role.LEARNER)
    two = users.add("two", Role.LEARNER)
    course = CourseRepository(conn).add("Course", "", owner.id)
    module = ModuleRepository(conn).add(course.id, "M")
    lessons = LessonRepository(conn)
    first = lessons.add(module.id, "L1", "c")
    second = lessons.add(module.id, "L2", "c")
    return conn, course, first, second, one, two


def test_lesson_lookup_and_course_count(tmp_path):
    conn, course, first, _, _, _ = setup_course(tmp_path)
    lessons = LessonRepository(conn)
    assert lessons.get(first.id).title == "L1"
    assert lessons.get(999) is None
    assert lessons.count_for_course(course.id) == 2
    assert lessons.course_id_for_lesson(first.id) == course.id


def test_add_is_idempotent(tmp_path):
    conn, _, first, _, one, _ = setup_course(tmp_path)
    completions = CompletionRepository(conn)
    assert completions.add(first.id, one.id, "2026-01-01T00:00:00+00:00") is True
    assert completions.add(first.id, one.id, "2026-01-01T00:00:09+00:00") is False


def test_completed_count_is_per_learner(tmp_path):
    conn, course, first, second, one, two = setup_course(tmp_path)
    completions = CompletionRepository(conn)
    completions.add(first.id, one.id, "2026-01-01T00:00:00+00:00")
    completions.add(second.id, one.id, "2026-01-01T00:00:01+00:00")
    assert completions.completed_count(one.id, course.id) == 2
    assert completions.completed_count(two.id, course.id) == 0


def test_enrolled_progress_lists_every_enrolled_learner(tmp_path):
    conn, course, first, _, one, two = setup_course(tmp_path)
    enrollments = EnrollmentRepository(conn)
    enrollments.add(course.id, one.id)
    enrollments.add(course.id, two.id)
    CompletionRepository(conn).add(first.id, one.id, "2026-01-01T00:00:00+00:00")
    assert CompletionRepository(conn).enrolled_progress(course.id) == [(one.id, 1), (two.id, 0)]

from src.repository.course_repository import CourseRepository
from src.repository.database import connect, init_schema
from src.repository.lesson_repository import LessonRepository
from src.repository.module_repository import ModuleRepository
from src.repository.user_repository import UserRepository
from src.types.enums import Role


def make_course(conn):
    owner = UserRepository(conn).add("owner", Role.INSTRUCTOR)
    return CourseRepository(conn).add("Course", "", owner.id)


def test_schema_contains_sprint2_tables(tmp_path):
    conn = connect(str(tmp_path / "s2.db"))
    init_schema(conn)
    names = {row[0] for row in conn.execute("SELECT name FROM sqlite_master WHERE type = 'table'")}
    assert {"modules", "lessons", "enrollments"} <= names


def test_module_positions_increase_per_course(tmp_path):
    conn = connect(str(tmp_path / "m.db"))
    init_schema(conn)
    course = make_course(conn)
    modules = ModuleRepository(conn)
    assert modules.add(course.id, "A").position == 1
    assert modules.add(course.id, "B").position == 2


def test_lesson_positions_increase_per_module(tmp_path):
    conn = connect(str(tmp_path / "l.db"))
    init_schema(conn)
    course = make_course(conn)
    module = ModuleRepository(conn).add(course.id, "M")
    lessons = LessonRepository(conn)
    assert lessons.add(module.id, "L1", "c").position == 1
    assert lessons.add(module.id, "L2", "c").position == 2


def test_modules_for_course_are_ordered(tmp_path):
    conn = connect(str(tmp_path / "o.db"))
    init_schema(conn)
    course = make_course(conn)
    modules = ModuleRepository(conn)
    modules.add(course.id, "A")
    modules.add(course.id, "B")
    assert [m.title for m in modules.list_for_course(course.id)] == ["A", "B"]

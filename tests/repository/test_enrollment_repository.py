from src.repository.course_repository import CourseRepository
from src.repository.database import connect, init_schema
from src.repository.enrollment_repository import EnrollmentRepository
from src.repository.user_repository import UserRepository
from src.types.enums import Role


def setup_db(tmp_path):
    conn = connect(str(tmp_path / "e.db"))
    init_schema(conn)
    users = UserRepository(conn)
    owner = users.add("owner", Role.INSTRUCTOR)
    learner = users.add("learner", Role.LEARNER)
    course = CourseRepository(conn).add("Course", "", owner.id)
    return conn, course, learner


def test_add_returns_true_then_false_for_duplicate(tmp_path):
    conn, course, learner = setup_db(tmp_path)
    enrollments = EnrollmentRepository(conn)
    assert enrollments.add(course.id, learner.id) is True
    assert enrollments.add(course.id, learner.id) is False


def test_exists_reflects_enrollment(tmp_path):
    conn, course, learner = setup_db(tmp_path)
    enrollments = EnrollmentRepository(conn)
    assert enrollments.exists(course.id, learner.id) is False
    enrollments.add(course.id, learner.id)
    assert enrollments.exists(course.id, learner.id) is True


def test_course_ids_for_learner(tmp_path):
    conn, course, learner = setup_db(tmp_path)
    enrollments = EnrollmentRepository(conn)
    enrollments.add(course.id, learner.id)
    assert enrollments.course_ids_for_learner(learner.id) == [course.id]

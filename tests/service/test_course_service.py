"""Course use cases against a temporary SQLite database."""

import pytest

from src.repository.course_repository import CourseRepository
from src.repository.database import connect, init_schema
from src.repository.user_repository import UserRepository
from src.service.course_service import CourseService
from src.types.enums import CourseStatus, Role
from src.types.errors import ForbiddenError, InvalidCourseStateException, NotFoundError


@pytest.fixture
def env(tmp_path):
    conn = connect(str(tmp_path / "service.db"))
    init_schema(conn)
    users = UserRepository(conn)
    learner = users.add("learner", Role.LEARNER)
    instructor = users.add("instructor", Role.INSTRUCTOR)
    other = users.add("other", Role.INSTRUCTOR)
    admin = users.add("admin", Role.ADMIN)
    service = CourseService(CourseRepository(conn))
    return service, {"learner": learner, "instructor": instructor, "other": other, "admin": admin}


def test_learner_cannot_create_course(env):
    service, users = env
    with pytest.raises(ForbiddenError):
        service.create_course(users["learner"], "Intro", "")


def test_instructor_creates_draft_owned_by_self(env):
    service, users = env
    created = service.create_course(users["instructor"], "Intro", "desc")
    assert created.status == CourseStatus.DRAFT
    assert created.owner_id == users["instructor"].id


def test_other_instructor_cannot_publish_course(env):
    service, users = env
    created = service.create_course(users["instructor"], "Intro", "")
    with pytest.raises(ForbiddenError):
        service.transition_course(users["other"], created.id, CourseStatus.PUBLISHED)


def test_owner_publishes_draft(env):
    service, users = env
    created = service.create_course(users["instructor"], "Intro", "")
    published = service.transition_course(users["instructor"], created.id, CourseStatus.PUBLISHED)
    assert published.status == CourseStatus.PUBLISHED


def test_published_cannot_return_to_draft(env):
    service, users = env
    created = service.create_course(users["instructor"], "Intro", "")
    service.transition_course(users["instructor"], created.id, CourseStatus.PUBLISHED)
    with pytest.raises(InvalidCourseStateException):
        service.transition_course(users["instructor"], created.id, CourseStatus.DRAFT)


def test_catalog_lists_only_published_courses(env):
    service, users = env
    service.create_course(users["instructor"], "Draft course", "")
    pub = service.create_course(users["instructor"], "Public course", "")
    service.transition_course(users["instructor"], pub.id, CourseStatus.PUBLISHED)
    titles = [c.title for c in service.list_catalog(users["learner"])]
    assert titles == ["Public course"]


def test_learner_cannot_see_draft_course(env):
    service, users = env
    created = service.create_course(users["instructor"], "Intro", "")
    with pytest.raises(NotFoundError):
        service.get_course(users["learner"], created.id)


def test_admin_can_transition_any_course(env):
    service, users = env
    created = service.create_course(users["instructor"], "Intro", "")
    archived = service.transition_course(users["admin"], created.id, CourseStatus.ARCHIVED)
    assert archived.status == CourseStatus.ARCHIVED

def test_catalog_search_matches_title_case_insensitively(env):
    service, users = env
    instructor = users["instructor"]
    learner = users["learner"]

    python_course = service.create_course(
        instructor, "Python Fundamentals", "Learn programming"
    )
    aws_course = service.create_course(
        instructor, "AWS Essentials", "Cloud computing"
    )

    service.transition_course(
        instructor, python_course.id, CourseStatus.PUBLISHED
    )
    service.transition_course(
        instructor, aws_course.id, CourseStatus.PUBLISHED
    )

    results = service.list_catalog(learner, search="PYTHON")

    assert len(results) == 1
    assert results[0].title == "Python Fundamentals"
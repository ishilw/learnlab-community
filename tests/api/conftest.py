import pytest
from fastapi.testclient import TestClient

from src.api.app import create_app
from src.repository.user_repository import UserRepository
from src.types.enums import Role


@pytest.fixture
def api(tmp_path):
    app = create_app(str(tmp_path / "api.db"))
    users = UserRepository(app.state.connection)
    client = TestClient(app)
    client.ids = {
        "learner": users.add("learner", Role.LEARNER).id,
        "learner2": users.add("learner2", Role.LEARNER).id,
        "instructor": users.add("instructor", Role.INSTRUCTOR).id,
        "other": users.add("other", Role.INSTRUCTOR).id,
        "admin": users.add("admin", Role.ADMIN).id,
    }
    return client


def as_user(client, who):
    return {"X-User-Id": str(client.ids[who])}


def publish_course(client, title="Course"):
    instructor = as_user(client, "instructor")
    course = client.post("/courses", json={"title": title}, headers=instructor).json()
    client.post(f"/courses/{course['id']}/transitions", json={"target": "published"}, headers=instructor)
    return course["id"]

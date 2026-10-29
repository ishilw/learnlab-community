import pytest
from fastapi.testclient import TestClient

from src.api.app import create_app
from src.repository.user_repository import UserRepository
from src.types.enums import Role


@pytest.fixture
def client(tmp_path):
    app = create_app(str(tmp_path / "api.db"))
    users = UserRepository(app.state.connection)
    ids = {
        "learner": users.add("learner", Role.LEARNER).id,
        "instructor": users.add("instructor", Role.INSTRUCTOR).id,
        "other": users.add("other", Role.INSTRUCTOR).id,
        "admin": users.add("admin", Role.ADMIN).id,
    }
    test_client = TestClient(app)
    test_client.ids = ids
    return test_client


def headers(client, who):
    return {"X-User-Id": str(client.ids[who])}


def test_request_without_identity_is_unauthorized(client):
    assert client.get("/courses").status_code == 401


def test_learner_cannot_create_course(client):
    response = client.post("/courses", json={"title": "Intro"}, headers=headers(client, "learner"))
    assert response.status_code == 403


def test_instructor_creates_draft_course(client):
    response = client.post(
        "/courses", json={"title": "Intro", "description": "d"}, headers=headers(client, "instructor")
    )
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "draft"
    assert body["owner_id"] == client.ids["instructor"]


def test_catalog_shows_only_published_courses(client):
    instructor = headers(client, "instructor")
    client.post("/courses", json={"title": "Draft"}, headers=instructor)
    created = client.post("/courses", json={"title": "Live"}, headers=instructor).json()
    client.post(
        f"/courses/{created['id']}/transitions", json={"target": "published"}, headers=instructor
    )
    titles = [c["title"] for c in client.get("/courses", headers=headers(client, "learner")).json()]
    assert titles == ["Live"]


def test_invalid_transition_returns_conflict(client):
    instructor = headers(client, "instructor")
    created = client.post("/courses", json={"title": "Intro"}, headers=instructor).json()
    response = client.post(
        f"/courses/{created['id']}/transitions", json={"target": "archived"}, headers=instructor
    )
    assert response.status_code == 200
    again = client.post(
        f"/courses/{created['id']}/transitions", json={"target": "published"}, headers=instructor
    )
    assert again.status_code == 409


def test_other_instructor_cannot_transition_course(client):
    created = client.post(
        "/courses", json={"title": "Intro"}, headers=headers(client, "instructor")
    ).json()
    response = client.post(
        f"/courses/{created['id']}/transitions",
        json={"target": "published"},
        headers=headers(client, "other"),
    )
    assert response.status_code == 403


def test_learner_gets_not_found_for_draft(client):
    created = client.post(
        "/courses", json={"title": "Intro"}, headers=headers(client, "instructor")
    ).json()
    response = client.get(f"/courses/{created['id']}", headers=headers(client, "learner"))
    assert response.status_code == 404

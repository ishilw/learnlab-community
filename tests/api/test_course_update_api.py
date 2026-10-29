def as_user(client, who):
    return {"X-User-Id": str(client.ids[who])}


def publish_course(client, title="Course"):
    instructor = as_user(client, "instructor")
    course = client.post("/courses", json={"title": title}, headers=instructor).json()
    client.post(f"/courses/{course['id']}/transitions", json={"target": "published"}, headers=instructor)
    return course["id"]


def test_owner_patches_course_title(api):
    course_id = publish_course(api)
    response = api.patch(
        f"/courses/{course_id}", json={"title": "Renamed"}, headers=as_user(api, "instructor")
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Renamed"


def test_learner_cannot_patch_course(api):
    course_id = publish_course(api)
    response = api.patch(
        f"/courses/{course_id}", json={"title": "Nope"}, headers=as_user(api, "learner")
    )
    assert response.status_code == 403


def test_patch_archived_course_is_conflict(api):
    course_id = publish_course(api)
    instructor = as_user(api, "instructor")
    api.post(f"/courses/{course_id}/transitions", json={"target": "archived"}, headers=instructor)
    response = api.patch(f"/courses/{course_id}", json={"title": "x"}, headers=instructor)
    assert response.status_code == 409


def test_published_cannot_return_to_draft_over_api(api):
    course_id = publish_course(api)
    response = api.post(
        f"/courses/{course_id}/transitions",
        json={"target": "draft"},
        headers=as_user(api, "instructor"),
    )
    assert response.status_code == 409


def test_unpublished_cannot_return_to_draft_over_api(api):
    course_id = publish_course(api)
    instructor = as_user(api, "instructor")
    api.post(f"/courses/{course_id}/transitions", json={"target": "unpublished"}, headers=instructor)
    response = api.post(
        f"/courses/{course_id}/transitions", json={"target": "draft"}, headers=instructor
    )
    assert response.status_code == 409


def test_unpublish_then_republish_over_api(api):
    course_id = publish_course(api)
    instructor = as_user(api, "instructor")
    first = api.post(
        f"/courses/{course_id}/transitions", json={"target": "unpublished"}, headers=instructor
    )
    second = api.post(
        f"/courses/{course_id}/transitions", json={"target": "published"}, headers=instructor
    )
    assert first.status_code == 200
    assert second.status_code == 200

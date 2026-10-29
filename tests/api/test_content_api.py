def as_user(client, who):
    return {"X-User-Id": str(client.ids[who])}


def publish_course(client, title="Course"):
    instructor = as_user(client, "instructor")
    course = client.post("/courses", json={"title": title}, headers=instructor).json()
    client.post(f"/courses/{course['id']}/transitions", json={"target": "published"}, headers=instructor)
    return course["id"]


def test_instructor_creates_module_and_lesson(api):
    course_id = publish_course(api)
    instructor = as_user(api, "instructor")
    module = api.post(f"/courses/{course_id}/modules", json={"title": "M"}, headers=instructor)
    assert module.status_code == 201
    lesson = api.post(
        f"/modules/{module.json()['id']}/lessons",
        json={"title": "L", "content": "text"},
        headers=instructor,
    )
    assert lesson.status_code == 201
    assert lesson.json()["position"] == 1


def test_content_listing_is_nested_and_ordered(api):
    course_id = publish_course(api)
    instructor = as_user(api, "instructor")
    api.post(f"/courses/{course_id}/modules", json={"title": "First"}, headers=instructor)
    api.post(f"/courses/{course_id}/modules", json={"title": "Second"}, headers=instructor)
    api.post(f"/courses/{course_id}/enrollments", headers=as_user(api, "learner"))
    listing = api.get(f"/courses/{course_id}/modules", headers=as_user(api, "learner")).json()
    assert [m["title"] for m in listing] == ["First", "Second"]
    assert listing[0]["lessons"] == []


def test_unenrolled_learner_gets_not_found_for_content(api):
    course_id = publish_course(api)
    response = api.get(f"/courses/{course_id}/modules", headers=as_user(api, "learner"))
    assert response.status_code == 404


def test_learner_cannot_create_module(api):
    course_id = publish_course(api)
    response = api.post(
        f"/courses/{course_id}/modules", json={"title": "x"}, headers=as_user(api, "learner")
    )
    assert response.status_code == 403

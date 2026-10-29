def as_user(client, who):
    return {"X-User-Id": str(client.ids[who])}


def publish_course(client, title="Course"):
    instructor = as_user(client, "instructor")
    course = client.post("/courses", json={"title": title}, headers=instructor).json()
    client.post(f"/courses/{course['id']}/transitions", json={"target": "published"}, headers=instructor)
    return course["id"]


def test_learner_enrolls_in_published_course(api):
    course_id = publish_course(api)
    response = api.post(f"/courses/{course_id}/enrollments", headers=as_user(api, "learner"))
    assert response.status_code == 201
    assert response.json() == {"course_id": course_id, "learner_id": api.ids["learner"]}


def test_duplicate_enrollment_is_conflict(api):
    course_id = publish_course(api)
    learner = as_user(api, "learner")
    api.post(f"/courses/{course_id}/enrollments", headers=learner)
    response = api.post(f"/courses/{course_id}/enrollments", headers=learner)
    assert response.status_code == 409


def test_enrollment_into_draft_is_conflict(api):
    course = api.post(
        "/courses", json={"title": "Draft"}, headers=as_user(api, "instructor")
    ).json()
    response = api.post(f"/courses/{course['id']}/enrollments", headers=as_user(api, "learner"))
    assert response.status_code == 409


def test_instructor_cannot_enroll(api):
    course_id = publish_course(api)
    response = api.post(f"/courses/{course_id}/enrollments", headers=as_user(api, "instructor"))
    assert response.status_code == 403


def test_list_enrollments_returns_own_courses(api):
    course_id = publish_course(api)
    learner = as_user(api, "learner")
    api.post(f"/courses/{course_id}/enrollments", headers=learner)
    response = api.get("/enrollments", headers=learner)
    assert response.status_code == 200
    assert [c["id"] for c in response.json()] == [course_id]

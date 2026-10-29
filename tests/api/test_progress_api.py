def as_user(client, who):
    return {"X-User-Id": str(client.ids[who])}


def course_with_lessons(client, count=2):
    instructor = as_user(client, "instructor")
    course = client.post("/courses", json={"title": "C"}, headers=instructor).json()
    client.post(f"/courses/{course['id']}/transitions", json={"target": "published"}, headers=instructor)
    module = client.post(f"/courses/{course['id']}/modules", json={"title": "M"}, headers=instructor).json()
    lessons = [
        client.post(
            f"/modules/{module['id']}/lessons", json={"title": f"L{i}", "content": "c"}, headers=instructor
        ).json()["id"]
        for i in range(count)
    ]
    return course["id"], lessons


def enroll(client, course_id, who="learner"):
    client.post(f"/courses/{course_id}/enrollments", headers=as_user(client, who))


def test_lesson_completion_is_idempotent(api):
    course_id, lessons = course_with_lessons(api)
    enroll(api, course_id)
    learner = as_user(api, "learner")
    first = api.post(f"/lessons/{lessons[0]}/completion", headers=learner)
    second = api.post(f"/lessons/{lessons[0]}/completion", headers=learner)
    assert (first.status_code, second.status_code) == (200, 200)
    assert second.json() == {"lesson_id": lessons[0], "completed": True}
    progress = api.get(f"/courses/{course_id}/progress", headers=learner).json()
    assert progress == {"course_id": course_id, "completed_lessons": 1, "total_lessons": 2, "percent": 50}


def test_progress_is_integer_and_floored(api):
    course_id, lessons = course_with_lessons(api, 3)
    enroll(api, course_id)
    learner = as_user(api, "learner")
    api.post(f"/lessons/{lessons[0]}/completion", headers=learner)
    percent = api.get(f"/courses/{course_id}/progress", headers=learner).json()["percent"]
    assert percent == 33 and isinstance(percent, int)


def test_unenrolled_learner_cannot_complete_lesson(api):
    _, lessons = course_with_lessons(api)
    response = api.post(f"/lessons/{lessons[0]}/completion", headers=as_user(api, "learner"))
    assert response.status_code == 404


def test_instructor_cannot_complete_lesson(api):
    _, lessons = course_with_lessons(api)
    response = api.post(f"/lessons/{lessons[0]}/completion", headers=as_user(api, "instructor"))
    assert response.status_code == 403


def test_instructor_reads_aggregate_summary(api):
    course_id, lessons = course_with_lessons(api)
    enroll(api, course_id)
    enroll(api, course_id, "learner2")
    api.post(f"/lessons/{lessons[0]}/completion", headers=as_user(api, "learner"))
    summary = api.get(f"/courses/{course_id}/progress-summary", headers=as_user(api, "instructor"))
    assert summary.status_code == 200
    body = summary.json()
    assert (body["total_lessons"], body["enrolled_learners"], body["average_percent"]) == (2, 2, 25)
    assert sorted(item["percent"] for item in body["learners"]) == [0, 50]


def test_learner_and_other_instructor_cannot_read_summary(api):
    course_id, _ = course_with_lessons(api)
    for who in ("learner", "other"):
        response = api.get(f"/courses/{course_id}/progress-summary", headers=as_user(api, who))
        assert response.status_code == 403

import json

from src.repository.quiz_repository import QuizRepository


def as_user(client, who):
    return {"X-User-Id": str(client.ids[who])}


def build_quiz(client):
    """Published course with one lesson and a three-question quiz. Returns (course_id, quiz_id)."""
    instructor = as_user(client, "instructor")
    course = client.post("/courses", json={"title": "C"}, headers=instructor).json()
    client.post(f"/courses/{course['id']}/transitions", json={"target": "published"}, headers=instructor)
    module = client.post(f"/courses/{course['id']}/modules", json={"title": "M"}, headers=instructor).json()
    lesson = client.post(
        f"/modules/{module['id']}/lessons", json={"title": "L", "content": "c"}, headers=instructor
    ).json()
    quiz = client.post(f"/lessons/{lesson['id']}/quizzes", json={"title": "Quiz"}, headers=instructor).json()
    client.post(
        f"/quizzes/{quiz['id']}/questions/mcq",
        json={"prompt": "Q1", "choices": ["a", "b", "c"], "correct_index": 1},
        headers=instructor,
    )
    client.post(
        f"/quizzes/{quiz['id']}/questions/mcq",
        json={"prompt": "Q2", "choices": ["x", "y"], "correct_index": 0},
        headers=instructor,
    )
    client.post(
        f"/quizzes/{quiz['id']}/questions/true-false",
        json={"prompt": "Q3", "correct": True},
        headers=instructor,
    )
    return course["id"], quiz["id"]


def enroll(client, course_id, who="learner"):
    client.post(f"/courses/{course_id}/enrollments", headers=as_user(client, who))


def answers(client, quiz_id, correct):
    repo = QuizRepository(client.app.state.connection)
    key = repo.correct_option_ids(quiz_id)
    chosen = {}
    for question in repo.list_questions(quiz_id):
        options = [o.id for o in repo.list_options(question.id)]
        chosen[str(question.id)] = key[question.id] if correct else next(o for o in options if o != key[question.id])
    return {"answers": chosen}


def test_quiz_view_never_exposes_correct_answers(api):
    course_id, quiz_id = build_quiz(api)
    enroll(api, course_id)
    for who in ("learner", "instructor"):
        response = api.get(f"/quizzes/{quiz_id}", headers=as_user(api, who))
        assert response.status_code == 200
        body = json.dumps(response.json()).lower()
        assert "correct" not in body
        assert len(response.json()["questions"]) == 3


def test_learner_submits_and_gets_integer_percent(api):
    course_id, quiz_id = build_quiz(api)
    enroll(api, course_id)
    response = api.post(
        f"/quizzes/{quiz_id}/attempts", json=answers(api, quiz_id, True), headers=as_user(api, "learner")
    )
    assert response.status_code == 201
    assert response.json()["score"] == 100
    assert isinstance(response.json()["score"], int)


def test_multiple_attempts_are_kept_and_best_score_is_maximum(api):
    course_id, quiz_id = build_quiz(api)
    enroll(api, course_id)
    learner = as_user(api, "learner")
    api.post(f"/quizzes/{quiz_id}/attempts", json=answers(api, quiz_id, True), headers=learner)
    api.post(f"/quizzes/{quiz_id}/attempts", json=answers(api, quiz_id, False), headers=learner)
    history = api.get(f"/quizzes/{quiz_id}/attempts", headers=learner).json()
    assert [a["score"] for a in history] == [100, 0]
    assert all(a["submitted_at"] for a in history)
    best = api.get(f"/quizzes/{quiz_id}/best-score", headers=learner).json()
    assert best == {"quiz_id": quiz_id, "best_score": 100, "attempts": 2}


def test_unenrolled_learner_gets_not_found(api):
    _, quiz_id = build_quiz(api)
    assert api.get(f"/quizzes/{quiz_id}", headers=as_user(api, "learner")).status_code == 404
    response = api.post(
        f"/quizzes/{quiz_id}/attempts", json=answers(api, quiz_id, True), headers=as_user(api, "learner")
    )
    assert response.status_code == 404


def test_instructor_cannot_submit_attempt(api):
    _, quiz_id = build_quiz(api)
    response = api.post(
        f"/quizzes/{quiz_id}/attempts", json=answers(api, quiz_id, True), headers=as_user(api, "instructor")
    )
    assert response.status_code == 403


def test_learner_cannot_author_quizzes(api):
    course_id, quiz_id = build_quiz(api)
    enroll(api, course_id)
    response = api.post(
        f"/quizzes/{quiz_id}/questions/true-false",
        json={"prompt": "No", "correct": False},
        headers=as_user(api, "learner"),
    )
    assert response.status_code == 403


def test_invalid_answer_is_unprocessable_and_not_recorded(api):
    course_id, quiz_id = build_quiz(api)
    enroll(api, course_id)
    learner = as_user(api, "learner")
    bad = api.post(f"/quizzes/{quiz_id}/attempts", json={"answers": {"9999": 1}}, headers=learner)
    assert bad.status_code == 422
    assert api.get(f"/quizzes/{quiz_id}/attempts", headers=learner).json() == []


def test_question_changes_are_conflict_after_first_attempt(api):
    course_id, quiz_id = build_quiz(api)
    enroll(api, course_id)
    api.post(
        f"/quizzes/{quiz_id}/attempts", json=answers(api, quiz_id, True), headers=as_user(api, "learner")
    )
    response = api.post(
        f"/quizzes/{quiz_id}/questions/true-false",
        json={"prompt": "Late", "correct": True},
        headers=as_user(api, "instructor"),
    )
    assert response.status_code == 409


def test_owner_renames_quiz(api):
    _, quiz_id = build_quiz(api)
    response = api.patch(
        f"/quizzes/{quiz_id}", json={"title": "Final"}, headers=as_user(api, "instructor")
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Final"


def lesson_with_quizzes(client, titles):
    instructor = as_user(client, "instructor")
    course = client.post("/courses", json={"title": "C"}, headers=instructor).json()
    module = client.post(f"/courses/{course['id']}/modules", json={"title": "M"}, headers=instructor).json()
    lesson = client.post(
        f"/modules/{module['id']}/lessons", json={"title": "L", "content": "c"}, headers=instructor
    ).json()
    for title in titles:
        client.post(f"/lessons/{lesson['id']}/quizzes", json={"title": title}, headers=instructor)
    return lesson["id"]


def test_instructor_lists_quizzes_of_a_lesson_in_creation_order(api):
    lesson_id = lesson_with_quizzes(api, ["One", "Two"])
    response = api.get(f"/lessons/{lesson_id}/quizzes", headers=as_user(api, "instructor"))
    assert response.status_code == 200
    assert [q["title"] for q in response.json()] == ["One", "Two"]
    assert all(q["lesson_id"] == lesson_id for q in response.json())


def test_listing_survives_a_new_client_session(api):
    lesson_id = lesson_with_quizzes(api, ["Kept"])
    for _ in range(2):
        response = api.get(f"/lessons/{lesson_id}/quizzes", headers=as_user(api, "instructor"))
        assert [q["title"] for q in response.json()] == ["Kept"]


def test_lesson_quiz_listing_never_exposes_correct_answers(api):
    _, quiz_id = build_quiz(api)
    lesson_id = api.get(f"/quizzes/{quiz_id}", headers=as_user(api, "instructor")).json()["lesson_id"]
    body = api.get(f"/lessons/{lesson_id}/quizzes", headers=as_user(api, "instructor"))
    assert body.status_code == 200
    assert "correct" not in json.dumps(body.json()).lower()


def test_lesson_quiz_listing_requires_a_known_user(api):
    lesson_id = lesson_with_quizzes(api, ["One"])
    assert api.get(f"/lessons/{lesson_id}/quizzes").status_code == 401


def test_other_roles_cannot_list_lesson_quizzes(api):
    lesson_id = lesson_with_quizzes(api, ["One"])
    for who in ("learner", "other"):
        response = api.get(f"/lessons/{lesson_id}/quizzes", headers=as_user(api, who))
        assert response.status_code == 403


def test_listing_quizzes_for_a_missing_lesson_is_404(api):
    response = api.get("/lessons/999/quizzes", headers=as_user(api, "instructor"))
    assert response.status_code == 404

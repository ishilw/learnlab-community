from src.repository.course_repository import CourseRepository
from src.repository.database import connect, init_schema
from src.repository.lesson_repository import LessonRepository
from src.repository.module_repository import ModuleRepository
from src.repository.quiz_repository import QuizRepository
from src.repository.user_repository import UserRepository
from src.types.enums import QuestionKind, Role


def setup_lesson(tmp_path):
    conn = connect(str(tmp_path / "quiz.db"))
    init_schema(conn)
    owner = UserRepository(conn).add("owner", Role.INSTRUCTOR)
    course = CourseRepository(conn).add("Course", "", owner.id)
    module = ModuleRepository(conn).add(course.id, "M")
    lesson = LessonRepository(conn).add(module.id, "L", "c")
    return conn, course, lesson


def test_quiz_is_created_read_and_renamed(tmp_path):
    conn, _, lesson = setup_lesson(tmp_path)
    quizzes = QuizRepository(conn)
    quiz = quizzes.add_quiz(lesson.id, "Quiz")
    quizzes.update_title(quiz.id, "Renamed")
    assert quizzes.get(quiz.id).title == "Renamed"


def test_course_id_is_resolved_from_quiz(tmp_path):
    conn, course, lesson = setup_lesson(tmp_path)
    quizzes = QuizRepository(conn)
    quiz = quizzes.add_quiz(lesson.id, "Quiz")
    assert quizzes.course_id_for_quiz(quiz.id) == course.id
    assert quizzes.course_id_for_quiz(999) is None


def test_questions_and_options_are_ordered(tmp_path):
    conn, _, lesson = setup_lesson(tmp_path)
    quizzes = QuizRepository(conn)
    quiz = quizzes.add_quiz(lesson.id, "Quiz")
    first = quizzes.add_question(quiz.id, QuestionKind.MCQ, "Q1", ["a", "b", "c"], 2)
    second = quizzes.add_question(quiz.id, QuestionKind.MCQ, "Q2", ["x", "y"], 0)
    assert [q.position for q in quizzes.list_questions(quiz.id)] == [1, 2]
    assert [o.text for o in quizzes.list_options(first.id)] == ["a", "b", "c"]
    assert second.position == 2


def test_correct_option_ids_follow_the_stored_key(tmp_path):
    conn, _, lesson = setup_lesson(tmp_path)
    quizzes = QuizRepository(conn)
    quiz = quizzes.add_quiz(lesson.id, "Quiz")
    question = quizzes.add_question(quiz.id, QuestionKind.MCQ, "Q", ["a", "b", "c"], 1)
    options = quizzes.list_options(question.id)
    assert quizzes.correct_option_ids(quiz.id) == {question.id: options[1].id}
    assert quizzes.valid_option_ids(quiz.id) == {question.id: {o.id for o in options}}


def test_quizzes_for_a_lesson_are_listed_in_creation_order(tmp_path):
    conn, _, lesson = setup_lesson(tmp_path)
    quizzes = QuizRepository(conn)
    second_lesson = LessonRepository(conn).add(lesson.module_id, "L2", "c")
    first = quizzes.add_quiz(lesson.id, "B title")
    second = quizzes.add_quiz(lesson.id, "A title")
    quizzes.add_quiz(second_lesson.id, "Elsewhere")
    assert [q.id for q in quizzes.list_for_lesson(lesson.id)] == [first.id, second.id]


def test_listing_quizzes_for_a_lesson_without_quizzes_is_empty(tmp_path):
    conn, _, lesson = setup_lesson(tmp_path)
    assert QuizRepository(conn).list_for_lesson(lesson.id) == []
    assert QuizRepository(conn).list_for_lesson(999) == []

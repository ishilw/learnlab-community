import sqlite3

from src.types.enums import QuestionKind
from src.types.models import Option, Question, Quiz


class QuizRepository:
    """Quizzes, questions, and options. The answer key stays inside this layer's queries."""

    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn

    def add_quiz(self, lesson_id: int, title: str) -> Quiz:
        cursor = self._conn.execute(
            "INSERT INTO quizzes (lesson_id, title) VALUES (?, ?)", (lesson_id, title)
        )
        self._conn.commit()
        assert cursor.lastrowid is not None
        return Quiz(id=cursor.lastrowid, lesson_id=lesson_id, title=title)

    def get(self, quiz_id: int) -> Quiz | None:
        row = self._conn.execute(
            "SELECT id, lesson_id, title FROM quizzes WHERE id = ?", (quiz_id,)
        ).fetchone()
        return None if row is None else Quiz(row["id"], row["lesson_id"], row["title"])

    def list_for_lesson(self, lesson_id: int) -> list[Quiz]:
        rows = self._conn.execute(
            "SELECT id, lesson_id, title FROM quizzes WHERE lesson_id = ? ORDER BY id",
            (lesson_id,),
        ).fetchall()
        return [Quiz(r["id"], r["lesson_id"], r["title"]) for r in rows]

    def update_title(self, quiz_id: int, title: str) -> None:
        self._conn.execute("UPDATE quizzes SET title = ? WHERE id = ?", (title, quiz_id))
        self._conn.commit()

    def course_id_for_quiz(self, quiz_id: int) -> int | None:
        row = self._conn.execute(
            "SELECT m.course_id FROM quizzes q JOIN lessons l ON l.id = q.lesson_id "
            "JOIN modules m ON m.id = l.module_id WHERE q.id = ?",
            (quiz_id,),
        ).fetchone()
        return None if row is None else int(row["course_id"])

    def add_question(
        self,
        quiz_id: int,
        kind: QuestionKind,
        prompt: str,
        choices: list[str],
        correct_index: int,
    ) -> Question:
        with self._conn:
            cursor = self._conn.execute(
                "INSERT INTO questions (quiz_id, position, kind, prompt) VALUES (?, "
                "(SELECT COALESCE(MAX(position), 0) + 1 FROM questions WHERE quiz_id = ?), ?, ?)",
                (quiz_id, quiz_id, kind.value, prompt),
            )
            question_id = cursor.lastrowid
            assert question_id is not None
            self._insert_options(question_id, choices, correct_index)
        position = self._conn.execute(
            "SELECT position FROM questions WHERE id = ?", (question_id,)
        ).fetchone()["position"]
        return Question(question_id, quiz_id, position, kind, prompt)

    def _insert_options(self, question_id: int, choices: list[str], correct_index: int) -> None:
        for index, text in enumerate(choices):
            self._conn.execute(
                "INSERT INTO question_options (question_id, position, text, is_correct) "
                "VALUES (?, ?, ?, ?)",
                (question_id, index + 1, text, 1 if index == correct_index else 0),
            )

    def list_questions(self, quiz_id: int) -> list[Question]:
        rows = self._conn.execute(
            "SELECT id, quiz_id, position, kind, prompt FROM questions "
            "WHERE quiz_id = ? ORDER BY position",
            (quiz_id,),
        ).fetchall()
        return [
            Question(r["id"], r["quiz_id"], r["position"], QuestionKind(r["kind"]), r["prompt"])
            for r in rows
        ]

    def list_options(self, question_id: int) -> list[Option]:
        rows = self._conn.execute(
            "SELECT id, question_id, position, text FROM question_options "
            "WHERE question_id = ? ORDER BY position",
            (question_id,),
        ).fetchall()
        return [Option(r["id"], r["question_id"], r["position"], r["text"]) for r in rows]

    def correct_option_ids(self, quiz_id: int) -> dict[int, int]:
        """Answer key: question id to the id of its correct option. For grading only."""
        rows = self._conn.execute(
            "SELECT o.question_id, o.id FROM question_options o "
            "JOIN questions q ON q.id = o.question_id WHERE q.quiz_id = ? AND o.is_correct = 1",
            (quiz_id,),
        ).fetchall()
        return {r["question_id"]: r["id"] for r in rows}

    def valid_option_ids(self, quiz_id: int) -> dict[int, set[int]]:
        rows = self._conn.execute(
            "SELECT o.question_id, o.id FROM question_options o "
            "JOIN questions q ON q.id = o.question_id WHERE q.quiz_id = ?",
            (quiz_id,),
        ).fetchall()
        valid: dict[int, set[int]] = {}
        for row in rows:
            valid.setdefault(row["question_id"], set()).add(row["id"])
        return valid

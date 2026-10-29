import sqlite3

from src.types.models import Attempt

_COLUMNS = "id, quiz_id, learner_id, score, correct_count, total_questions, submitted_at"


class AttemptRepository:
    """Append-only quiz attempts. There is deliberately no update or delete method, and the
    schema triggers reject any UPDATE or DELETE on attempts and their answers."""

    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn

    def add(
        self,
        quiz_id: int,
        learner_id: int,
        score: int,
        correct_count: int,
        total_questions: int,
        submitted_at: str,
        answers: dict[int, int],
    ) -> Attempt:
        with self._conn:
            cursor = self._conn.execute(
                "INSERT INTO attempts (quiz_id, learner_id, score, correct_count, "
                "total_questions, submitted_at) VALUES (?, ?, ?, ?, ?, ?)",
                (quiz_id, learner_id, score, correct_count, total_questions, submitted_at),
            )
            attempt_id = cursor.lastrowid
            assert attempt_id is not None
            self._conn.executemany(
                "INSERT INTO attempt_answers (attempt_id, question_id, option_id) VALUES (?, ?, ?)",
                [(attempt_id, question_id, option_id) for question_id, option_id in answers.items()],
            )
        return Attempt(
            attempt_id, quiz_id, learner_id, score, correct_count, total_questions, submitted_at
        )

    def list_for_learner(self, quiz_id: int, learner_id: int) -> list[Attempt]:
        rows = self._conn.execute(
            f"SELECT {_COLUMNS} FROM attempts WHERE quiz_id = ? AND learner_id = ? ORDER BY id",
            (quiz_id, learner_id),
        ).fetchall()
        return [self._to_attempt(row) for row in rows]

    def best_score(self, quiz_id: int, learner_id: int) -> int | None:
        row = self._conn.execute(
            "SELECT MAX(score) AS best FROM attempts WHERE quiz_id = ? AND learner_id = ?",
            (quiz_id, learner_id),
        ).fetchone()
        return None if row["best"] is None else int(row["best"])

    def count_for_quiz(self, quiz_id: int) -> int:
        row = self._conn.execute(
            "SELECT COUNT(*) AS n FROM attempts WHERE quiz_id = ?", (quiz_id,)
        ).fetchone()
        return int(row["n"])

    @staticmethod
    def _to_attempt(row: sqlite3.Row) -> Attempt:
        return Attempt(
            row["id"],
            row["quiz_id"],
            row["learner_id"],
            row["score"],
            row["correct_count"],
            row["total_questions"],
            row["submitted_at"],
        )

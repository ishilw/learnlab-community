import sqlite3

_COURSE_LESSONS = (
    "SELECT l.id FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = ?"
)


class CompletionRepository:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn

    def add(self, lesson_id: int, learner_id: int, completed_at: str) -> bool:
        """Record a completion. Returns False when it was already recorded (idempotent)."""
        cursor = self._conn.execute(
            "INSERT OR IGNORE INTO lesson_completions (lesson_id, learner_id, completed_at) "
            "VALUES (?, ?, ?)",
            (lesson_id, learner_id, completed_at),
        )
        self._conn.commit()
        return cursor.rowcount == 1

    def completed_count(self, learner_id: int, course_id: int) -> int:
        row = self._conn.execute(
            "SELECT COUNT(*) AS n FROM lesson_completions "
            f"WHERE learner_id = ? AND lesson_id IN ({_COURSE_LESSONS})",
            (learner_id, course_id),
        ).fetchone()
        return int(row["n"])

    def enrolled_progress(self, course_id: int) -> list[tuple[int, int]]:
        """(learner id, completed lesson count) for every learner enrolled in the course."""
        rows = self._conn.execute(
            "SELECT e.learner_id AS learner_id, COUNT(c.id) AS done FROM enrollments e "
            "LEFT JOIN lesson_completions c ON c.learner_id = e.learner_id "
            f"AND c.lesson_id IN ({_COURSE_LESSONS}) "
            "WHERE e.course_id = ? GROUP BY e.learner_id ORDER BY e.learner_id",
            (course_id, course_id),
        ).fetchall()
        return [(int(r["learner_id"]), int(r["done"])) for r in rows]

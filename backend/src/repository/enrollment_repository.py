import sqlite3


class EnrollmentRepository:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn

    def add(self, course_id: int, learner_id: int) -> bool:
        """Insert an enrollment. Returns False when the learner is already enrolled."""
        cursor = self._conn.execute(
            "INSERT OR IGNORE INTO enrollments (course_id, learner_id) VALUES (?, ?)",
            (course_id, learner_id),
        )
        self._conn.commit()
        return cursor.rowcount == 1

    def exists(self, course_id: int, learner_id: int) -> bool:
        row = self._conn.execute(
            "SELECT 1 FROM enrollments WHERE course_id = ? AND learner_id = ?",
            (course_id, learner_id),
        ).fetchone()
        return row is not None

    def course_ids_for_learner(self, learner_id: int) -> list[int]:
        rows = self._conn.execute(
            "SELECT course_id FROM enrollments WHERE learner_id = ? ORDER BY course_id",
            (learner_id,),
        ).fetchall()
        return [row["course_id"] for row in rows]

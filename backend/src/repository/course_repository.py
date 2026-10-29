import sqlite3
from collections.abc import Sequence

from src.types.enums import CourseStatus
from src.types.models import Course


class CourseRepository:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn

    def add(self, title: str, description: str, owner_id: int) -> Course:
        cursor = self._conn.execute(
            "INSERT INTO courses (title, description, owner_id, status) VALUES (?, ?, ?, ?)",
            (title, description, owner_id, CourseStatus.DRAFT.value),
        )
        self._conn.commit()
        assert cursor.lastrowid is not None
        return Course(
            id=cursor.lastrowid,
            title=title,
            description=description,
            owner_id=owner_id,
            status=CourseStatus.DRAFT,
        )

    def get(self, course_id: int) -> Course | None:
        row = self._conn.execute(
            "SELECT id, title, description, owner_id, status FROM courses WHERE id = ?",
            (course_id,),
        ).fetchone()
        return None if row is None else self._to_course(row)

    def list_with_status(self, statuses: Sequence[CourseStatus]) -> list[Course]:
        placeholders = ", ".join("?" for _ in statuses)
        rows = self._conn.execute(
            "SELECT id, title, description, owner_id, status FROM courses "
            f"WHERE status IN ({placeholders}) ORDER BY id",
            [status.value for status in statuses],
        ).fetchall()
        return [self._to_course(row) for row in rows]

    def set_status(self, course_id: int, status: CourseStatus) -> None:
        self._conn.execute(
            "UPDATE courses SET status = ? WHERE id = ?", (status.value, course_id)
        )
        self._conn.commit()

    def update(self, course_id: int, title: str, description: str) -> None:
        self._conn.execute(
            "UPDATE courses SET title = ?, description = ? WHERE id = ?",
            (title, description, course_id),
        )
        self._conn.commit()

    @staticmethod
    def _to_course(row: sqlite3.Row) -> Course:
        return Course(
            id=row["id"],
            title=row["title"],
            description=row["description"],
            owner_id=row["owner_id"],
            status=CourseStatus(row["status"]),
        )

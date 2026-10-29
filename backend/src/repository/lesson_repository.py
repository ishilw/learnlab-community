import sqlite3

from src.types.models import Lesson

_COLUMNS = "id, module_id, title, content, position"


class LessonRepository:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn

    def add(self, module_id: int, title: str, content: str) -> Lesson:
        cursor = self._conn.execute(
            "INSERT INTO lessons (module_id, title, content, position) VALUES (?, ?, ?, "
            "(SELECT COALESCE(MAX(position), 0) + 1 FROM lessons WHERE module_id = ?))",
            (module_id, title, content, module_id),
        )
        self._conn.commit()
        row = self._conn.execute(
            f"SELECT {_COLUMNS} FROM lessons WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
        return self._to_lesson(row)

    def get(self, lesson_id: int) -> Lesson | None:
        row = self._conn.execute(
            f"SELECT {_COLUMNS} FROM lessons WHERE id = ?", (lesson_id,)
        ).fetchone()
        return None if row is None else self._to_lesson(row)

    def course_id_for_lesson(self, lesson_id: int) -> int | None:
        row = self._conn.execute(
            "SELECT m.course_id FROM lessons l JOIN modules m ON m.id = l.module_id WHERE l.id = ?",
            (lesson_id,),
        ).fetchone()
        return None if row is None else int(row["course_id"])

    def count_for_course(self, course_id: int) -> int:
        row = self._conn.execute(
            "SELECT COUNT(*) AS n FROM lessons l JOIN modules m ON m.id = l.module_id "
            "WHERE m.course_id = ?",
            (course_id,),
        ).fetchone()
        return int(row["n"])

    def list_for_module(self, module_id: int) -> list[Lesson]:
        rows = self._conn.execute(
            f"SELECT {_COLUMNS} FROM lessons WHERE module_id = ? ORDER BY position",
            (module_id,),
        ).fetchall()
        return [self._to_lesson(row) for row in rows]

    @staticmethod
    def _to_lesson(row: sqlite3.Row) -> Lesson:
        return Lesson(
            id=row["id"],
            module_id=row["module_id"],
            title=row["title"],
            content=row["content"],
            position=row["position"],
        )

import sqlite3

from src.types.models import Module

_COLUMNS = "id, course_id, title, position"


class ModuleRepository:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn

    def add(self, course_id: int, title: str) -> Module:
        cursor = self._conn.execute(
            "INSERT INTO modules (course_id, title, position) VALUES (?, ?, "
            "(SELECT COALESCE(MAX(position), 0) + 1 FROM modules WHERE course_id = ?))",
            (course_id, title, course_id),
        )
        self._conn.commit()
        assert cursor.lastrowid is not None
        module = self.get(cursor.lastrowid)
        assert module is not None
        return module

    def get(self, module_id: int) -> Module | None:
        row = self._conn.execute(
            f"SELECT {_COLUMNS} FROM modules WHERE id = ?", (module_id,)
        ).fetchone()
        return None if row is None else self._to_module(row)

    def list_for_course(self, course_id: int) -> list[Module]:
        rows = self._conn.execute(
            f"SELECT {_COLUMNS} FROM modules WHERE course_id = ? ORDER BY position",
            (course_id,),
        ).fetchall()
        return [self._to_module(row) for row in rows]

    @staticmethod
    def _to_module(row: sqlite3.Row) -> Module:
        return Module(
            id=row["id"],
            course_id=row["course_id"],
            title=row["title"],
            position=row["position"],
        )

import sqlite3

from src.types.enums import Role
from src.types.models import User


class UserRepository:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn

    def add(self, name: str, role: Role) -> User:
        cursor = self._conn.execute(
            "INSERT INTO users (name, role) VALUES (?, ?)", (name, role.value)
        )
        self._conn.commit()
        assert cursor.lastrowid is not None
        return User(id=cursor.lastrowid, name=name, role=role)

    def get(self, user_id: int) -> User | None:
        row = self._conn.execute(
            "SELECT id, name, role FROM users WHERE id = ?", (user_id,)
        ).fetchone()
        if row is None:
            return None
        return User(id=row["id"], name=row["name"], role=Role(row["role"]))

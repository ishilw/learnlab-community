from src.repository.database import connect, init_schema


def test_init_schema_creates_users_and_courses_tables(tmp_path):
    conn = connect(str(tmp_path / "schema.db"))
    init_schema(conn)
    names = {row[0] for row in conn.execute("SELECT name FROM sqlite_master WHERE type = 'table'")}
    assert {"users", "courses"} <= names


def test_init_schema_is_idempotent(tmp_path):
    conn = connect(str(tmp_path / "schema.db"))
    init_schema(conn)
    init_schema(conn)

import os

DEFAULT_DATABASE_PATH = "learnlab.db"
DATABASE_ENV_VAR = "LEARNLAB_DB_PATH"


def database_path() -> str:
    """Path to the SQLite database file. Overridden with the LEARNLAB_DB_PATH environment variable."""
    return os.environ.get(DATABASE_ENV_VAR, DEFAULT_DATABASE_PATH)

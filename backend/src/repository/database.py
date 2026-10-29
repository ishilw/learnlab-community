import sqlite3

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('learner', 'instructor', 'admin'))
);
CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    owner_id INTEGER NOT NULL REFERENCES users (id),
    status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'unpublished', 'archived'))
);
CREATE TABLE IF NOT EXISTS modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses (id),
    title TEXT NOT NULL,
    position INTEGER NOT NULL,
    UNIQUE (course_id, position)
);
CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id INTEGER NOT NULL REFERENCES modules (id),
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL,
    UNIQUE (module_id, position)
);
CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses (id),
    learner_id INTEGER NOT NULL REFERENCES users (id),
    UNIQUE (course_id, learner_id)
);
CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id INTEGER NOT NULL REFERENCES lessons (id),
    title TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL REFERENCES quizzes (id),
    position INTEGER NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('mcq', 'true_false')),
    prompt TEXT NOT NULL,
    UNIQUE (quiz_id, position)
);
CREATE TABLE IF NOT EXISTS question_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL REFERENCES questions (id),
    position INTEGER NOT NULL,
    text TEXT NOT NULL,
    is_correct INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
    UNIQUE (question_id, position)
);
CREATE TABLE IF NOT EXISTS attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL REFERENCES quizzes (id),
    learner_id INTEGER NOT NULL REFERENCES users (id),
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    correct_count INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    submitted_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS attempt_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attempt_id INTEGER NOT NULL REFERENCES attempts (id),
    question_id INTEGER NOT NULL REFERENCES questions (id),
    option_id INTEGER NOT NULL REFERENCES question_options (id)
);
CREATE TABLE IF NOT EXISTS lesson_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id INTEGER NOT NULL REFERENCES lessons (id),
    learner_id INTEGER NOT NULL REFERENCES users (id),
    completed_at TEXT NOT NULL,
    UNIQUE (lesson_id, learner_id)
);
CREATE TRIGGER IF NOT EXISTS attempts_no_update BEFORE UPDATE ON attempts
BEGIN SELECT RAISE(ABORT, 'quiz attempts are immutable'); END;
CREATE TRIGGER IF NOT EXISTS attempts_no_delete BEFORE DELETE ON attempts
BEGIN SELECT RAISE(ABORT, 'quiz attempts are immutable'); END;
CREATE TRIGGER IF NOT EXISTS attempt_answers_no_update BEFORE UPDATE ON attempt_answers
BEGIN SELECT RAISE(ABORT, 'quiz attempts are immutable'); END;
CREATE TRIGGER IF NOT EXISTS attempt_answers_no_delete BEFORE DELETE ON attempt_answers
BEGIN SELECT RAISE(ABORT, 'quiz attempts are immutable'); END;
"""


def connect(path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(SCHEMA)

from dataclasses import dataclass

from src.types.enums import CourseStatus, QuestionKind, Role


@dataclass(frozen=True)
class User:
    id: int
    name: str
    role: Role


@dataclass(frozen=True)
class Course:
    id: int
    title: str
    description: str
    owner_id: int
    status: CourseStatus


@dataclass(frozen=True)
class Module:
    id: int
    course_id: int
    title: str
    position: int


@dataclass(frozen=True)
class Lesson:
    id: int
    module_id: int
    title: str
    content: str
    position: int


@dataclass(frozen=True)
class Quiz:
    id: int
    lesson_id: int
    title: str


@dataclass(frozen=True)
class Question:
    id: int
    quiz_id: int
    position: int
    kind: QuestionKind
    prompt: str


@dataclass(frozen=True)
class Option:
    """An answer choice. Correctness is deliberately not part of this type."""

    id: int
    question_id: int
    position: int
    text: str


@dataclass(frozen=True)
class QuestionView:
    question: Question
    options: list[Option]


@dataclass(frozen=True)
class QuizView:
    quiz: Quiz
    questions: list[QuestionView]


@dataclass(frozen=True)
class Attempt:
    """An immutable quiz attempt. Provisional (QZ-02 to QZ-04)."""

    id: int
    quiz_id: int
    learner_id: int
    score: int
    correct_count: int
    total_questions: int
    submitted_at: str


@dataclass(frozen=True)
class BestScore:
    quiz_id: int
    best_score: int | None
    attempts: int


@dataclass(frozen=True)
class CourseProgress:
    course_id: int
    completed_lessons: int
    total_lessons: int
    percent: int


@dataclass(frozen=True)
class LearnerProgress:
    learner_id: int
    completed_lessons: int
    percent: int


@dataclass(frozen=True)
class ProgressSummary:
    course_id: int
    total_lessons: int
    enrolled_learners: int
    average_percent: int
    learners: list[LearnerProgress]

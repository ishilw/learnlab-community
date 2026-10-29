from pydantic import BaseModel, Field

from src.types.enums import CourseStatus, QuestionKind
from src.types.models import (
    Attempt,
    BestScore,
    Course,
    CourseProgress,
    Lesson,
    Module,
    ProgressSummary,
    QuestionView,
    QuizView,
)


class CourseCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=5000)


class TransitionRequest(BaseModel):
    target: CourseStatus


class CourseOut(BaseModel):
    id: int
    title: str
    description: str
    owner_id: int
    status: CourseStatus

    @classmethod
    def from_course(cls, course: Course) -> "CourseOut":
        return cls(
            id=course.id,
            title=course.title,
            description=course.description,
            owner_id=course.owner_id,
            status=course.status,
        )


class CourseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)


class ModuleCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)


class LessonCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(default="", max_length=20000)


class LessonOut(BaseModel):
    id: int
    module_id: int
    title: str
    content: str
    position: int

    @classmethod
    def from_lesson(cls, lesson: Lesson) -> "LessonOut":
        return cls(
            id=lesson.id,
            module_id=lesson.module_id,
            title=lesson.title,
            content=lesson.content,
            position=lesson.position,
        )


class ModuleOut(BaseModel):
    id: int
    course_id: int
    title: str
    position: int
    lessons: list[LessonOut]

    @classmethod
    def from_module(cls, module: Module, lessons: list[Lesson]) -> "ModuleOut":
        return cls(
            id=module.id,
            course_id=module.course_id,
            title=module.title,
            position=module.position,
            lessons=[LessonOut.from_lesson(lesson) for lesson in lessons],
        )


class EnrollmentOut(BaseModel):
    course_id: int
    learner_id: int


class QuizCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)


class QuizUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=200)


class McqQuestionCreate(BaseModel):
    prompt: str = Field(min_length=1, max_length=2000)
    choices: list[str] = Field(min_length=2, max_length=6)
    correct_index: int


class TrueFalseQuestionCreate(BaseModel):
    prompt: str = Field(min_length=1, max_length=2000)
    correct: bool


class OptionOut(BaseModel):
    """An answer choice as shown to users. It never carries correctness."""

    id: int
    position: int
    text: str


class QuestionOut(BaseModel):
    id: int
    position: int
    kind: QuestionKind
    prompt: str
    options: list[OptionOut]

    @classmethod
    def from_view(cls, view: QuestionView) -> "QuestionOut":
        return cls(
            id=view.question.id,
            position=view.question.position,
            kind=view.question.kind,
            prompt=view.question.prompt,
            options=[OptionOut(id=o.id, position=o.position, text=o.text) for o in view.options],
        )


class QuizOut(BaseModel):
    id: int
    lesson_id: int
    title: str
    questions: list[QuestionOut]

    @classmethod
    def from_view(cls, view: QuizView) -> "QuizOut":
        return cls(
            id=view.quiz.id,
            lesson_id=view.quiz.lesson_id,
            title=view.quiz.title,
            questions=[QuestionOut.from_view(q) for q in view.questions],
        )


class SubmissionRequest(BaseModel):
    answers: dict[int, int]


class AttemptOut(BaseModel):
    id: int
    quiz_id: int
    learner_id: int
    score: int
    correct_count: int
    total_questions: int
    submitted_at: str

    @classmethod
    def from_attempt(cls, attempt: Attempt) -> "AttemptOut":
        return cls(**attempt.__dict__)


class BestScoreOut(BaseModel):
    quiz_id: int
    best_score: int | None
    attempts: int

    @classmethod
    def from_best(cls, best: BestScore) -> "BestScoreOut":
        return cls(quiz_id=best.quiz_id, best_score=best.best_score, attempts=best.attempts)


class CompletionOut(BaseModel):
    lesson_id: int
    completed: bool


class ProgressOut(BaseModel):
    course_id: int
    completed_lessons: int
    total_lessons: int
    percent: int

    @classmethod
    def from_progress(cls, progress: CourseProgress) -> "ProgressOut":
        return cls(**progress.__dict__)


class LearnerProgressOut(BaseModel):
    learner_id: int
    completed_lessons: int
    percent: int


class SummaryOut(BaseModel):
    course_id: int
    total_lessons: int
    enrolled_learners: int
    average_percent: int
    learners: list[LearnerProgressOut]

    @classmethod
    def from_summary(cls, summary: ProgressSummary) -> "SummaryOut":
        return cls(
            course_id=summary.course_id,
            total_lessons=summary.total_lessons,
            enrolled_learners=summary.enrolled_learners,
            average_percent=summary.average_percent,
            learners=[LearnerProgressOut(**item.__dict__) for item in summary.learners],
        )

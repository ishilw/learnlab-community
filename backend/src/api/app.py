from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from src.api.dependencies import (
    Actor,
    AttemptSvc,
    ContentSvc,
    EnrollSvc,
    ProgressSvc,
    QuizSvc,
    Service,
)
from src.api.schemas import (
    AttemptOut,
    BestScoreOut,
    CompletionOut,
    CourseCreate,
    CourseOut,
    CourseUpdate,
    EnrollmentOut,
    LessonCreate,
    LessonOut,
    McqQuestionCreate,
    ModuleCreate,
    ModuleOut,
    ProgressOut,
    QuestionOut,
    QuizCreate,
    QuizOut,
    QuizUpdate,
    SubmissionRequest,
    SummaryOut,
    TransitionRequest,
    TrueFalseQuestionCreate,
)
from src.config.settings import database_path
from src.repository.database import connect, init_schema
from src.types.errors import (
    CourseLockedError,
    CourseNotOpenError,
    DuplicateEnrollmentError,
    ForbiddenError,
    InvalidCourseStateException,
    InvalidQuestionError,
    InvalidSubmissionError,
    NotFoundError,
    QuizLockedError,
)
from src.types.models import QuizView

_STATUS_BY_ERROR: dict[type[Exception], int] = {
    ForbiddenError: 403,
    NotFoundError: 404,
    InvalidCourseStateException: 409,
    CourseLockedError: 409,
    CourseNotOpenError: 409,
    DuplicateEnrollmentError: 409,
    QuizLockedError: 409,
    InvalidQuestionError: 422,
    InvalidSubmissionError: 422,
}

_Handler = Callable[[Request, Exception], Awaitable[JSONResponse]]


def _handler_for(status: int) -> _Handler:
    async def handler(_: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(status_code=status, content={"detail": str(exc)})

    return handler


def register_error_handlers(app: FastAPI) -> None:
    for error_type, status in _STATUS_BY_ERROR.items():
        app.add_exception_handler(error_type, _handler_for(status))


def register_health_route(app: FastAPI) -> None:
    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}


def register_course_routes(app: FastAPI) -> None:
    @app.get("/courses", response_model=list[CourseOut])
    def list_courses(
        actor: Actor,
        service: Service,
        search: str | None = None,
    ) -> list[CourseOut]:
        return [
            CourseOut.from_course(c)
            for c in service.list_catalog(actor, search=search)
        ]

    @app.post("/courses", status_code=201, response_model=CourseOut)
    def create_course(payload: CourseCreate, actor: Actor, service: Service) -> CourseOut:
        course = service.create_course(actor, payload.title, payload.description)
        return CourseOut.from_course(course)

    @app.get("/courses/{course_id}", response_model=CourseOut)
    def get_course(course_id: int, actor: Actor, service: Service) -> CourseOut:
        return CourseOut.from_course(service.get_course(actor, course_id))

    @app.post("/courses/{course_id}/transitions", response_model=CourseOut)
    def transition_course(
        course_id: int, payload: TransitionRequest, actor: Actor, service: Service
    ) -> CourseOut:
        course = service.transition_course(actor, course_id, payload.target)
        return CourseOut.from_course(course)


def register_course_update_route(app: FastAPI) -> None:
    @app.patch("/courses/{course_id}", response_model=CourseOut)
    def update_course(
        course_id: int, payload: CourseUpdate, actor: Actor, service: Service
    ) -> CourseOut:
        course = service.update_course(actor, course_id, payload.title, payload.description)
        return CourseOut.from_course(course)


def register_content_routes(app: FastAPI) -> None:
    @app.post("/courses/{course_id}/modules", status_code=201, response_model=ModuleOut)
    def create_module(
        course_id: int, payload: ModuleCreate, actor: Actor, content: ContentSvc
    ) -> ModuleOut:
        module = content.create_module(actor, course_id, payload.title)
        return ModuleOut.from_module(module, [])

    @app.get("/courses/{course_id}/modules", response_model=list[ModuleOut])
    def list_modules(course_id: int, actor: Actor, content: ContentSvc) -> list[ModuleOut]:
        listing = content.list_course_content(actor, course_id)
        return [ModuleOut.from_module(module, lessons) for module, lessons in listing]

    @app.post("/modules/{module_id}/lessons", status_code=201, response_model=LessonOut)
    def create_lesson(
        module_id: int, payload: LessonCreate, actor: Actor, content: ContentSvc
    ) -> LessonOut:
        lesson = content.create_lesson(actor, module_id, payload.title, payload.content)
        return LessonOut.from_lesson(lesson)


def register_enrollment_routes(app: FastAPI) -> None:
    @app.post("/courses/{course_id}/enrollments", status_code=201, response_model=EnrollmentOut)
    def enroll(course_id: int, actor: Actor, enrollment: EnrollSvc) -> EnrollmentOut:
        enrollment.enroll(actor, course_id)
        return EnrollmentOut(course_id=course_id, learner_id=actor.id)

    @app.get("/enrollments", response_model=list[CourseOut])
    def list_enrollments(actor: Actor, enrollment: EnrollSvc) -> list[CourseOut]:
        return [CourseOut.from_course(c) for c in enrollment.list_enrollments(actor)]


def register_quiz_routes(app: FastAPI) -> None:
    @app.post("/lessons/{lesson_id}/quizzes", status_code=201, response_model=QuizOut)
    def create_quiz(lesson_id: int, payload: QuizCreate, actor: Actor, quizzes: QuizSvc) -> QuizOut:
        quiz = quizzes.create_quiz(actor, lesson_id, payload.title)
        return QuizOut.from_view(QuizView(quiz, []))

    @app.get("/lessons/{lesson_id}/quizzes", response_model=list[QuizOut])
    def list_lesson_quizzes(lesson_id: int, actor: Actor, quizzes: QuizSvc) -> list[QuizOut]:
        found = quizzes.list_quizzes_for_lesson(actor, lesson_id)
        return [QuizOut.from_view(QuizView(quiz, [])) for quiz in found]

    @app.patch("/quizzes/{quiz_id}", response_model=QuizOut)
    def update_quiz(quiz_id: int, payload: QuizUpdate, actor: Actor, quizzes: QuizSvc) -> QuizOut:
        quizzes.update_quiz(actor, quiz_id, payload.title)
        return QuizOut.from_view(quizzes.get_quiz(actor, quiz_id))

    @app.get("/quizzes/{quiz_id}", response_model=QuizOut)
    def get_quiz(quiz_id: int, actor: Actor, quizzes: QuizSvc) -> QuizOut:
        return QuizOut.from_view(quizzes.get_quiz(actor, quiz_id))


def register_question_routes(app: FastAPI) -> None:
    @app.post("/quizzes/{quiz_id}/questions/mcq", status_code=201, response_model=QuestionOut)
    def add_mcq(
        quiz_id: int, payload: McqQuestionCreate, actor: Actor, quizzes: QuizSvc
    ) -> QuestionOut:
        view = quizzes.add_mcq_question(
            actor, quiz_id, payload.prompt, payload.choices, payload.correct_index
        )
        return QuestionOut.from_view(view)

    @app.post("/quizzes/{quiz_id}/questions/true-false", status_code=201, response_model=QuestionOut)
    def add_true_false(
        quiz_id: int, payload: TrueFalseQuestionCreate, actor: Actor, quizzes: QuizSvc
    ) -> QuestionOut:
        view = quizzes.add_true_false_question(actor, quiz_id, payload.prompt, payload.correct)
        return QuestionOut.from_view(view)


def register_attempt_routes(app: FastAPI) -> None:
    @app.post("/quizzes/{quiz_id}/attempts", status_code=201, response_model=AttemptOut)
    def submit_attempt(
        quiz_id: int, payload: SubmissionRequest, actor: Actor, attempts: AttemptSvc
    ) -> AttemptOut:
        return AttemptOut.from_attempt(attempts.submit(actor, quiz_id, payload.answers))

    @app.get("/quizzes/{quiz_id}/attempts", response_model=list[AttemptOut])
    def list_attempts(quiz_id: int, actor: Actor, attempts: AttemptSvc) -> list[AttemptOut]:
        return [AttemptOut.from_attempt(a) for a in attempts.list_attempts(actor, quiz_id)]

    @app.get("/quizzes/{quiz_id}/best-score", response_model=BestScoreOut)
    def best_score(quiz_id: int, actor: Actor, attempts: AttemptSvc) -> BestScoreOut:
        return BestScoreOut.from_best(attempts.best_score(actor, quiz_id))


def register_progress_routes(app: FastAPI) -> None:
    @app.post("/lessons/{lesson_id}/completion", response_model=CompletionOut)
    def complete_lesson(lesson_id: int, actor: Actor, progress: ProgressSvc) -> CompletionOut:
        progress.complete_lesson(actor, lesson_id)
        return CompletionOut(lesson_id=lesson_id, completed=True)

    @app.get("/courses/{course_id}/progress", response_model=ProgressOut)
    def course_progress(course_id: int, actor: Actor, progress: ProgressSvc) -> ProgressOut:
        return ProgressOut.from_progress(progress.course_progress(actor, course_id))

    @app.get("/courses/{course_id}/progress-summary", response_model=SummaryOut)
    def progress_summary(course_id: int, actor: Actor, progress: ProgressSvc) -> SummaryOut:
        return SummaryOut.from_summary(progress.course_summary(actor, course_id))


def create_app(db_path: str | None = None) -> FastAPI:
    app = FastAPI(title="LearnLab", version="0.1.0")
    connection = connect(db_path or database_path())
    init_schema(connection)
    app.state.connection = connection
    register_error_handlers(app)
    register_health_route(app)
    register_course_routes(app)
    register_course_update_route(app)
    register_content_routes(app)
    register_enrollment_routes(app)
    register_quiz_routes(app)
    register_question_routes(app)
    register_attempt_routes(app)
    register_progress_routes(app)
    return app

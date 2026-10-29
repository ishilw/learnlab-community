from typing import Annotated

from fastapi import Depends, Header, HTTPException, Request

from src.repository.attempt_repository import AttemptRepository
from src.repository.completion_repository import CompletionRepository
from src.repository.course_repository import CourseRepository
from src.repository.enrollment_repository import EnrollmentRepository
from src.repository.lesson_repository import LessonRepository
from src.repository.module_repository import ModuleRepository
from src.repository.quiz_repository import QuizRepository
from src.repository.user_repository import UserRepository
from src.service.attempt_service import AttemptService
from src.service.content_service import ContentService
from src.service.course_service import CourseService
from src.service.enrollment_service import EnrollmentService
from src.service.progress_service import ProgressService
from src.service.quiz_service import QuizService
from src.types.models import User


def current_actor(
    request: Request,
    x_user_id: Annotated[str | None, Header()] = None,
) -> User:
    """Resolve the acting user from the X-User-Id header.

    Development stub, not authentication. Requirement CC-01 (authentication) is
    not yet specified, so this header is trusted as given. Do not expose this
    API beyond a trusted development network until CC-01 is implemented.
    """
    if x_user_id is None:
        raise HTTPException(status_code=401, detail="missing X-User-Id header")
    try:
        user_id = int(x_user_id)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="invalid X-User-Id header") from exc
    user = UserRepository(request.app.state.connection).get(user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="unknown user")
    return user


def course_service(request: Request) -> CourseService:
    return CourseService(CourseRepository(request.app.state.connection))


def content_service(request: Request) -> ContentService:
    conn = request.app.state.connection
    return ContentService(
        CourseRepository(conn),
        ModuleRepository(conn),
        LessonRepository(conn),
        EnrollmentRepository(conn),
    )


def enrollment_service(request: Request) -> EnrollmentService:
    conn = request.app.state.connection
    return EnrollmentService(CourseRepository(conn), EnrollmentRepository(conn))


def quiz_service(request: Request) -> QuizService:
    conn = request.app.state.connection
    return QuizService(
        CourseRepository(conn),
        LessonRepository(conn),
        QuizRepository(conn),
        AttemptRepository(conn),
        EnrollmentRepository(conn),
    )


def attempt_service(request: Request) -> AttemptService:
    conn = request.app.state.connection
    return AttemptService(
        CourseRepository(conn),
        QuizRepository(conn),
        AttemptRepository(conn),
        EnrollmentRepository(conn),
    )


def progress_service(request: Request) -> ProgressService:
    conn = request.app.state.connection
    return ProgressService(
        CourseRepository(conn),
        LessonRepository(conn),
        EnrollmentRepository(conn),
        CompletionRepository(conn),
    )


Actor = Annotated[User, Depends(current_actor)]
Service = Annotated[CourseService, Depends(course_service)]
ContentSvc = Annotated[ContentService, Depends(content_service)]
EnrollSvc = Annotated[EnrollmentService, Depends(enrollment_service)]
QuizSvc = Annotated[QuizService, Depends(quiz_service)]
AttemptSvc = Annotated[AttemptService, Depends(attempt_service)]
ProgressSvc = Annotated[ProgressService, Depends(progress_service)]

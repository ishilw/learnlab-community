from src.types.enums import CourseStatus


class InvalidCourseStateException(Exception):
    """Raised when a course lifecycle transition is not allowed from the current state."""

    def __init__(self, from_state: CourseStatus, to_state: CourseStatus) -> None:
        super().__init__(f"invalid course transition: {from_state.value} -> {to_state.value}")
        self.from_state = from_state
        self.to_state = to_state


class CourseLockedError(Exception):
    """The course is archived, so its details and content are read-only. Provisional (CL-01)."""


class CourseNotOpenError(Exception):
    """The course is not published, so it does not accept enrollment. Provisional (EN-01..03)."""


class DuplicateEnrollmentError(Exception):
    """The learner is already enrolled in the course. Provisional (EN-01)."""


class InvalidQuestionError(Exception):
    """A quiz question failed validation. Provisional (QZ-01)."""


class InvalidSubmissionError(Exception):
    """A quiz submission names unknown questions or options, or the quiz cannot be graded."""


class QuizLockedError(Exception):
    """Questions cannot change once the quiz has an attempt. Provisional (QZ-03)."""


class ForbiddenError(Exception):
    """The authenticated actor lacks the role or ownership the operation requires."""


class NotFoundError(Exception):
    """The requested course does not exist or is not visible to the actor."""

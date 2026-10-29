from enum import Enum


class Role(str, Enum):
    LEARNER = "learner"
    INSTRUCTOR = "instructor"
    ADMIN = "admin"


class QuestionKind(str, Enum):
    MCQ = "mcq"
    TRUE_FALSE = "true_false"


class CourseStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    UNPUBLISHED = "unpublished"
    ARCHIVED = "archived"

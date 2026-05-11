from fastapi import FastAPI, HTTPException, Depends, Response
from pydantic import BaseModel as PydanticBaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.base import engine, get_db
from app.services.course_service import CourseService

app = FastAPI(title=settings.project_name, version=settings.version)


class RatingRequest(PydanticBaseModel):
    user_id: int = Field(..., gt=0)
    rating: int = Field(..., ge=1, le=5)


def get_course_service(db: Session = Depends(get_db)) -> CourseService:
    """
    Dependency to get CourseService instance
    """
    return CourseService(db)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Bienvenido a Platziflix API"}


@app.get("/health")
def health() -> dict[str, str | bool | int]:
    """
    Health check endpoint that verifies:
    - Service status
    - Database connectivity
    """
    health_status = {
        "status": "ok",
        "service": settings.project_name,
        "version": settings.version,
        "database": False,
    }

    # Check database connectivity and verify migration
    try:
        with engine.connect() as connection:
            # Execute COUNT on courses table to verify migration was executed
            result = connection.execute(text("SELECT COUNT(*) FROM courses"))
            row = result.fetchone()
            if row:
                count = row[0]
                health_status["database"] = True
                health_status["courses_count"] = count
            else:
                health_status["database"] = True
                health_status["courses_count"] = 0
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["database_error"] = str(e)

    return health_status


@app.get("/courses")
def get_courses(course_service: CourseService = Depends(get_course_service)) -> list:
    """
    Get all courses.
    Returns a list of courses with basic information: id, name, description, thumbnail, slug
    """
    return course_service.get_all_courses()


@app.get("/courses/{slug}")
def get_course_by_slug(slug: str, course_service: CourseService = Depends(get_course_service)) -> dict:
    """
    Get course details by slug.
    Returns course information including teachers and classes.
    """
    course = course_service.get_course_by_slug(slug)
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return course


@app.get("/courses/{slug}/ratings")
def get_course_rating_stats(slug: str, course_service: CourseService = Depends(get_course_service)) -> dict:
    stats = course_service.get_course_rating_stats(slug)
    if stats is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return stats


@app.post("/courses/{slug}/ratings", status_code=201)
def add_course_rating(slug: str, body: RatingRequest, course_service: CourseService = Depends(get_course_service)) -> dict:
    try:
        result = course_service.add_course_rating(slug, body.user_id, body.rating)
    except ValueError:
        raise HTTPException(status_code=409, detail="Rating already exists for this user")
    if result is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return result


@app.put("/courses/{slug}/ratings/{user_id}")
def update_course_rating(slug: str, user_id: int, body: RatingRequest, course_service: CourseService = Depends(get_course_service)) -> dict:
    result = course_service.update_course_rating(slug, user_id, body.rating)
    if result is None:
        raise HTTPException(status_code=404, detail="Rating not found")
    return result


@app.delete("/courses/{slug}/ratings/{user_id}", status_code=204)
def delete_course_rating(slug: str, user_id: int, course_service: CourseService = Depends(get_course_service)) -> Response:
    deleted = course_service.delete_course_rating(slug, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Rating not found")
    return Response(status_code=204)

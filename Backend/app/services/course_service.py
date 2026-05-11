from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from app.models.course import Course
from app.models.lesson import Lesson
from app.models.teacher import Teacher
from app.models.course_rating import CourseRating


class CourseService:
    """
    Service class for handling course-related operations.
    Implements the contract specifications for course endpoints.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_all_courses(self) -> List[Dict[str, Any]]:
        """
        Get all courses with basic information (no teachers or lessons).
        
        Returns:
            List of course dictionaries with: id, name, description, thumbnail, slug
        """
        courses = self.db.query(Course).filter(Course.deleted_at.is_(None)).all()
        
        return [
            {
                "id": course.id,
                "name": course.name,
                "description": course.description,
                "thumbnail": course.thumbnail,
                "slug": course.slug
            }
            for course in courses
        ]

    def get_course_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        """
        Get course details by slug including teachers and lessons.
        
        Args:
            slug: The course slug
            
        Returns:
            Course dictionary with teachers and lessons, or None if not found
        """
        course = (
            self.db.query(Course)
            .options(
                joinedload(Course.teachers),
                joinedload(Course.lessons)
            )
            .filter(Course.slug == slug)
            .filter(Course.deleted_at.is_(None))
            .first()
        )
        
        if not course:
            return None
            
        return {
            "id": course.id,
            "name": course.name,
            "description": course.description,
            "thumbnail": course.thumbnail,
            "slug": course.slug,
            "teacher_id": [teacher.id for teacher in course.teachers],
            "classes": [
                {
                    "id": lesson.id,
                    "name": lesson.name,
                    "description": lesson.description,
                    "slug": lesson.slug
                }
                for lesson in course.lessons
                if lesson.deleted_at is None
            ]
        }

    def _get_course_id_by_slug(self, slug: str) -> Optional[int]:
        row = (
            self.db.query(Course.id)
            .filter(Course.slug == slug, Course.deleted_at.is_(None))
            .first()
        )
        return row[0] if row else None

    def get_course_rating_stats(self, slug: str) -> Optional[Dict[str, Any]]:
        course_id = self._get_course_id_by_slug(slug)
        if course_id is None:
            return None
        result = (
            self.db.query(
                func.avg(CourseRating.rating).label("average"),
                func.count(CourseRating.id).label("total"),
            )
            .filter(CourseRating.course_id == course_id, CourseRating.deleted_at.is_(None))
            .one()
        )
        return {
            "average_rating": round(float(result.average or 0), 1),
            "total_ratings": result.total,
        }

    def get_user_course_rating(self, slug: str, user_id: int) -> Optional[CourseRating]:
        course_id = self._get_course_id_by_slug(slug)
        if course_id is None:
            return None
        return (
            self.db.query(CourseRating)
            .filter(
                CourseRating.course_id == course_id,
                CourseRating.user_id == user_id,
                CourseRating.deleted_at.is_(None),
            )
            .first()
        )

    def add_course_rating(self, slug: str, user_id: int, rating: int) -> Optional[Dict[str, Any]]:
        course_id = self._get_course_id_by_slug(slug)
        if course_id is None:
            return None
        if self.get_user_course_rating(slug, user_id):
            raise ValueError("conflict")
        new_rating = CourseRating(course_id=course_id, user_id=user_id, rating=rating)
        self.db.add(new_rating)
        self.db.commit()
        self.db.refresh(new_rating)
        return {
            "id": new_rating.id,
            "course_id": new_rating.course_id,
            "user_id": new_rating.user_id,
            "rating": new_rating.rating,
        }

    def update_course_rating(self, slug: str, user_id: int, rating: int) -> Optional[Dict[str, Any]]:
        existing = self.get_user_course_rating(slug, user_id)
        if existing is None:
            return None
        existing.rating = rating
        existing.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(existing)
        return {
            "id": existing.id,
            "course_id": existing.course_id,
            "user_id": existing.user_id,
            "rating": existing.rating,
        }

    def delete_course_rating(self, slug: str, user_id: int) -> bool:
        existing = self.get_user_course_rating(slug, user_id)
        if existing is None:
            return False
        existing.deleted_at = datetime.utcnow()
        self.db.commit()
        return True
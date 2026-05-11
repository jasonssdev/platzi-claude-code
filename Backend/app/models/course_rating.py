from sqlalchemy import Column, Integer, ForeignKey, CheckConstraint, Index
from sqlalchemy.orm import relationship
from .base import BaseModel


class CourseRating(BaseModel):
    __tablename__ = 'course_ratings'

    course_id = Column(Integer, ForeignKey('courses.id'), nullable=False)
    user_id = Column(Integer, nullable=False)
    rating = Column(Integer, nullable=False)

    course = relationship("Course", back_populates="ratings")

    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='chk_rating_range'),
        Index('idx_course_ratings_course_id', 'course_id'),
        Index('idx_course_ratings_user_id', 'user_id'),
        Index(
            'uix_course_ratings_active',
            'course_id', 'user_id',
            unique=True,
            postgresql_where=Column('deleted_at').is_(None),
        ),
    )

// Course types
export interface Course {
  id: number;
  name: string;
  description: string;
  thumbnail: string;
  slug: string;
  averageRating?: number;
  totalRatings?: number;
}

// Class types
export interface Class {
  id: number;
  name: string;
  description: string;
  slug: string;
}

// Course Detail type
export interface CourseDetail extends Course {
  teacher_id: number[];
  classes: Class[];
}

// Progress types
export interface Progress {
  progress: number; // seconds
  user_id: number;
}

// Quiz types
export interface QuizOption {
  id: number;
  answer: string;
  correct: boolean;
}

export interface Quiz {
  id: number;
  question: string;
  options: QuizOption[];
}

// Favorite types
export interface FavoriteToggle {
  course_id: number;
}

export interface CourseRating {
  id: number;
  courseId: number;
  userId: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface RatingRequest {
  userId: number;
  rating: number;
}
import { notFound } from "next/navigation";
import { CourseDetail } from "@/types";
import { CourseDetailComponent } from "@/components/CourseDetail/CourseDetail";
import { fetchCourseRatingStats } from "@/services/api";
import { StarRating } from "@/components/StarRating/StarRating";
import { RatingWidget } from "@/components/RatingWidget/RatingWidget";

interface CoursePageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getCourseData(slug: string): Promise<CourseDetail> {
  const response = await fetch(`http://localhost:8000/courses/${slug}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error("Failed to fetch course data");
  }

  return response.json();
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;

  const [courseData, ratingStats] = await Promise.all([
    getCourseData(slug),
    fetchCourseRatingStats(slug),
  ]);

  return (
    <>
      <CourseDetailComponent course={courseData} />
      <div style={{ padding: '0 2rem 2rem' }}>
        <StarRating
          rating={ratingStats.average_rating}
          readonly
          showCount
          totalRatings={ratingStats.total_ratings}
          size="medium"
        />
        <RatingWidget courseSlug={slug} />
      </div>
    </>
  );
}

export async function generateMetadata({ params }: CoursePageProps) {
  const { slug } = await params;
  const courseData = await getCourseData(slug);

  return {
    title: `${courseData.name} - Curso Online`,
    description: courseData.description,
  };
}

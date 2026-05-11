const API_URL = 'http://localhost:8000';

export const ratingsApi = {
  getCourseRatings: (slug: string) =>
    fetch(`${API_URL}/courses/${slug}/ratings`, { cache: 'no-store' }).then(r => r.json()),

  addCourseRating: (slug: string, data: { user_id: number; rating: number }) =>
    fetch(`${API_URL}/courses/${slug}/ratings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),

  updateCourseRating: (slug: string, userId: number, rating: number) =>
    fetch(`${API_URL}/courses/${slug}/ratings/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, rating }),
    }).then(r => r.json()),

  deleteCourseRating: async (slug: string, userId: number): Promise<void> => {
    await fetch(`${API_URL}/courses/${slug}/ratings/${userId}`, { method: 'DELETE' });
  },
};

export async function fetchCourseRatingStats(slug: string): Promise<{ average_rating: number; total_ratings: number }> {
  try {
    const res = await fetch(`${API_URL}/courses/${slug}/ratings`, { cache: 'no-store' });
    if (!res.ok) return { average_rating: 0, total_ratings: 0 };
    return res.json();
  } catch {
    return { average_rating: 0, total_ratings: 0 };
  }
}

'use client';

import { useState } from 'react';
import { StarRating } from '@/components/StarRating/StarRating';
import { ratingsApi } from '@/services/api';
import styles from './RatingWidget.module.scss';

interface RatingWidgetProps {
  courseSlug: string;
  userId?: number;
}

export const RatingWidget = ({ courseSlug, userId }: RatingWidgetProps) => {
  const [userRating, setUserRating] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleRatingChange = async (rating: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await ratingsApi.addCourseRating(courseSlug, { user_id: userId ?? 1, rating });
      setUserRating(rating);
    } catch {
      setError('No se pudo guardar tu calificación');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <p className={styles.title}>Califica este curso</p>
      <StarRating rating={userRating} onRatingChange={handleRatingChange} size="large" />
      {isLoading && <p className={styles.loading}>Guardando...</p>}
      {error && <p className={styles.error}>{error}</p>}
      {userRating > 0 && !isLoading && (
        <p className={styles.success}>Tu calificación: {userRating} ★</p>
      )}
    </div>
  );
};

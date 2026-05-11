'use client';

import { useState, KeyboardEvent } from 'react';
import styles from './StarRating.module.scss';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (r: number) => void;
  readonly?: boolean;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
  totalRatings?: number;
}

const TOTAL_STARS = 5;

export const StarRating = ({
  rating,
  onRatingChange,
  readonly = false,
  size = 'medium',
  showCount = false,
  totalRatings,
}: StarRatingProps) => {
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const isInteractive = !!onRatingChange && !readonly;

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isInteractive) return;
    if (e.key === 'ArrowRight') {
      onRatingChange(Math.min(TOTAL_STARS, rating + 1));
    }
    if (e.key === 'ArrowLeft') {
      onRatingChange(Math.max(0, rating - 1));
    }
  };

  const getInteractiveStarClass = (n: number) => {
    const active = hoveredRating > 0 ? hoveredRating : rating;
    const classes = [styles.star, styles[size]];
    if (n <= active) {
      classes.push(hoveredRating > 0 ? styles.starHovered : styles.starFilled);
    }
    return classes.join(' ');
  };

  const getReadonlyFillPercent = (n: number): number => {
    if (rating >= n) return 100;
    if (rating >= n - 0.5) return 50;
    return 0;
  };

  const stars = Array.from({ length: TOTAL_STARS }, (_, i) => i + 1);

  return (
    <div
      className={`${styles.container} ${styles[size]}`}
      role="radiogroup"
      onKeyDown={handleKeyDown}
    >
      {stars.map((n) =>
        isInteractive ? (
          <button
            key={n}
            type="button"
            className={getInteractiveStarClass(n)}
            aria-label={`${n} estrellas`}
            aria-pressed={rating >= n}
            onClick={() => onRatingChange(n)}
            onMouseEnter={() => setHoveredRating(n)}
            onMouseLeave={() => setHoveredRating(0)}
          >
            {rating >= n || (hoveredRating > 0 && hoveredRating >= n) ? '★' : '☆'}
          </button>
        ) : (
          <span
            key={n}
            className={`${styles.starWrapper} ${styles[size]}`}
            aria-label={`${n} estrellas`}
            aria-checked={rating >= n}
          >
            <span className={styles.starBase}>☆</span>
            <span
              className={styles.starFillLayer}
              style={{ width: `${getReadonlyFillPercent(n)}%` }}
            >
              ★
            </span>
          </span>
        )
      )}
      {showCount && totalRatings !== undefined && (
        <span className={styles.count}>({totalRatings})</span>
      )}
    </div>
  );
};

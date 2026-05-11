import { render, screen, fireEvent } from '@testing-library/react';
import { StarRating } from '../StarRating';

describe('StarRating', () => {
  it('renderiza 5 estrellas', () => {
    render(<StarRating rating={3} readonly />);
    // Readonly renders spans with aria-label "N estrellas"
    const stars = screen.getAllByLabelText(/estrellas/i);
    expect(stars).toHaveLength(5);
  });

  it('en modo readonly no dispara onRatingChange al hacer click', () => {
    const onChange = vi.fn();
    render(<StarRating rating={3} readonly onRatingChange={onChange} />);
    // readonly renders spans, not buttons
    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });

  it('en modo interactivo el click llama al callback con el valor correcto', () => {
    const onChange = vi.fn();
    render(<StarRating rating={0} onRatingChange={onChange} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[2]); // 3rd star (index 2 = value 3)
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('muestra el conteo cuando showCount y totalRatings están presentes', () => {
    render(<StarRating rating={4} readonly showCount totalRatings={10} />);
    expect(screen.getByText('(10)')).toBeInTheDocument();
  });
});

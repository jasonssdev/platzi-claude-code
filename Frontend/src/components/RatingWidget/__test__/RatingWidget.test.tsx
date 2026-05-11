import { render, screen, fireEvent } from '@testing-library/react';
import { RatingWidget } from '../RatingWidget';

describe('RatingWidget', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('llama a la API con los datos correctos al seleccionar una estrella', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, course_id: 1, user_id: 1, rating: 4 }),
    });

    render(<RatingWidget courseSlug="curso-de-react" />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[3]); // 4th star

    await screen.findByText(/Tu calificación/);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/courses/curso-de-react/ratings',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('muestra "Guardando..." mientras espera la respuesta', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () => new Promise(() => {}) // never resolves
    );

    render(<RatingWidget courseSlug="curso-de-react" />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(await screen.findByText(/Guardando/)).toBeInTheDocument();
  });

  it('muestra mensaje de error cuando la API falla', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    render(<RatingWidget courseSlug="curso-de-react" />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(await screen.findByText(/No se pudo guardar/)).toBeInTheDocument();
  });
});

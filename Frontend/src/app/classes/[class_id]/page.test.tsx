import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ClassPage from "./page";
import { vi } from "vitest";

vi.mock("@/components/VideoPlayer/VideoPlayer", () => ({
  VideoPlayer: ({ title }: { title: string }) => (
    <div data-testid="mock-video-player">{title}</div>
  ),
}));

global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () =>
    Promise.resolve({
      id: 19,
      name: "Clase de Test",
      description: "Descripción de la clase de test",
      slug: "clase-test",
    }),
});

describe("ClassPage", () => {
  it("renders class info and back button", async () => {
    const jsx = await ClassPage({ params: Promise.resolve({ class_id: "19" }) });
    render(jsx);

    expect(screen.getByRole("heading", { name: "Clase de Test" })).toBeInTheDocument();
    expect(screen.getByText("Descripción de la clase de test")).toBeInTheDocument();
    expect(screen.getByText(/Regresar/)).toBeInTheDocument();
  });
});

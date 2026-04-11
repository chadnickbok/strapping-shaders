import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("playground app", () => {
  it("shows the full shader catalog in the sidebar", () => {
    const { container } = render(<App />);
    const shaderList = container.querySelector(".effect-list");

    expect(shaderList).not.toBeNull();
    const list = shaderList as HTMLElement;

    expect(within(list).getByText(/^Aurora Field$/)).toBeInTheDocument();
    expect(within(list).getByText(/^Caustic Pool$/)).toBeInTheDocument();
    expect(within(list).getByText(/^Contours$/)).toBeInTheDocument();
    expect(within(list).getByText(/^Voronoi Caustics$/)).toBeInTheDocument();
    expect(within(list).getByText(/^Thermal Bloom$/)).toBeInTheDocument();
    expect(within(list).getByText(/^VHS Poster$/)).toBeInTheDocument();
    expect(within(list).getByText(/^Liquid Distortion$/)).toBeInTheDocument();
    expect(within(list).getByText(/^Ghost Frame$/)).toBeInTheDocument();
    expect(within(list).getByText(/^Button Emitter Aura$/)).toBeInTheDocument();
    expect(within(list).getByText(/^Button Ghost Whoosh 2$/)).toBeInTheDocument();
    expect(within(list).getByText(/^Ghost Whoosh Button$/)).toBeInTheDocument();
    expect(within(list).getByText(/^Pulse Trace Border$/)).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("playground app", () => {
  it("shows only the supported playground effects in the sidebar", () => {
    render(<App />);

    expect(screen.getByRole("button", { name: /Aurora Field/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Caustic Pool/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Voronoi Caustics/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Liquid Distortion/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ghost Frame/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Button Emitter Aura/i })).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: /Button Ghost Whoosh 2/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ghost Whoosh Button/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Pulse Trace Border/i })).not.toBeInTheDocument();
  });
});

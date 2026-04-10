import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuroraField, GhostFrame, LiquidDistortion, PulseTraceBorder } from "./components";

describe("shader components", () => {
  it("renders a canvas for procedural effects", () => {
    render(<AuroraField animate={false} height={180} width={320} />);
    expect(screen.getByLabelText("Aurora Field")).toBeInTheDocument();
  });

  it("renders both border overlay components", () => {
    render(
      <>
        <GhostFrame animate={false} height={180} width={320} />
        <PulseTraceBorder animate={false} height={180} width={320} />
      </>
    );

    expect(screen.getByLabelText("Ghost Frame")).toBeInTheDocument();
    expect(screen.getByLabelText("Pulse Trace Border")).toBeInTheDocument();
  });

  it("surfaces a clear missing asset message for image-backed effects", () => {
    render(<LiquidDistortion animate={false} height={180} width={320} />);
    expect(screen.getByText(/Missing required asset/i)).toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  AuroraField,
  CinematicBokeh,
  CausticPool,
  ButtonEmitterAura,
  Dithering,
  FlowingGradient,
  FrostedAcrylic,
  GhostFrame,
  GhostWhooshButton,
  LiquidDistortion,
  MoireSilk,
  PulseTraceBorder,
  SoapFilmInterference,
  StudioDitherFade,
  VoronoiCaustics
} from "./components";

describe("shader components", () => {
  it("renders a canvas for procedural effects", () => {
    render(
      <>
        <AuroraField animate={false} height={180} width={320} />
        <FlowingGradient animate={false} height={180} width={320} />
        <CausticPool animate={false} height={180} width={320} />
        <Dithering animate={false} height={180} width={320} />
        <SoapFilmInterference animate={false} height={180} width={320} />
        <MoireSilk animate={false} height={180} width={320} />
        <VoronoiCaustics animate={false} height={180} width={320} />
      </>
    );

    expect(screen.getByLabelText("Aurora Field")).toBeInTheDocument();
    expect(screen.getByLabelText("Flowing Gradient")).toBeInTheDocument();
    expect(screen.getByLabelText("Caustic Pool")).toBeInTheDocument();
    expect(screen.getByLabelText("Dithering")).toBeInTheDocument();
    expect(screen.getByLabelText("Soap Film Interference")).toBeInTheDocument();
    expect(screen.getByLabelText("Moire Silk")).toBeInTheDocument();
    expect(screen.getByLabelText("Voronoi Caustics")).toBeInTheDocument();
  });

  it("renders both border overlay components", () => {
    render(
      <>
        <GhostFrame animate={false} height={180} width={320} />
        <ButtonEmitterAura animate={false} height={180} width={320} />
        <PulseTraceBorder animate={false} height={180} width={320} />
      </>
    );

    expect(screen.getByLabelText("Ghost Frame")).toBeInTheDocument();
    expect(screen.getByLabelText("Button Emitter Aura")).toBeInTheDocument();
    expect(screen.getByLabelText("Pulse Trace Border")).toBeInTheDocument();
  });

  it("surfaces a clear missing asset message for image-backed effects", () => {
    render(
      <>
        <LiquidDistortion animate={false} height={180} width={320} />
        <CinematicBokeh animate={false} height={180} width={320} />
        <FrostedAcrylic animate={false} height={180} width={320} />
        <StudioDitherFade animate={false} height={180} width={320} />
      </>
    );

    expect(screen.getAllByText(/Missing required asset/i)).toHaveLength(4);
  });

  it("renders the standalone ghost whoosh button with both shader layers", () => {
    const onClick = vi.fn();
    const { container } = render(
      <GhostWhooshButton animate={false} onClick={onClick}>
        Enter
      </GhostWhooshButton>
    );

    fireEvent.click(screen.getByRole("button", { name: "Enter" }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(container.querySelectorAll("canvas")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Enter" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Enter" })).not.toBeDisabled();
  });

  it("does not schedule a burst animation while disabled", () => {
    const frameSpy = vi.spyOn(window, "requestAnimationFrame");

    render(
      <GhostWhooshButton animate={false} disabled>
        Locked
      </GhostWhooshButton>
    );

    fireEvent.click(screen.getByRole("button", { name: "Locked" }));

    expect(frameSpy).not.toHaveBeenCalled();
    frameSpy.mockRestore();
  });
});

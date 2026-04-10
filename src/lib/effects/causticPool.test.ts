import { describe, expect, it } from "vitest";
import { causticPoolDefinition, type CausticPoolParams } from "./causticPool";

type SampleStats = {
  peak: number;
  average: number;
  coverage: number;
  values: number[];
};

type DisplacementStats = {
  peak: number;
  average: number;
};

type InternalParams = {
  seed: number;
  layerMix: number;
  distortion: number;
  waves: number;
  caustic: number;
  size: number;
  openness: number;
  speed: number;
  depth: number;
  halo: number;
};

function mix(a: number, b: number, t: number): number {
  return a * (1 - t) + b * t;
}

function saturate(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = saturate((value - edge0) / Math.max(edge1 - edge0, 0.0001));
  return t * t * (3 - 2 * t);
}

function fract(value: number): number {
  return value - Math.floor(value);
}

function dot2(a: [number, number], b: [number, number]): number {
  return a[0] * b[0] + a[1] * b[1];
}

function length2(value: [number, number]): number {
  return Math.hypot(value[0], value[1]);
}

function add2(a: [number, number], b: [number, number]): [number, number] {
  return [a[0] + b[0], a[1] + b[1]];
}

function subtract2(a: [number, number], b: [number, number]): [number, number] {
  return [a[0] - b[0], a[1] - b[1]];
}

function multiply2(value: [number, number], scalar: number): [number, number] {
  return [value[0] * scalar, value[1] * scalar];
}

function divide2(a: [number, number], b: [number, number]): [number, number] {
  return [a[0] / b[0], a[1] / b[1]];
}

function normalize2(value: [number, number]): [number, number] {
  const length = Math.max(length2(value), 0.0001);
  return [value[0] / length, value[1] / length];
}

function hash21(p: [number, number]): number {
  return fract(Math.sin(dot2(p, [127.1, 311.7])) * 43758.5453123);
}

function hash22(p: [number, number]): [number, number] {
  return [
    fract(Math.sin(dot2(p, [127.1, 311.7])) * 43758.5453123),
    fract(Math.sin(dot2(p, [269.5, 183.3])) * 43758.5453123)
  ];
}

function noise(p: [number, number]): number {
  const cell: [number, number] = [Math.floor(p[0]), Math.floor(p[1])];
  const local: [number, number] = [fract(p[0]), fract(p[1])];
  const smoothLocal: [number, number] = [
    local[0] * local[0] * (3 - 2 * local[0]),
    local[1] * local[1] * (3 - 2 * local[1])
  ];

  const a = hash21(cell);
  const b = hash21([cell[0] + 1, cell[1]]);
  const c = hash21([cell[0], cell[1] + 1]);
  const d = hash21([cell[0] + 1, cell[1] + 1]);

  return mix(mix(a, b, smoothLocal[0]), mix(c, d, smoothLocal[0]), smoothLocal[1]);
}

function fbm(input: [number, number]): number {
  let total = 0;
  let amplitude = 0.5;
  let point = input;

  for (let octave = 0; octave < 5; octave += 1) {
    total += amplitude * noise(point);
    point = [point[0] * 2.02 + 8.1, point[1] * 2.02 + 5.3];
    amplitude *= 0.52;
  }

  return total;
}

function toInternalParams(overrides: Partial<CausticPoolParams>): InternalParams {
  const params = {
    ...causticPoolDefinition.defaults,
    ...overrides
  };

  return {
    seed: 0.5,
    layerMix: params.layerMix,
    distortion: params.distortion,
    waves: params.waves,
    caustic: params.caustic,
    size: params.size,
    openness: params.openness,
    speed: params.speed,
    depth: params.depth,
    halo: params.halo
  };
}

function waterField(point: [number, number], timeValue: number, params: InternalParams): [number, number] {
  const seedOffset: [number, number] = [
    Math.cos(params.seed * 6.28318) * 2.7,
    Math.sin(params.seed * 6.28318) * 2.7
  ];
  const macroScale = mix(0.9, 1.85, params.waves);
  const baseUv = add2(multiply2(point, macroScale), seedOffset);
  const lowA = fbm(add2(baseUv, [0, timeValue * 0.18]));
  const lowB = fbm(add2(add2(multiply2([baseUv[1], baseUv[0]], 1.08), [4.2, -3.4]), [-timeValue * 0.12, timeValue * 0.15]));
  const midA = fbm(add2(add2(multiply2(baseUv, 1.72), [8.3, 1.6]), [timeValue * 0.09, -timeValue * 0.07]));
  const midB = fbm(add2(add2(multiply2([baseUv[1], baseUv[0]], 1.56), [-2.4, 6.9]), [-timeValue * 0.06, -timeValue * 0.1]));
  const low: [number, number] = [lowA - 0.5, lowB - 0.5];
  const mid: [number, number] = [midA - 0.5, midB - 0.5];
  return add2(multiply2(low, 0.72), multiply2(mid, mix(0.14, 0.48, params.waves)));
}

function lensField(point: [number, number], timeValue: number, params: InternalParams): [number, number] {
  const seedOffset: [number, number] = [
    -Math.sin(params.seed * 6.28318) * 4.1,
    Math.cos(params.seed * 6.28318) * 4.1
  ];
  const lensScale = mix(2.1, 4.7, params.waves);
  const lensUv = add2(multiply2(point, lensScale), seedOffset);
  const lensA = fbm(add2(lensUv, [timeValue * 0.2, -timeValue * 0.16]));
  const lensB = fbm(add2(add2(multiply2([lensUv[1], lensUv[0]], 1.12), [-6.4, 2.7]), [-timeValue * 0.17, -timeValue * 0.11]));
  const lensC = fbm(add2(add2(multiply2(lensUv, 2.06), [3.6, -5.2]), [timeValue * 0.12, timeValue * 0.08]));
  const lensD = fbm(add2(add2(multiply2([lensUv[1], lensUv[0]], 1.88), [7.1, 1.2]), [-timeValue * 0.09, timeValue * 0.13]));
  const broad: [number, number] = [lensA - 0.5, lensB - 0.5];
  const pocket: [number, number] = [lensC - 0.5, lensD - 0.5];
  return add2(multiply2(broad, 0.76), multiply2(pocket, mix(0.1, 0.36, params.distortion)));
}

function worley(point: [number, number], params: InternalParams): [number, number] {
  const cell: [number, number] = [Math.floor(point[0]), Math.floor(point[1])];
  const local: [number, number] = [fract(point[0]), fract(point[1])];
  let nearest = 8;
  let secondNearest = 8;

  for (let y = -1; y <= 1; y += 1) {
    for (let x = -1; x <= 1; x += 1) {
      const offset: [number, number] = [x, y];
      const pointOffset = hash22([cell[0] + offset[0] + params.seed * 31.7, cell[1] + offset[1] + params.seed * 31.7]);
      const diff: [number, number] = [
        offset[0] + pointOffset[0] - local[0],
        offset[1] + pointOffset[1] - local[1]
      ];
      const distanceSquared = dot2(diff, diff);

      if (distanceSquared < nearest) {
        secondNearest = nearest;
        nearest = distanceSquared;
      } else if (distanceSquared < secondNearest) {
        secondNearest = distanceSquared;
      }
    }
  }

  return [Math.sqrt(Math.max(nearest, 0)), Math.sqrt(Math.max(secondNearest, 0))];
}

function causticBand(field: [number, number], width: number, sharpness: number): number {
  const edge = Math.max(field[1] - field[0], 0);
  const band = 1 - smoothstep(0, width, edge);
  return Math.pow(saturate(band), sharpness);
}

function causticHalo(field: [number, number], width: number): number {
  const edge = Math.max(field[1] - field[0], 0);
  const band = 1 - smoothstep(0.01, width, edge);
  return band * band;
}

function sampleCausticSignal(overrides: Partial<CausticPoolParams> = {}, time = 0.3): SampleStats {
  const params = toInternalParams(overrides);
  const gridSize = 34;
  const aspect: [number, number] = [800 / 600, 1];
  const timeValue = time * mix(0, 0.34, params.speed);
  const eps = 0.018;
  const seedOffset: [number, number] = [Math.cos(params.seed * 6.28318), Math.sin(params.seed * 6.28318)];
  const values: number[] = [];
  let peak = 0;
  let total = 0;
  let active = 0;

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const uv: [number, number] = [(x + 0.5) / gridSize, (y + 0.5) / gridSize];
      const centered: [number, number] = [(uv[0] - 0.5) * aspect[0], uv[1] - 0.5];
      const macroWater = waterField(multiply2(centered, 1.12), timeValue, params);
      const macroWaterX = waterField(multiply2([centered[0] + eps, centered[1]], 1.12), timeValue, params);
      const macroWaterY = waterField(multiply2([centered[0], centered[1] + eps], 1.12), timeValue, params);
      const causticVector = macroWater;
      const causticDirection = normalize2([causticVector[0] + 0.0001, causticVector[1] + 0.0001]);
      const causticCompression =
        ((length2(subtract2(macroWaterX, macroWater)) + length2(subtract2(macroWaterY, macroWater))) / eps) *
        mix(3.2, 6.4, params.waves);
      const sizeBase = Math.min(params.size, 1);
      const sizeOver = Math.max(Math.min((params.size - 1) / 2, 1), 0);
      let causticDensity = mix(8.9, 3.5, sizeBase);
      causticDensity = mix(causticDensity, 0.72, sizeOver);
      const causticDomain = add2(
        add2(
          add2(multiply2(centered, causticDensity), multiply2(seedOffset, 4.8)),
          add2(
            multiply2(causticVector, mix(1.4, 2.8, params.waves)),
            multiply2(causticDirection, mix(0.24, 0.74, params.waves))
          )
        ),
        [timeValue * 0.58, -timeValue * 0.34]
      );
      const causticWarp = waterField(
        add2(add2(multiply2(centered, 1.56), multiply2(causticVector, 0.32)), [0.38, -0.24]),
        timeValue * 1.08,
        params
      );
      const fieldA = worley(add2(causticDomain, multiply2(causticWarp, 1.12)), params);
      const fieldB = worley(add2(subtract2(multiply2(causticDomain, 1.08), multiply2([causticWarp[1], causticWarp[0]], 0.86)), [5.6, -3.4]), params);
      let ridgeWidth = mix(0.038, 0.09, sizeBase);
      ridgeWidth = mix(ridgeWidth, 0.082, sizeOver);
      ridgeWidth *= mix(1, 0.62, params.openness);
      const secondaryWidth = ridgeWidth * mix(0.78, 0.38, params.openness);
      const sharpness = mix(2.0, 3.6, params.caustic) * mix(1.0, 1.12, params.openness);
      const webA = causticBand(fieldA, ridgeWidth, sharpness);
      const webB = causticBand(fieldB, secondaryWidth, sharpness * mix(0.92, 1.06, params.openness));
      const haloA = causticHalo(fieldA, mix(0.085, 0.22, params.halo) * mix(1.0, 0.78, params.openness));
      const haloB = causticHalo(fieldB, mix(0.075, 0.2, params.halo) * mix(0.92, 0.58, params.openness));
      const junctionA = Math.pow(saturate(1 - fieldA[0] * mix(2.08, 2.45, params.openness)), 4.4) * webA;
      const junctionB = Math.pow(saturate(1 - fieldB[0] * mix(2.2, 2.65, params.openness)), 4.2) * webB;
      const focusMask = 0.86 + 0.42 * smoothstep(0.12, 0.74, causticCompression * mix(0.35, 1.15, params.waves));
      const secondaryWeight = mix(0.34, 0.06, params.openness) * mix(1.0, 0.82, sizeOver);
      const primaryJunctionWeight = mix(0.26, 0.18, params.openness);
      const secondaryJunctionWeight = mix(0.14, 0.02, params.openness) * mix(1.0, 0.78, sizeOver);
      const primaryHaloWeight = mix(0.74, 0.44, params.openness);
      const secondaryHaloWeight = mix(0.22, 0.03, params.openness) * mix(1.0, 0.7, sizeOver);
      const core =
        (webA * 0.9 + webB * secondaryWeight + junctionA * primaryJunctionWeight + junctionB * secondaryJunctionWeight) *
        focusMask;
      const haloLift = (haloA * primaryHaloWeight + haloB * secondaryHaloWeight) * focusMask;
      const causticStrength = mix(0.16, 1.12, params.caustic) * mix(0.18, 1.0, params.layerMix);
      const signal = core * causticStrength + haloLift * mix(0.0, 0.16, params.halo) * mix(0.22, 1.0, params.layerMix);

      values.push(signal);
      peak = Math.max(peak, signal);
      total += signal;

      if (signal > 0.16) {
        active += 1;
      }
    }
  }

  return {
    peak,
    average: total / values.length,
    coverage: active / values.length,
    values
  };
}

function sampleDisplacement(overrides: Partial<CausticPoolParams> = {}, time = 0.3): DisplacementStats {
  const params = toInternalParams(overrides);
  const gridSize = 30;
  const aspect: [number, number] = [800 / 600, 1];
  const timeValue = time * mix(0, 0.34, params.speed);
  let peak = 0;
  let total = 0;

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const uv: [number, number] = [(x + 0.5) / gridSize, (y + 0.5) / gridSize];
      const centered: [number, number] = [(uv[0] - 0.5) * aspect[0], uv[1] - 0.5];
      const macroWater = waterField(multiply2(centered, 1.12), timeValue, params);
      const lensWater = lensField(
        add2(multiply2(centered, 1.14 + params.depth * 0.32), multiply2(macroWater, 0.18)),
        timeValue * 1.12,
        params
      );
      const waterVector = add2(macroWater, multiply2(lensWater, mix(0.18, 0.72, params.distortion)));
      const direction = normalize2([waterVector[0] + 0.0001, waterVector[1] + 0.0001]);
      const tangent: [number, number] = [-direction[1], direction[0]];
      const displacementStrength = mix(0.01, 0.082, params.distortion) * mix(0.82, 1.52, params.waves);
      const refractionStrength = mix(0.004, 0.036, params.depth) * mix(0.28, 1.0, params.distortion);
      const lensStrength = mix(0.0, 0.052, params.distortion) * mix(0.24, 1.0, params.depth);
      const floorOffset = divide2(
        add2(
          add2(multiply2(waterVector, displacementStrength), multiply2(direction, refractionStrength)),
          multiply2(tangent, (lensWater[0] * 0.82 + lensWater[1] * -0.64) * lensStrength * 0.45)
        ),
        aspect
      );
      const magnitude = length2(floorOffset);
      peak = Math.max(peak, magnitude);
      total += magnitude;
    }
  }

  return {
    peak,
    average: total / (gridSize * gridSize)
  };
}

function meanAbsoluteDifference(valuesA: number[], valuesB: number[]): number {
  let total = 0;

  for (let index = 0; index < valuesA.length; index += 1) {
    total += Math.abs(valuesA[index] - valuesB[index]);
  }

  return total / valuesA.length;
}

function causticDensityForSize(size: number): number {
  const sizeBase = Math.min(size, 1);
  const sizeOver = Math.max(Math.min((size - 1) / 2, 1), 0);
  let density = mix(8.9, 3.5, sizeBase);
  density = mix(density, 0.72, sizeOver);
  return density;
}

describe("causticPoolDefinition signal tuning", () => {
  it("keeps the default caustic lattice visible without flooding the frame", () => {
    const signal = sampleCausticSignal();

    expect(signal.peak).toBeGreaterThan(0.55);
    expect(signal.average).toBeGreaterThan(0.03);
    expect(signal.coverage).toBeGreaterThan(0.06);
    expect(signal.coverage).toBeLessThan(0.5);
  });

  it("keeps the default water displacement visibly stronger than a barely-treated floor", () => {
    const displacement = sampleDisplacement();

    expect(displacement.peak).toBeGreaterThan(0.03);
    expect(displacement.average).toBeGreaterThan(0.008);
  });

  it("raises caustic energy when the caustic control increases", () => {
    const lowCaustic = sampleCausticSignal({ caustic: 0.15 });
    const highCaustic = sampleCausticSignal({ caustic: 0.92 });

    expect(highCaustic.peak).toBeGreaterThan(lowCaustic.peak);
    expect(highCaustic.average).toBeGreaterThan(lowCaustic.average);
  });

  it("keeps caustic structure stable when distortion changes", () => {
    const lowDistortion = sampleCausticSignal({ distortion: 0.1 });
    const highDistortion = sampleCausticSignal({ distortion: 0.9 });

    expect(meanAbsoluteDifference(lowDistortion.values, highDistortion.values)).toBeLessThan(0.0001);
  });

  it("supports larger-than-legacy caustic zoom values", () => {
    const legacyMax = sampleCausticSignal({ size: 1, openness: 0 });
    const zoomed = sampleCausticSignal({ size: 3, openness: 0 });
    const legacyDensity = causticDensityForSize(1);
    const zoomedDensity = causticDensityForSize(3);

    expect(zoomedDensity).toBeLessThan(legacyDensity);
    expect(zoomed.peak).toBeGreaterThan(0.2);
  });

  it("opens the web as openness increases", () => {
    const closed = sampleCausticSignal({ size: 2, openness: 0 });
    const open = sampleCausticSignal({ size: 2, openness: 1 });

    expect(open.coverage).toBeLessThan(closed.coverage);
    expect(open.average).toBeLessThan(closed.average);
  });

  it("increases floor displacement as distortion rises", () => {
    const lowDistortion = sampleDisplacement({ distortion: 0.1 });
    const highDistortion = sampleDisplacement({ distortion: 0.9 });

    expect(highDistortion.peak).toBeGreaterThan(lowDistortion.peak);
    expect(highDistortion.average).toBeGreaterThan(lowDistortion.average);
  });

  it("keeps the field static at speed zero and animates it when speed is present", () => {
    const stillStart = sampleCausticSignal({ speed: 0 }, 0);
    const stillEnd = sampleCausticSignal({ speed: 0 }, 1.5);
    const movingStart = sampleCausticSignal({ speed: 0.8 }, 0);
    const movingEnd = sampleCausticSignal({ speed: 0.8 }, 1.5);

    expect(meanAbsoluteDifference(stillStart.values, stillEnd.values)).toBeLessThan(0.0001);
    expect(meanAbsoluteDifference(movingStart.values, movingEnd.values)).toBeGreaterThan(0.03);
  });
});

// Genetic operators for client-side MVP.
// In production these run server-side; here they prove the loop works locally.

const VARIATIONS = [
  'linear', 'sinusoidal', 'spherical', 'swirl', 'horseshoe',
  'polar', 'handkerchief', 'heart', 'disc', 'julian',
  'juliaN', 'blob', 'fisheye', 'tangent',
];

const PALETTE_PRESETS = [
  // cool
  [[0, [0.02, 0.04, 0.18]], [0.5, [0.10, 0.40, 0.80]], [1, [0.90, 0.95, 1.00]]],
  // warm
  [[0, [0.15, 0.02, 0.02]], [0.5, [0.95, 0.30, 0.10]], [1, [1.00, 0.90, 0.60]]],
  // green
  [[0, [0.02, 0.10, 0.02]], [0.5, [0.30, 0.70, 0.30]], [1, [0.90, 1.00, 0.60]]],
  // purple
  [[0, [0.10, 0.02, 0.20]], [0.5, [0.50, 0.20, 0.70]], [1, [0.95, 0.85, 1.00]]],
  // fire
  [[0, [0.05, 0.00, 0.00]], [0.5, [1.00, 0.30, 0.00]], [1, [1.00, 0.95, 0.40]]],
  // ice
  [[0, [0.02, 0.05, 0.15]], [0.5, [0.40, 0.70, 0.90]], [1, [0.95, 1.00, 1.00]]],
];

let _idCounter = 1000;
const newId = () => `s${(++_idCounter).toString(36).padStart(4, '0')}`;

function rand(min = 0, max = 1) { return min + Math.random() * (max - min); }
function gauss() {
  // Box-Muller
  const u = 1 - Math.random(), v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/**
 * Produce a child by perturbing coefs + occasionally swapping a variation.
 * Matches GA mutation from spec: p_mut=0.05, sigma=0.02 on each coef.
 * Occasional structural mutations: swap variation (2%), full re-roll one xform (1%).
 */
export function mutate(parent) {
  const xforms = parent.xforms.map((xf) => {
    const newCoefs = xf.coefs.map((v) => {
      if (Math.random() < 0.05) return Math.max(-1.5, Math.min(1.5, v + gauss() * 0.02 * 5));
      return v;
    });
    const newVariations = xf.variations.map((v) => {
      if (Math.random() < 0.02) {
        return { name: pick(VARIATIONS.filter(n => n !== v.name)), weight: v.weight, params: v.params };
      }
      return v;
    });
    return { ...xf, coefs: newCoefs, variations: newVariations };
  });

  // Mutate motion keyframes by tiny coefs perturbation
  const motion = parent.motion.map((kf) => ({
    coefs: kf.coefs.map((coefs) => coefs.map((v) => Math.max(-1.5, Math.min(1.5, v + gauss() * 0.05)))),
  }));

  // Occasional palette shift
  const palette = Math.random() < 0.1 ? pick(PALETTE_PRESETS).map(([pos, rgb]) => ({ pos, rgb })) : parent.palette;

  return {
    id: newId(),
    name: `${parent.name}’`,
    generation: parent.generation + 1,
    parents: [parent.id],
    palette,
    xforms,
    gamma: Math.max(1.5, Math.min(4, parent.gamma + gauss() * 0.1)),
    vibrancy: Math.max(-1, Math.min(1, parent.vibrancy + gauss() * 0.05)),
    brightness: Math.max(0.5, Math.min(1.5, parent.brightness + gauss() * 0.05)),
    motion,
    variationParams: parent.variationParams,
  };
}

/**
 * Crossover two sheep: take xforms alternately, blend palette, mix motion keyframes.
 * Matches GA crossover from spec: 50/50 gene-level.
 */
export function crossover(a, b) {
  const lenA = a.xforms.length;
  const lenB = b.xforms.length;
  const maxLen = Math.max(lenA, lenB);
  const xforms = [];
  for (let i = 0; i < maxLen; i++) {
    const src = (i % 2 === 0) ? a.xforms[i % lenA] : b.xforms[i % lenB];
    xforms.push({ ...src, weight: (src.weight + 0.5) / 2 });
  }

  // Blend palettes: take stops from each
  const palette = [];
  const lenPA = a.palette.length, lenPB = b.palette.length;
  for (let i = 0; i < Math.max(lenPA, lenPB); i++) {
    const sa = a.palette[i % lenPA], sb = b.palette[i % lenPB];
    palette.push({
      pos: (sa.pos + sb.pos) / 2,
      rgb: sa.rgb.map((v, j) => (v + sb.rgb[j]) / 2),
    });
  }

  // Mix motion keyframes
  const motion = [];
  const kfCount = Math.min(a.motion.length, b.motion.length);
  for (let i = 0; i < kfCount; i++) {
    const ca = a.motion[i].coefs, cb = b.motion[i].coefs;
    const coefs = ca.map((arr, idx) => arr.map((v, j) => cb[idx] ? (v + cb[idx][j]) / 2 : v));
    motion.push({ coefs });
  }

  return {
    id: newId(),
    name: `${a.name}×${b.name}`,
    generation: Math.max(a.generation, b.generation) + 1,
    parents: [a.id, b.id],
    palette,
    xforms,
    gamma: (a.gamma + b.gamma) / 2,
    vibrancy: (a.vibrancy + b.vibrancy) / 2,
    brightness: (a.brightness + b.brightness) / 2,
    motion,
    variationParams: a.variationParams,
  };
}

/**
 * Generate a fully random sheep — used to seed diversity.
 */
export function randomSheep() {
  const nXforms = 2 + Math.floor(Math.random() * 2);  // 2 or 3 xforms
  const xforms = [];
  for (let i = 0; i < nXforms; i++) {
    const coefBase = [
      rand(0.3, 0.95) * (Math.random() < 0.5 ? -1 : 1),
      rand(-0.3, 0.3),
      rand(-0.5, 0.5),
      rand(-0.3, 0.3),
      rand(0.3, 0.95) * (Math.random() < 0.5 ? -1 : 1),
      rand(-0.5, 0.5),
    ];
    xforms.push({
      weight: 1 / nXforms + rand(-0.05, 0.05),
      color: rand(0, 1),
      coefs: coefBase,
      variations: [{ name: pick(VARIATIONS), weight: 1, params: [] }],
    });
  }
  const palette = pick(PALETTE_PRESETS).map(([pos, rgb]) => ({ pos, rgb }));
  const baseCoefs = xforms.map(xf => xf.coefs);

  // Build 4 motion keyframes by rotating each xform's coefs progressively.
  const motion = [];
  for (let s = 0; s < 4; s++) {
    const t = s / 4;
    const theta = Math.PI * 0.2 * Math.sin(t * Math.PI * 2);
    const c = Math.cos(theta), sn = Math.sin(theta);
    motion.push({
      coefs: baseCoefs.map(([a,b,tx,d,e,ty]) => [
        c * a - sn * d, c * b - sn * e, tx,
        sn * a + c * d, sn * b + c * e, ty,
      ]),
    });
  }

  return {
    id: newId(),
    name: `Random #${Math.floor(Math.random() * 9999)}`,
    generation: 0,
    parents: [],
    palette,
    xforms,
    gamma: rand(2.0, 2.6),
    vibrancy: rand(-0.2, 0.2),
    brightness: rand(0.9, 1.1),
    motion: motionFixed,
    variationParams: [rand(2, 5), rand(2, 5), 0, 0],
  };
}

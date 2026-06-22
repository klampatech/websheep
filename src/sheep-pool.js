// Hand-tuned starter sheep. Each is a small "personality" of xforms + palette + motion.
// Coefs are [a, b, c, d, e, f] — affine matrix applied before variation.
//   x' = a*x + b*y + c
//   y' = d*x + e*y + f

const A_ID = ([a,b,c,d,e,f]) => a;
const A_LIN = ([a,b,c,d,e,f]) => [a,b,c,d,e,f];

/** @typedef {{pos:number, rgb:[number,number,number]}} Stop */
/** @typedef {{weight:number, color:number, coefs:number[], variations:{name:string, weight:number, params:number[]}[]}} Xform */
/** @typedef {{coefs:number[][]}} Keyframe */

/**
 * @typedef {Object} Sheep
 * @property {string} id
 * @property {string} name
 * @property {number} generation
 * @property {string[]} parents
 * @property {Stop[]} palette
 * @property {Xform[]} xforms
 * @property {number} gamma
 * @property {number} vibrancy
 * @property {number} brightness
 * @property {Keyframe[]} motion
 * @property {number[]} variationParams
 * @property {number} [_votes]
 */

let _idCounter = 0;
const newId = () => `s${(++_idCounter).toString(36).padStart(4, '0')}`;

// Helper: produce N motion keyframes by rotating the first keyframe around
// the origin by progressively larger angles, so animation = smooth rotation.
function rotateKeyframes(baseCoefs, steps = 4, maxAngle = Math.PI * 0.3) {
  const frames = [];
  for (let s = 0; s < steps; s++) {
    const t = s / steps;
    const theta = maxAngle * Math.sin(t * Math.PI * 2);  // back-and-forth
    const c = Math.cos(theta), sn = Math.sin(theta);
    frames.push({
      coefs: baseCoefs.map(([a,b,tx,d,e,ty]) => [
        c * a - sn * d, c * b - sn * e, tx,
        sn * a + c * d, sn * b + c * e, ty,
      ]),
    });
  }
  return frames;
}

function makeSheep(name, palette, xforms, opts = {}) {
  const baseCoefs = xforms.map(xf => xf.coefs);
  const motion = opts.motion ?? rotateKeyframes(baseCoefs, 4, Math.PI * 0.25);
  return {
    id: newId(),
    name,
    generation: opts.generation ?? 0,
    parents: opts.parents ?? [],
    palette,
    xforms,
    gamma: opts.gamma ?? 2.2,
    vibrancy: opts.vibrancy ?? 0,
    brightness: opts.brightness ?? 1.0,
    motion,
    variationParams: opts.variationParams ?? [2, 2, 0, 0],
  };
}

// ====== The 8 starter sheep ======

// 1. Spiral — swirl on the inside, mirror on the outside
const SHEEP_SPIRAL = makeSheep('Spiral',
  [
    { pos: 0.00, rgb: [0.02, 0.04, 0.18] },
    { pos: 0.35, rgb: [0.05, 0.30, 0.65] },
    { pos: 0.70, rgb: [0.40, 0.80, 1.00] },
    { pos: 1.00, rgb: [0.95, 0.98, 1.00] },
  ],
  [
    { weight: 0.62, color: 0.10, coefs: [0.78, 0.05, 0.00, -0.05, 0.78, 0.00], variations: [{ name: 'swirl', weight: 1, params: [] }] },
    { weight: 0.38, color: 0.85, coefs: [-0.65, 0.30, 0.50, -0.30, -0.65, 0.30], variations: [{ name: 'linear', weight: 1, params: [] }] },
  ],
  { gamma: 2.4, brightness: 1.05 }
);

// 2. Mandala — two julians for radial symmetry
const SHEEP_MANDALA = makeSheep('Mandala',
  [
    { pos: 0.00, rgb: [0.20, 0.00, 0.05] },
    { pos: 0.30, rgb: [0.80, 0.10, 0.05] },
    { pos: 0.65, rgb: [1.00, 0.55, 0.10] },
    { pos: 1.00, rgb: [1.00, 0.95, 0.70] },
  ],
  [
    { weight: 0.45, color: 0.20, coefs: [0.50, 0.00, 0.00, 0.00, 0.50, 0.00], variations: [{ name: 'julian', weight: 1, params: [] }] },
    { weight: 0.30, color: 0.55, coefs: [-0.45, 0.00, 0.50, 0.00, -0.45, 0.50], variations: [{ name: 'julian', weight: 1, params: [] }] },
    { weight: 0.25, color: 0.90, coefs: [0.30, 0.00, 0.20, 0.00, 0.30, 0.20], variations: [{ name: 'linear', weight: 1, params: [] }] },
  ],
  { gamma: 2.2, brightness: 1.10, variationParams: [3, 3, 0, 0] }
);

// 3. Heart
const SHEEP_HEART = makeSheep('Heart',
  [
    { pos: 0.00, rgb: [0.12, 0.02, 0.18] },
    { pos: 0.35, rgb: [0.60, 0.10, 0.50] },
    { pos: 0.70, rgb: [1.00, 0.40, 0.70] },
    { pos: 1.00, rgb: [1.00, 0.92, 0.95] },
  ],
  [
    { weight: 0.65, color: 0.40, coefs: [0.70, 0.00, 0.00, 0.00, 0.70, 0.00], variations: [{ name: 'heart', weight: 1, params: [] }] },
    { weight: 0.35, color: 0.95, coefs: [-0.55, 0.00, 0.50, 0.00, -0.55, 0.50], variations: [{ name: 'linear', weight: 1, params: [] }] },
  ],
  { gamma: 2.3, brightness: 1.05 }
);

// 4. Horseshoe — high contrast
const SHEEP_HORSESHOE = makeSheep('Horseshoe',
  [
    { pos: 0.00, rgb: [0.03, 0.00, 0.02] },
    { pos: 0.45, rgb: [0.55, 0.05, 0.10] },
    { pos: 0.85, rgb: [1.00, 0.45, 0.20] },
    { pos: 1.00, rgb: [1.00, 0.95, 0.75] },
  ],
  [
    { weight: 0.55, color: 0.05, coefs: [0.95, 0.00, 0.00, 0.00, 0.95, 0.00], variations: [{ name: 'horseshoe', weight: 1, params: [] }] },
    { weight: 0.45, color: 0.70, coefs: [-0.92, 0.00, 0.92, 0.00, -0.92, 0.92], variations: [{ name: 'linear', weight: 1, params: [] }] },
  ],
  { gamma: 2.5, brightness: 1.05 }
);

// 5. Disc — cool blue/white, classic Apollonian feel
const SHEEP_DISC = makeSheep('Disc',
  [
    { pos: 0.00, rgb: [0.00, 0.02, 0.10] },
    { pos: 0.40, rgb: [0.05, 0.25, 0.65] },
    { pos: 0.75, rgb: [0.50, 0.75, 0.95] },
    { pos: 1.00, rgb: [0.95, 0.98, 1.00] },
  ],
  [
    { weight: 0.55, color: 0.10, coefs: [0.75, 0.00, 0.00, 0.00, 0.75, 0.00], variations: [{ name: 'disc', weight: 1, params: [] }] },
    { weight: 0.45, color: 0.80, coefs: [0.30, 0.40, -0.30, -0.40, 0.30, 0.30], variations: [{ name: 'linear', weight: 1, params: [] }] },
  ],
  { gamma: 2.1, brightness: 1.05 }
);

// 6. Blob — green/gold, organic
const SHEEP_BLOB = makeSheep('Blob',
  [
    { pos: 0.00, rgb: [0.02, 0.10, 0.02] },
    { pos: 0.40, rgb: [0.10, 0.50, 0.20] },
    { pos: 0.75, rgb: [0.70, 0.85, 0.20] },
    { pos: 1.00, rgb: [1.00, 0.95, 0.50] },
  ],
  [
    { weight: 0.55, color: 0.30, coefs: [0.65, 0.00, 0.00, 0.00, 0.65, 0.00], variations: [{ name: 'blob', weight: 1, params: [] }] },
    { weight: 0.45, color: 0.75, coefs: [0.45, -0.45, 0.50, 0.45, 0.45, -0.50], variations: [{ name: 'spherical', weight: 1, params: [] }] },
  ],
  { gamma: 2.2, brightness: 1.05 }
);

// 7. Handkerchief — fiery
const SHEEP_HANDKERCHIEF = makeSheep('Handkerchief',
  [
    { pos: 0.00, rgb: [0.10, 0.02, 0.00] },
    { pos: 0.35, rgb: [0.80, 0.20, 0.00] },
    { pos: 0.70, rgb: [1.00, 0.55, 0.10] },
    { pos: 1.00, rgb: [1.00, 0.95, 0.60] },
  ],
  [
    { weight: 0.62, color: 0.05, coefs: [0.90, 0.00, 0.00, 0.00, 0.90, 0.00], variations: [{ name: 'handkerchief', weight: 1, params: [] }] },
    { weight: 0.38, color: 0.85, coefs: [-0.65, 0.00, 0.65, 0.00, -0.65, 0.65], variations: [{ name: 'linear', weight: 1, params: [] }] },
  ],
  { gamma: 2.4, brightness: 1.10 }
);

// 8. Fisheye — purple/blue, deep space
const SHEEP_FISHEYE = makeSheep('Fisheye',
  [
    { pos: 0.00, rgb: [0.02, 0.00, 0.08] },
    { pos: 0.30, rgb: [0.18, 0.08, 0.45] },
    { pos: 0.65, rgb: [0.55, 0.30, 0.85] },
    { pos: 1.00, rgb: [0.90, 0.80, 1.00] },
  ],
  [
    { weight: 0.50, color: 0.15, coefs: [0.85, 0.00, 0.00, 0.00, 0.85, 0.00], variations: [{ name: 'fisheye', weight: 1, params: [] }] },
    { weight: 0.50, color: 0.85, coefs: [0.45, -0.45, 0.50, 0.45, 0.45, -0.50], variations: [{ name: 'polar', weight: 1, params: [] }] },
  ],
  { gamma: 2.3, brightness: 1.05, vibrancy: 0.1 }
);

export const SHEEP_POOL = [
  SHEEP_SPIRAL,
  SHEEP_MANDALA,
  SHEEP_HEART,
  SHEEP_HORSESHOE,
  SHEEP_DISC,
  SHEEP_BLOB,
  SHEEP_HANDKERCHIEF,
  SHEEP_FISHEYE,
];

/* ==========================================================================
   The nested scene
   Six drawings, each placed inside a small rectangle of the one above it, so
   magnifying genuinely travels into the machine rather than cross-fading
   between unrelated pictures.
   ========================================================================== */

window.KP = window.KP || {};

/* Where each level sits inside its parent, in the parent's own coordinates. */
KP.NEST = [
  { x: 600, y: 300, w: 160 },  // desk         -> inside the case
  { x: 250, y: 180, w: 180 },  // case         -> the motherboard
  { x: 300, y: 430, w: 260 },  // motherboard  -> the FPGA card in its slot
  { x: 400, y: 280, w: 200 },  // FPGA board   -> the chip on it
  { x: 460, y: 300, w: 150 }   // die          -> one transistor
];

KP.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
KP.lerp = (a, b, t) => a + (b - a) * t;

/* Accumulate every level's placement in world space, once, at start-up. */
KP.buildFrames = function buildFrames(levelEls) {
  const frames = [{ x: 0, y: 0, s: 1 }];
  KP.NEST.forEach((r, i) => {
    const parent = frames[i];
    frames.push({
      x: parent.x + parent.s * r.x,
      y: parent.y + parent.s * r.y,
      s: parent.s * (r.w / 1000)
    });
  });
  levelEls.forEach((g, i) => {
    g.setAttribute('transform',
      `translate(${frames[i].x} ${frames[i].y}) scale(${frames[i].s})`);
  });
  return frames;
};

/* Point the camera at a fractional depth. Scale interpolates logarithmically,
   because a linear ramp across a 4,000x zoom stalls and then lurches. */
KP.aimCamera = function aimCamera(cam, frames, depth) {
  const i = Math.min(frames.length - 2, Math.max(0, Math.floor(depth)));
  const t = KP.clamp(depth - i, 0, 1);
  const a = frames[i];
  const b = frames[i + 1];

  const scale = Math.exp(KP.lerp(Math.log(a.s), Math.log(b.s), t));
  const ease = t * t * (3 - 2 * t);
  const cx = KP.lerp(a.x + 500 * a.s, b.x + 500 * b.s, ease);
  const cy = KP.lerp(a.y + 350 * a.s, b.y + 350 * b.s, ease);

  cam.setAttribute('transform',
    `translate(500 350) scale(${1 / scale}) translate(${-cx} ${-cy})`);
};

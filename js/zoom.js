/* ==========================================================================
   The magnification engine
   Three behaviours, deliberately separated:
     flick      - one level, travelled on an ease-in-out curve
     slow drag  - free and 1:1, no resistance, stop anywhere
     release    - a light detent settles onto a level if you are near one
   ========================================================================== */

window.KP = window.KP || {};

KP.initZoom = function initZoom() {
  const stage = document.getElementById('zoom');
  if (!stage) return null;

  const levels = [...document.querySelectorAll('.level')];
  const drawings = [...document.querySelectorAll('.scene__level')];
  const ticks = [...document.querySelectorAll('.tick')];
  const cam = document.getElementById('cam');
  const fill = document.getElementById('rulerFill');
  const magNo = document.getElementById('magNumber');
  const bar = document.getElementById('readoutBar');
  const note = document.getElementById('readoutNote');
  const LAST = levels.length - 1;
  const clamp = KP.clamp;

  const frames = KP.buildFrames(drawings);

  /* tuning */
  const CAPTURE = 0.10;   // how near a level before the detent takes hold
  const GRIP    = 0.075;  // how firmly it pulls once it has you
  const TRIP    = 900;    // ms to travel one level on a flick
  const FLICK   = 18;     // normalised px in one event that counts as a flick
  const STEP    = 0.0022; // continuous mapping while moving slowly

  const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

  let target = 0;
  let shown = 0;
  let trip = null;
  let raf = null;
  let scrolling = false;
  let gestureLock = false;
  let quiet;

  function render() {
    KP.aimCamera(cam, frames, shown);

    drawings.forEach((g, n) => {
      const o = clamp(1 - Math.abs(shown - n) * 0.62, 0, 1);
      g.style.opacity = o;
      g.style.display = o < 0.01 ? 'none' : '';
    });

    levels.forEach((el, n) => {
      const d = shown - n;
      const o = clamp(1 - Math.abs(d) * 1.18, 0, 1);
      // Copy racing past the camera goes soft, the way anything does when it
      // leaves the focal plane. This is most of what sells the travel.
      const soft = Math.min(14, Math.abs(d) * 15);
      el.style.opacity = o;
      el.style.transform = `scale(${Math.pow(2.9, d)})`;
      el.style.filter = soft > 0.35 ? `blur(${soft.toFixed(2)}px)` : 'none';
      el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
      el.style.pointerEvents = o > 0.75 ? 'auto' : 'none';
    });

    const near = Math.round(shown);
    ticks.forEach((tk, n) => {
      tk.classList.toggle('is-on', n === near);
      tk.classList.toggle('is-past', n < near);
    });

    const pct = (shown / LAST) * 100;
    fill.style.height = pct + '%';
    bar.style.width = pct + '%';
    magNo.textContent = Math.round(Math.pow(6.25, shown)).toLocaleString();
    note.textContent = shown > LAST - 0.05 ? 'ROLL BACK UP' : 'ROLL TO MAGNIFY';
  }

  function loop() {
    if (trip) {
      const k = Math.min(1, (performance.now() - trip.t0) / trip.dur);
      shown = trip.from + (trip.to - trip.from) * easeInOut(k);
      if (k >= 1) { shown = trip.to; target = trip.to; trip = null; }
      render();
      raf = requestAnimationFrame(loop);
      return;
    }

    const n = clamp(Math.round(target), 0, LAST);
    const off = target - n;
    if (!scrolling && Math.abs(off) < CAPTURE) {
      target = Math.abs(off) < 0.0008 ? n : target - off * GRIP;
    }
    const gap = target - shown;
    shown += gap * 0.14;
    render();

    const settled = scrolling || Math.abs(target - Math.round(target)) < 0.001;
    if (Math.abs(gap) < 0.0004 && settled) { shown = target; render(); raf = null; return; }
    raf = requestAnimationFrame(loop);
  }

  function kick() { if (raf === null) raf = requestAnimationFrame(loop); }

  function travelTo(to, ms) {
    trip = { from: shown, to, t0: performance.now(), dur: ms || TRIP };
    target = to;
    kick();
  }

  function endGesture() { scrolling = false; gestureLock = false; kick(); }

  const nextLevel = (dir) =>
    dir > 0 ? Math.floor(shown + 0.0001) + 1 : Math.ceil(shown - 0.0001) - 1;

  stage.addEventListener('wheel', (e) => {
    if (window.innerWidth <= 900) return;
    e.preventDefault();
    const px = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;

    scrolling = true;
    clearTimeout(quiet);
    quiet = setTimeout(endGesture, 110);

    if (gestureLock) return;              // still riding out one flick
    if (Math.abs(px) >= FLICK) {          // a flick is one level, as a journey
      gestureLock = true;
      travelTo(clamp(nextLevel(Math.sign(px)), 0, LAST));
      return;
    }
    trip = null;                          // slow scroll stays direct and free
    target = clamp(target + px * STEP, 0, LAST);
    kick();
  }, { passive: false });

  let y0 = null;
  stage.addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener('touchmove', (e) => {
    if (y0 === null || window.innerWidth <= 900) return;
    const y = e.touches[0].clientY;
    scrolling = true;
    clearTimeout(quiet);
    quiet = setTimeout(endGesture, 110);
    target = clamp(target + (y0 - y) * 0.006, 0, LAST);
    y0 = y;
    kick();
  }, { passive: true });
  stage.addEventListener('touchend', () => { y0 = null; endGesture(); }, { passive: true });

  ticks.forEach((tk) => tk.addEventListener('click', () => {
    const to = Number(tk.dataset.level);
    travelTo(to, 420 + Math.abs(to - shown) * 520);
  }));

  // The dashed square marks where you are about to go, so let it be the way you go.
  drawings.forEach((g, i) => {
    const box = g.querySelector('.scene__target');
    if (box) box.addEventListener('click', () => travelTo(Math.min(LAST, i + 1)));
  });

  render();

  return {
    step(dir) { travelTo(clamp(Math.round(target) + dir, 0, LAST)); },
    to(depth, ms) { travelTo(clamp(depth, 0, LAST), ms); },
    reset() { shown = 0; target = 0; trip = null; render(); },
    last: LAST
  };
};

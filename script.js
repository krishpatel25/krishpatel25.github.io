// ===================== theme =====================
const root = document.documentElement;
const themeBtn = document.getElementById('theme');
try {
  const saved = localStorage.getItem('kp-theme');
  if (saved) root.setAttribute('data-theme', saved);
} catch (err) { console.warn('theme preference unavailable:', err); }

themeBtn.addEventListener('click', () => {
  const dark = getComputedStyle(root).getPropertyValue('--stage').trim().startsWith('#0d');
  const next = dark ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  try { localStorage.setItem('kp-theme', next); }
  catch (err) { console.warn('could not save theme:', err); }
});

// ===================== nav =====================
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const tabs = [...document.querySelectorAll('#tabs button')];
const pages = [...document.querySelectorAll('.page')];
let current = 'me';

function land(name) {
  pages.forEach((p) => p.classList.toggle('on', p.id === name));
  tabs.forEach((t) => t.classList.toggle('on', t.dataset.p === name));
  document.body.classList.toggle('locked', name === 'projects' && window.innerWidth > 900);
  meRoll = 0;
  current = name;
  window.scrollTo(0, 0);
}

// Leaving the intro for Projects is one continuous move, not a page swap: the
// hero accelerates past the camera and the machine opens up on the other side.
function show(name) {
  if (name === current) return;

  if (name === 'projects' && current === 'me' && !reduced) {
    const heroIn = document.querySelector('.hero-in');
    const cue = document.querySelector('.cue');
    heroIn.classList.add('flying');
    cue.classList.add('flying');
    setTimeout(() => {
      heroIn.classList.remove('flying');
      cue.classList.remove('flying');
      land('projects');
      zoom.classList.add('arriving');
      shown = 0; target = 0; trip = null;
      render();
      setTimeout(() => zoom.classList.remove('arriving'), 950);
    }, 470);
    return;
  }
  land(name);
}
tabs.forEach((t) => t.addEventListener('click', () => show(t.dataset.p)));
document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => show(b.dataset.go)));

// Scrolling down anywhere on the intro carries you straight into Projects, so the
// two read as one continuous move rather than two pages.
const mePage = document.getElementById('me');
let meRoll = 0;
let meCooling = false;

mePage.addEventListener('wheel', (e) => {
  if (!mePage.classList.contains('on') || meCooling) return;
  if (e.deltaY <= 0) { meRoll = 0; return; }
  meRoll += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
  if (meRoll > 34) {
    meRoll = 0;
    meCooling = true;
    setTimeout(() => { meCooling = false; }, 700);
    show('projects');
  }
}, { passive: true });

let meTouch = null;
mePage.addEventListener('touchstart', (e) => { meTouch = e.touches[0].clientY; }, { passive: true });
mePage.addEventListener('touchend', (e) => {
  if (meTouch === null || !mePage.classList.contains('on')) return;
  if (meTouch - e.changedTouches[0].clientY > 60) show('projects');
  meTouch = null;
}, { passive: true });

// ===================== nested zoom scene =====================
const levels = [...document.querySelectorAll('.lvl')];
const scenes = [...document.querySelectorAll('.scene .sc')];
const ticks = [...document.querySelectorAll('.tick')];
const cam = document.getElementById('cam');
const rfill = document.getElementById('rfill');
const magNo = document.getElementById('magNo');
const hintBar = document.getElementById('hintBar');
const hintText = document.getElementById('hintText');
const zoom = document.getElementById('zoom');
const LAST = levels.length - 1;

// Where each level sits inside the one above it.
const NEST = [
  { x: 600, y: 300, w: 160 },  // desk        -> inside the case
  { x: 250, y: 180, w: 180 },  // case        -> the motherboard
  { x: 300, y: 430, w: 260 },  // motherboard -> the FPGA card in its slot
  { x: 400, y: 280, w: 200 },  // FPGA board  -> the chip on it
  { x: 460, y: 300, w: 150 }   // die         -> one transistor
];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

const frames = [{ x: 0, y: 0, s: 1 }];
NEST.forEach((r, i) => {
  const p = frames[i];
  frames.push({ x: p.x + p.s * r.x, y: p.y + p.s * r.y, s: p.s * (r.w / 1000) });
});
scenes.forEach((g, i) => {
  g.setAttribute('transform',
    'translate(' + frames[i].x + ' ' + frames[i].y + ') scale(' + frames[i].s + ')');
});

let target = 0;
let shown = 0;

function render() {
  const i = Math.min(scenes.length - 2, Math.floor(shown));
  const t = clamp(shown - i, 0, 1);
  const a = frames[i], b = frames[i + 1];
  const sc = Math.exp(lerp(Math.log(a.s), Math.log(b.s), t));
  const ease = t * t * (3 - 2 * t);
  const cx = lerp(a.x + 500 * a.s, b.x + 500 * b.s, ease);
  const cy = lerp(a.y + 350 * a.s, b.y + 350 * b.s, ease);
  cam.setAttribute('transform',
    'translate(500 350) scale(' + (1 / sc) + ') translate(' + (-cx) + ' ' + (-cy) + ')');

  scenes.forEach((g, n) => {
    const o = clamp(1 - Math.abs(shown - n) * 0.62, 0, 1);   // wider blend, no popping
    g.style.opacity = o;
    g.style.display = o < 0.01 ? 'none' : '';
  });

  levels.forEach((el, n) => {
    const d = shown - n;
    const o = clamp(1 - Math.abs(d) * 1.18, 0, 1);
    // Copy racing past the camera goes soft, the way anything does when it leaves
    // the focal plane. This is most of what makes the zoom feel like travel.
    const soft = Math.min(14, Math.abs(d) * 15);
    el.style.opacity = o;
    el.style.transform = 'scale(' + Math.pow(2.9, d) + ')';
    el.style.filter = soft > 0.35 ? 'blur(' + soft.toFixed(2) + 'px)' : 'none';
    el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
    el.style.pointerEvents = o > 0.75 ? 'auto' : 'none';
  });

  const near = Math.round(shown);
  ticks.forEach((tk, n) => {
    tk.classList.toggle('on', n === near);
    tk.classList.toggle('past', n < near);
  });
  const pct = (shown / LAST) * 100;
  rfill.style.height = pct + '%';
  hintBar.style.width = pct + '%';
  magNo.textContent = Math.round(Math.pow(6.25, shown)).toLocaleString();
  hintText.textContent = shown > LAST - 0.05 ? 'ROLL BACK UP' : 'ROLL TO MAGNIFY';
}

// A detent, not a timed snap. There is no delay and nothing fires after you stop:
// a level simply has a small magnetic zone around it. Drift inside CAPTURE and it
// draws you the rest of the way in; park outside it and you stay exactly there.
const CAPTURE = 0.10;   // how near a level before it pulls you in
const GRIP = 0.075;     // how firmly it pulls (low = light)
const TRIP = 900;       // how long one flick takes to travel a level, in ms

// A flick is a journey, not a jump. An exponential ease puts most of the movement
// in the first few frames, which reads as a cut; this accelerates out of the level
// you are leaving and decelerates into the one you are arriving at.
const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
let trip = null;

function travelTo(to, ms) {
  trip = { from: shown, to: to, t0: performance.now(), dur: ms || TRIP };
  target = to;
  kick();
}

let raf = null;
function loop() {
  if (trip) {
    const k = Math.min(1, (performance.now() - trip.t0) / trip.dur);
    shown = trip.from + (trip.to - trip.from) * easeInOut(k);
    if (k >= 1) { shown = trip.to; target = trip.to; trip = null; }
    render();
    raf = requestAnimationFrame(loop);
    return;
  }

  // Free scrolling. The detent stays out of the way while you are actually
  // moving, so slow travel feels completely unresisted.
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

// One flick is one level. A quick gesture is read as a discrete command and the
// rest of its momentum is swallowed, so a hard scroll can never skip two levels.
// Slow, deliberate scrolling falls through to free continuous movement instead.
const FLICK = 18;      // normalised pixels in a single event that counts as a flick
const STEP = 0.0022;   // continuous mapping used while moving slowly
let scrolling = false;
let gestureLock = false;
let quiet;

function endGesture() {
  scrolling = false;
  gestureLock = false;
  kick();              // let the detent settle now that the gesture is over
}

function nextLevel(dir) {
  return dir > 0
    ? Math.floor(shown + 0.0001) + 1
    : Math.ceil(shown - 0.0001) - 1;
}

zoom.addEventListener('wheel', (e) => {
  if (window.innerWidth <= 900) return;
  e.preventDefault();
  const px = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;

  scrolling = true;
  clearTimeout(quiet);
  quiet = setTimeout(endGesture, 110);

  if (gestureLock) return;                    // still riding out one flick

  if (Math.abs(px) >= FLICK) {                // a flick: one level, as a journey
    gestureLock = true;
    travelTo(clamp(nextLevel(Math.sign(px)), 0, LAST));
    return;
  }
  trip = null;                                // slow scroll: direct, 1:1, responsive
  target = clamp(target + px * STEP, 0, LAST);
  kick();
}, { passive: false });

window.addEventListener('keydown', (e) => {
  if (!modal.hidden && e.key === 'Escape') return closeSheet();
  if (!demo.hidden && e.key === 'Escape') return closeDemo();
  if (!demo.hidden) return;
  if (!document.getElementById('projects').classList.contains('on')) return;
  if (window.innerWidth <= 900 || !modal.hidden) return;
  const down = ['ArrowDown', 'PageDown', ' '].includes(e.key);
  const up = ['ArrowUp', 'PageUp'].includes(e.key);
  if (!down && !up && e.key !== 'Home' && e.key !== 'End') return;
  e.preventDefault();
  if (e.key === 'Home') return travelTo(0, 1500);
  if (e.key === 'End') return travelTo(LAST, 2200);
  travelTo(clamp(Math.round(target) + (down ? 1 : -1), 0, LAST));
});

let y0 = null;
zoom.addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; }, { passive: true });
zoom.addEventListener('touchmove', (e) => {
  if (y0 === null || window.innerWidth <= 900) return;
  const y = e.touches[0].clientY;
  scrolling = true;
  clearTimeout(quiet);
  quiet = setTimeout(endGesture, 110);
  target = clamp(target + (y0 - y) * 0.006, 0, LAST);
  y0 = y; kick();
}, { passive: true });
zoom.addEventListener('touchend', () => { y0 = null; endGesture(); }, { passive: true });

// The dashed square marks where you are about to go, so let it be the way you go.
scenes.forEach((g, i) => {
  const box = g.querySelector('.hint-rect');
  if (!box) return;
  box.addEventListener('click', () => travelTo(Math.min(LAST, i + 1)));
});

ticks.forEach((tk) => tk.addEventListener('click', () => {
  const to = Number(tk.dataset.l);
  travelTo(to, 420 + Math.abs(to - shown) * 520);   // longer hops take longer
}));

// ===================== project detail sheets =====================
const W = 'https://static.wixstatic.com/media/';
const DETAIL = {
  os391: {
    src: 'ECE 391 · EMBEDDED C AND x86 ASSEMBLY',
    title: '391 Operating System',
    lead: 'A UNIX-like kernel written from scratch in C and x86 assembly: paging, drivers, a file system and a scheduler.',
    points: [
      'GDT/IDT setup, paging and memory virtualization written from scratch',
      'Interrupt-driven drivers for keyboard, terminal and RTC',
      'Read-only file system, plus system calls and PCBs with assembly linkage',
      'Round-robin scheduling across 3 terminals, up to 6 concurrent processes',
      'Eight working programs: shell, ls, cat, grep, counter, fish, pingpong, hello'
    ],
    tools: ['C', 'x86 Assembly', 'QEMU', 'gdb']
  },
  tvm: {
    src: 'IBM-ILLINOIS DISCOVERY ACCELERATOR · MAY 2024 — PRESENT',
    title: 'Tensor Compiler Research',
    lead: 'Machine-learning compilers must choose how to map a computation onto hardware. The legal choices are astronomical, and searching them is the expensive part.',
    points: [
      'NLP-based search-space reduction to prune the autotuning space',
      'Cut AI compilation time and improved multi-platform compatibility',
      'Migrated legacy codebases onto an upgraded TVM framework',
      'Reproduced original results to within 2% variance across the migration'
    ],
    tools: ['TVM', 'Python', 'NLP', 'Autotuning']
  },
  ohlc: {
    src: 'FPGA · SYSTEMVERILOG · AXI',
    title: 'Hardware OHLC Generator',
    lead: 'Open-High-Low-Close candles computed in silicon rather than software, for latency-sensitive trading.',
    points: [
      'Message parser decoding market data in the stream',
      'Control unit sequencing the aggregation windows',
      'Compute path maintaining open, high, low and close in real time',
      'Custom AXI-based testbench driving realistic traffic'
    ],
    tools: ['SystemVerilog', 'AXI', 'FPGA']
  },
  mk: {
    src: 'FPGA · SoC DESIGN AND RTL ACCELERATION · VIVADO',
    title: 'Mortal Kombat on FPGA',
    lead: 'A two-player fighting game built as a system-on-chip: custom RTL for the timing-critical paths, a soft processor for the rest.',
    media: [
      { src: W + '843f1e_c94c80e131634eb39fe2cc48600227f5~mv2.jpeg/v1/fill/w_1000,h_558,al_c,q_85/IMG_4001.jpeg',
        cap: 'RUNNING ON THE BOARD' }
    ],
    points: [
      '213 KiB of on-chip memory holding sprites and game state',
      'Two-player combat with health tracking and a match timer',
      'SPI between the MicroBlaze processor and a MAX3421E USB host controller',
      'AXI UART linking MicroBlaze to HDMI, USB and GPIO peripherals'
    ],
    tools: ['SystemVerilog', 'Vivado', 'Xilinx', 'MicroBlaze', 'HDMI']
  },
  ooo: {
    src: 'ECE 411 · SYSTEMVERILOG · THE FLAGSHIP',
    title: 'Out-of-Order RISC-V Processor',
    lead: 'A five-stage out-of-order core implementing Tomasulo\u2019s algorithm — dynamic scheduling and speculative execution, with results restored to program order at commit.',
    media: [
      { src: W + '843f1e_7a0cd3025a83462583cf583b2ee8dc43~mv2.png/v1/fill/w_820,h_860,al_c,q_90/block.png',
        cap: 'MICROARCHITECTURE' },
      { src: W + '843f1e_f3eeeff67d7c4e1289b41275dd5ef9d9~mv2.png/v1/fill/w_900,h_556,al_c,q_90/benchmark.png',
        cap: 'BENCHMARK RESULTS' }
    ],
    points: [
      'Reservation stations and a reorder buffer, with early branch recovery',
      'GShare branch predictor reaching up to 75% prediction accuracy',
      'A post-commit store buffer worth an 8.6% performance gain',
      '4-way associative cache, split I and D with PLRU replacement',
      'Verified on CoreMark and cryptographic benchmarks; IPC of 0.7'
    ],
    tools: ['SystemVerilog', 'VCS', 'Verilator', 'Verdi', 'CoreMark']
  },
  pnr: {
    src: 'FULL ASIC FLOW · CADENCE · 45 nm',
    title: 'Datapath Design & Place-and-Route',
    lead: 'A RISC-V datapath carried end to end — from Verilog RTL to physical cells placed and routed on a 45 nm process.',
    media: [
      { src: W + '843f1e_5a1bee73d2304851befcd99b98c3b3c2~mv2.jpg/v1/fill/w_900,h_540,al_c,q_85/cpu1.jpg',
        cap: 'PLACED AND ROUTED' },
      { src: W + '843f1e_4d07afcf287f455c9f14147286aa5852~mv2.jpg/v1/fill/w_900,h_496,al_c,q_85/cpu2.jpg',
        cap: 'LAYOUT DETAIL' }
    ],
    points: [
      'Gate-level synthesis with Cadence Genus',
      'Placement and routing with Cadence Innovus at 45 nm',
      'Custom standard cell library supplying physical abstractions and design rules',
      'Timing closure and congestion resolution',
      'Physical verification with DRC and LVS'
    ],
    tools: ['Cadence Genus', 'Cadence Innovus', '45 nm', 'DRC', 'LVS']
  }
};

const modal = document.getElementById('modal');
const sheetSrc = document.getElementById('sheetSrc');
const sheetTitle = document.getElementById('sheetTitle');
const sheetBody = document.getElementById('sheetBody');

function openSheet(key) {
  const d = DETAIL[key];
  if (!d) { console.warn('no detail entry for', key); return; }
  sheetSrc.textContent = d.src;
  sheetTitle.textContent = d.title;
  const media = d.media
    ? '<div class="sheet-media' + (d.media.length > 1 ? ' two' : '') + '">' +
      d.media.map((m) =>
        '<figure><img src="' + m.src + '" alt="' + m.cap.toLowerCase() + '" loading="lazy" />' +
        '<figcaption>' + m.cap + '</figcaption></figure>').join('') + '</div>'
    : '';
  sheetBody.innerHTML =
    '<p class="lead">' + d.lead + '</p>' +
    '<h4>WHAT IT DOES</h4><ul class="bullets">' +
    d.points.map((x) => '<li>' + x + '</li>').join('') +
    '</ul><h4>BUILT WITH</h4><div class="row">' +
    d.tools.map((t) => '<span class="tag">' + t + '</span>').join('') + '</div>';
  sheetBody.insertAdjacentHTML('beforebegin', '');
  const host = sheetBody.parentNode;
  const prev = host.querySelector('.sheet-media');
  if (prev) prev.remove();
  if (media) sheetBody.insertAdjacentHTML('beforebegin', media);
  modal.hidden = false;
  document.getElementById('sheetClose').focus();
}
function closeSheet() { modal.hidden = true; }

document.querySelectorAll('.pcard').forEach((card) => {
  card.addEventListener('click', () => {
    if (card.dataset.demo) return openDemo(card.dataset.demo);
    openSheet(card.dataset.proj);
  });
});

// ===================== live demo =====================
// The emulator is only loaded when asked for, and unloaded on the way out, so it
// is not running in the background while you browse the rest of the site.
const DEMOS = {
  os391: { url: 'https://krishpatel25.github.io/unix-operating-system/', detail: 'os391' }
};
const demo = document.getElementById('demo');
const demoFrame = document.getElementById('demoFrame');
const demoLoad = document.getElementById('demoLoad');
let demoKey = null;

function openDemo(key) {
  const d = DEMOS[key];
  if (!d) { console.warn('no demo registered for', key); return; }
  demoKey = key;
  demoLoad.hidden = false;
  demoFrame.src = d.url;
  demo.hidden = false;
  document.body.classList.add('locked');
}

function closeDemo() {
  demo.hidden = true;
  demoFrame.src = 'about:blank';   // stop it running once you leave
  demoKey = null;
  document.body.classList.toggle('locked', window.innerWidth > 900);
}

demoFrame.addEventListener('load', () => {
  if (demoFrame.src && demoFrame.src !== 'about:blank') demoLoad.hidden = true;
});
document.getElementById('demoBack').addEventListener('click', closeDemo);
document.getElementById('demoAbout').addEventListener('click', () => {
  const d = DEMOS[demoKey];
  if (d) openSheet(d.detail);
});
document.getElementById('sheetClose').addEventListener('click', closeSheet);
modal.addEventListener('click', (e) => { if (e.target === modal) closeSheet(); });

render();

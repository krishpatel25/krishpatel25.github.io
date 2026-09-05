/* ==========================================================================
   Project pages
   A project is a page with its own route, not a dialog. Everything is
   rendered from KP.PROJECTS so the markup stays out of the data.
   ========================================================================== */

window.KP = window.KP || {};

KP.renderProject = function renderProject(key) {
  const p = KP.PROJECTS[key];
  if (!p) { console.warn('Unknown project:', key); return false; }

  const esc = (s) => String(s).replace(/&(?![\w#]+;)/g, '&amp;');

  const facts = (p.facts || []).map(([k, v, hot]) => `
    <div class="facts__row">
      <span class="facts__key">${k}</span>
      <span class="facts__val${hot ? ' is-hot' : ''}">${esc(v)}</span>
    </div>`).join('');

  const stack = (p.stack || []).length
    ? `<div class="facts__stack"><div class="row">${
        p.stack.map((t) => `<span class="tag">${esc(t)}</span>`).join('')
      }</div></div>`
    : '';

  const drawn = (p.drawn || [])
    .map((name) => (KP.FIGURES[name] ? KP.FIGURES[name]() : ''))
    .join('');

  const shots = (p.shots || []).length
    ? `<div class="shots${p.shots.length > 1 ? ' shots--two' : ''}">${
        p.shots.map(([src, cap]) =>
          `<figure class="shot">
             <img src="${src}" alt="${cap.toLowerCase()}" loading="lazy" />
             <figcaption>${cap}</figcaption>
           </figure>`).join('')
      }</div>`
    : '';

  const sections = (p.sections || []).map((s) => `
    <section class="project__section">
      <p class="section__key">${s.key}</p>
      ${s.text.map((t) => `<p>${t}</p>`).join('')}
    </section>`).join('');

  const commands = p.commands ? `
    <section class="project__section">
      <p class="section__key">WHAT YOU CAN RUN</p>
      <div class="cmds">${
        p.commands.map(([name, what]) =>
          `<div class="cmd"><b>${name}</b><span>${what}</span></div>`).join('')
      }</div>
    </section>` : '';

  const keys = p.keys ? `
    <section class="project__section">
      <p class="section__key">KEYBOARD</p>
      <div class="keymap">${
        p.keys.map(([k, what]) =>
          `<div><kbd>${k}</kbd><span>${what}</span></div>`).join('')
      }</div>
    </section>` : '';

  const tryIt = p.demo
    ? `<button class="project__try" data-demo="${key}">▶ ${esc(p.tryLabel || 'Try it')}</button>`
    : '';

  return `
    <div class="wrap">
      <button class="back" data-back>← Back to projects</button>
      <header class="project__head">
        <p class="project__where">${esc(p.where)}</p>
        <h1>${esc(p.title)}</h1>
        <p class="project__lead">${p.lead}</p>
        ${tryIt}
      </header>
      <div class="project__body">
        <div>
          ${drawn}
          ${sections}
          ${commands}
          ${keys}
          ${shots}
        </div>
        <aside class="facts">${facts}${stack}</aside>
      </div>
    </div>`;
};

/* --------------------------------------------------------------------------
   The embedded demo. Loaded only on request and unloaded on the way out, so
   the emulator is not running in the background while you read something else.
   -------------------------------------------------------------------------- */
KP.initDemo = function initDemo() {
  const shell = document.getElementById('demo');
  const frame = document.getElementById('demoFrame');
  const loading = document.getElementById('demoLoading');
  const title = document.getElementById('demoTitle');
  if (!shell) return null;

  function open(key) {
    const p = KP.PROJECTS[key];
    if (!p || !p.demo) { console.warn('No demo registered for', key); return; }
    title.textContent = p.title;
    loading.hidden = false;
    frame.src = p.demo;
    shell.hidden = false;
    document.body.classList.add('is-locked');
  }

  function close() {
    shell.hidden = true;
    frame.src = 'about:blank';
    document.body.classList.remove('is-locked');
  }

  frame.addEventListener('load', () => {
    if (frame.src && frame.src !== 'about:blank') loading.hidden = true;
  });
  document.getElementById('demoBack').addEventListener('click', close);

  return { open, close, isOpen: () => !shell.hidden };
};

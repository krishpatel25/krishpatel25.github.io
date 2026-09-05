/* ==========================================================================
   Routing
   Hash routes so every page - including each project - has its own URL that
   can be linked, bookmarked and reloaded.
     #/            home
     #/projects    the magnification stage
     #/resume      resume
     #/contact     contact
     #/p/<key>     one project
   ========================================================================== */

window.KP = window.KP || {};

KP.initRouter = function initRouter(deps) {
  const { zoom, demo } = deps;
  const pages = [...document.querySelectorAll('.page')];
  const tabs = [...document.querySelectorAll('.nav__tab')];
  const projectPage = document.getElementById('projectPage');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = document.getElementById('zoom');

  let current = '';

  function paint(name) {
    pages.forEach((p) => p.classList.toggle('is-on', p.dataset.page === name));
    tabs.forEach((t) => t.classList.toggle('is-on', t.dataset.route === name));
    document.body.classList.toggle('is-locked', name === 'projects' && window.innerWidth > 900);
    current = name;
    window.scrollTo(0, 0);
  }

  function go(hash) {
    const route = (hash || '').replace(/^#\/?/, '') || 'home';

    if (route.startsWith('p/')) {
      const key = route.slice(2);
      const html = KP.renderProject(key);
      if (!html) return go('#/projects');
      projectPage.innerHTML = html;
      paint('project');
      return;
    }

    if (!['home', 'projects', 'resume', 'contact'].includes(route)) return go('#/');

    // Leaving the intro for the stage is one continuous move, not a page swap.
    if (route === 'projects' && current === 'home' && !reduced) {
      const inner = document.querySelector('.home__inner');
      const cue = document.querySelector('.home__cue');
      inner.classList.add('is-flying');
      cue.classList.add('is-flying');
      setTimeout(() => {
        inner.classList.remove('is-flying');
        cue.classList.remove('is-flying');
        paint('projects');
        if (zoom) zoom.reset();
        stage.classList.add('is-arriving');
        setTimeout(() => stage.classList.remove('is-arriving'), 950);
      }, 470);
      return;
    }
    paint(route);
  }

  function navigate(hash) {
    if (window.location.hash === hash) go(hash);
    else window.location.hash = hash;
  }

  window.addEventListener('hashchange', () => go(window.location.hash));

  // delegated navigation: tabs, cards, back buttons, demo triggers
  document.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-route]');
    if (tab) { navigate('#/' + tab.dataset.route); return; }

    const card = e.target.closest('[data-project]');
    if (card) { navigate('#/p/' + card.dataset.project); return; }

    const demoBtn = e.target.closest('[data-demo]');
    if (demoBtn && demo) { demo.open(demoBtn.dataset.demo); return; }

    if (e.target.closest('[data-back]')) { navigate('#/projects'); }
  });

  return { go, navigate, currentRoute: () => current };
};

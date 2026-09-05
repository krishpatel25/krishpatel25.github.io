/* ==========================================================================
   Start-up
   Classic scripts rather than ES modules on purpose: the site has to open
   correctly from the file system as well as over https, and module imports
   are blocked by CORS on file:// URLs.
   ========================================================================== */

(function start() {
  KP.initTheme();

  const zoom = KP.initZoom();
  const demo = KP.initDemo();
  const router = KP.initRouter({ zoom, demo });

  /* Scrolling down on the intro carries you into the stage. */
  const home = document.querySelector('[data-page="home"]');
  let roll = 0;
  let cooling = false;

  home.addEventListener('wheel', (e) => {
    if (router.currentRoute() !== 'home' || cooling) return;
    if (e.deltaY <= 0) { roll = 0; return; }
    roll += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    if (roll > 34) {
      roll = 0;
      cooling = true;
      setTimeout(() => { cooling = false; }, 700);
      router.navigate('#/projects');
    }
  }, { passive: true });

  let touchY = null;
  home.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  home.addEventListener('touchend', (e) => {
    if (touchY === null || router.currentRoute() !== 'home') return;
    if (touchY - e.changedTouches[0].clientY > 60) router.navigate('#/projects');
    touchY = null;
  }, { passive: true });

  /* Keyboard: escape backs out, arrows drive the stage. */
  window.addEventListener('keydown', (e) => {
    if (demo && demo.isOpen()) {
      if (e.key === 'Escape') demo.close();
      return;
    }
    if (router.currentRoute() === 'project' && e.key === 'Escape') {
      router.navigate('#/projects');
      return;
    }
    if (router.currentRoute() !== 'projects' || window.innerWidth <= 900) return;

    const down = ['ArrowDown', 'PageDown', ' '].includes(e.key);
    const up = ['ArrowUp', 'PageUp'].includes(e.key);
    if (!down && !up && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    if (e.key === 'Home') return zoom.to(0, 1500);
    if (e.key === 'End') return zoom.to(zoom.last, 2200);
    zoom.step(down ? 1 : -1);
  });

  router.go(window.location.hash);
})();

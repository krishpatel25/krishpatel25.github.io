/* ==========================================================================
   Theme switch
   Follows the operating system until the visitor chooses, then remembers.
   ========================================================================== */

window.KP = window.KP || {};

KP.initTheme = function initTheme() {
  const root = document.documentElement;
  const button = document.getElementById('themeSwitch');
  if (!button) return;

  try {
    const saved = localStorage.getItem('kp-theme');
    if (saved === 'dark' || saved === 'light') root.setAttribute('data-theme', saved);
  } catch (err) {
    console.warn('Theme preference could not be read:', err);
  }

  const isDark = () => {
    const chosen = root.getAttribute('data-theme');
    if (chosen) return chosen === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  button.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try {
      localStorage.setItem('kp-theme', next);
    } catch (err) {
      console.warn('Theme preference could not be saved:', err);
    }
  });
};

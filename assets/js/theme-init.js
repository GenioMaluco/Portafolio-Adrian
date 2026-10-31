// Aplica el tema antes del primer pintado para evitar parpadeo (FOUC).
(function () {
  try {
    var saved = localStorage.getItem('theme');
    var light = window.matchMedia('(prefers-color-scheme: light)').matches;
    document.documentElement.dataset.theme = saved || (light ? 'light' : 'dark');
  } catch (e) {
    document.documentElement.dataset.theme = 'dark';
  }
})();

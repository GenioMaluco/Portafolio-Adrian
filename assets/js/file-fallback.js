// Respaldo para abrir index.html directamente desde el explorador (file://),
// ya que los navegadores bloquean <script type="module"> en file:// por CORS.
// Incluye tooltips interactivos al pasar el cursor, filtros, búsqueda y enlaces.
window.addEventListener('DOMContentLoaded', function () {
  if (location.protocol !== 'file:' || document.body.classList.contains('is-ready')) return;
  var data = window.PORTFOLIO_SNAPSHOT;
  if (!data) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function h(tag, cls, text) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  }
  function icon(name) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icon');
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#i-' + name);
    svg.append(use);
    return svg;
  }

  // Tooltip flotante
  var tip = h('div', 'tooltip');
  document.body.append(tip);
  function attachTip(el, build) {
    el.addEventListener('pointerenter', function (e) {
      tip.innerHTML = '';
      tip.append(build());
      tip.classList.add('is-visible');
      moveTip(e.clientX, e.clientY);
    });
    el.addEventListener('pointermove', function (e) { moveTip(e.clientX, e.clientY); });
    el.addEventListener('pointerleave', function () { tip.classList.remove('is-visible'); });
  }
  function moveTip(x, y) {
    var left = Math.min(x + 16, window.innerWidth - tip.offsetWidth - 12);
    var top = Math.min(y + 16, window.innerHeight - tip.offsetHeight - 12);
    tip.style.transform = 'translate(' + Math.max(8, left) + 'px,' + Math.max(8, top) + 'px)';
  }

  // Perfil y estadísticas
  var p = data.profile;
  if (p) {
    $('#hero-name').textContent = p.full_name;
    $('#hero-headline').textContent = p.headline;
    $('#hero-tagline').textContent = p.tagline;
    $('#about-summary').textContent = p.summary;
    $('#about-location').textContent = p.location || '';
    $$('[data-email]').forEach(function (a) {
      a.href = 'mailto:' + p.email;
      var lbl = a.querySelector('.email-text');
      if (lbl) lbl.textContent = p.email;
    });
  }
  var s = data.stats;
  if (s) {
    var hs = $('#hero-stats');
    hs.innerHTML = '';
    [[s.years + '+', 'años de experiencia'], [s.projects, 'proyectos'], [s.used_technologies, 'tecnologías aplicadas']].forEach(function (it) {
      var d = h('div', 'stat');
      d.append(h('dt', '', it[1]), h('dd', '', String(it[0])));
      hs.append(d);
    });
  }

  // Enlaces (LinkedIn, GitHub, Libro, CV)
  var links = data.links || {};
  var LICONS = { linkedin: 'linkedin', github: 'github', book: 'book', cv: 'download' };
  $$('[data-link]').forEach(function (el) {
    var l = links[el.dataset.link];
    if (l && l.url) { el.href = l.url; el.target = '_blank'; el.rel = 'noopener noreferrer'; }
    else { el.classList.add('is-pending'); el.title = (l ? l.label : 'Enlace') + ' · Próximamente'; }
  });
  $$('[data-social]').forEach(function (box) {
    box.innerHTML = '';
    Object.keys(links).filter(function (k) { return k !== 'cv'; }).forEach(function (k) {
      var l = links[k];
      var a = h('a', 'social' + (l.url ? '' : ' is-pending'));
      if (l.url) { a.href = l.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      else { a.title = l.label + ' · Próximamente'; }
      a.append(icon(LICONS[k] || 'external'), h('span', '', l.label));
      if (!l.url) a.append(h('small', 'pending-tag', 'pronto'));
      box.append(a);
    });
  });

  // Estado y filtros de proyectos
  var CAT = { profesional: 'Profesional', academico: 'Académico · IA', github: 'GitHub' };
  var state = { cat: 'todos', techId: null, q: '' };

  function renderTabs() {
    var counts = { todos: data.projects.length };
    data.projects.forEach(function (pr) { counts[pr.category] = (counts[pr.category] || 0) + 1; });
    var tg = $('#project-tabs');
    tg.innerHTML = '';
    [['todos', 'Todos'], ['profesional', CAT.profesional], ['academico', CAT.academico], ['github', CAT.github]].forEach(function (it) {
      var b = h('button', 'tab', it[1]);
      b.type = 'button';
      b.setAttribute('aria-selected', String(state.cat === it[0]));
      b.append(h('span', 'tab-count', String(counts[it[0]] || 0)));
      b.onclick = function () { state.cat = it[0]; renderTabs(); renderProjects(); };
      tg.append(b);
    });
  }

  function renderProjects() {
    var list = data.projects.filter(function (pr) {
      if (state.cat !== 'todos' && pr.category !== state.cat) return false;
      if (state.techId && !pr.technologies.some(function (t) { return t.id === state.techId; })) return false;
      if (state.q) {
        var hay = (pr.title + ' ' + pr.summary + ' ' + (pr.organization || '') + ' ' + pr.technologies.map(function (t) { return t.name; }).join(' ')).toLowerCase();
        if (hay.indexOf(state.q) === -1) return false;
      }
      return true;
    });
    var grid = $('#project-grid');
    grid.innerHTML = '';
    list.forEach(function (pr) {
      var card = h('article', 'project-card cat-' + pr.category + (pr.featured ? ' is-featured' : ''));
      var head = h('header', 'project-head');
      head.append(h('span', 'badge', CAT[pr.category]));
      if (pr.year) head.append(h('span', 'project-year', pr.year));
      card.append(head, h('h3', 'project-title', pr.title));
      if (pr.organization) card.append(h('p', 'project-org', pr.organization));
      card.append(h('p', 'project-summary', pr.summary));
      if (pr.impact) {
        var imp = h('p', 'project-impact');
        imp.append(icon('spark'), document.createTextNode(pr.impact));
        card.append(imp);
      }
      var foot = h('footer', 'project-foot');
      var hint = h('span', 'hint');
      hint.append(icon('layers'), document.createTextNode(pr.technologies.length + ' tecnologías'));
      var plinks = h('span', 'project-links');
      if (pr.linkedin_url) {
        var la = h('a'); la.href = pr.linkedin_url; la.target = '_blank'; la.rel = 'noopener noreferrer';
        la.title = 'Ver publicación en LinkedIn';
        la.append(icon('linkedin')); plinks.append(la);
      }
      if (pr.repo_url) {
        var ra = h('a'); ra.href = pr.repo_url; ra.target = '_blank'; ra.rel = 'noopener noreferrer';
        ra.append(icon('github')); plinks.append(ra);
      }
      foot.append(hint, plinks);
      card.append(foot);

      attachTip(card, function () {
        var box = h('div');
        var t = h('p', 'tooltip-title');
        t.append(icon('layers'), document.createTextNode('Tecnologías utilizadas'));
        box.append(t);
        var byCat = {};
        pr.technologies.forEach(function (tc) { (byCat[tc.category] = byCat[tc.category] || []).push(tc.name); });
        Object.keys(byCat).forEach(function (c) {
          var g = h('div', 'tooltip-group');
          g.append(h('span', 'tooltip-cat', c));
          var ul = h('ul', 'tooltip-chips');
          byCat[c].forEach(function (n) { ul.append(h('li', '', n)); });
          g.append(ul);
          box.append(g);
        });
        return box;
      });
      grid.append(card);
    });
    $('#project-count').textContent = list.length + ' proyecto' + (list.length === 1 ? '' : 's');
    $('#project-empty').hidden = list.length > 0;
  }

  $('#project-search').addEventListener('input', function (e) {
    state.q = e.target.value.toLowerCase().trim();
    renderProjects();
  });

  renderTabs();
  renderProjects();

  // Tecnologías
  var tg = $('#tech-groups');
  tg.innerHTML = '';
  var byCat = {};
  data.technologies.forEach(function (t) { (byCat[t.category] = byCat[t.category] || []).push(t); });
  Object.keys(byCat).forEach(function (cat) {
    var sec = h('section', 'tech-group');
    sec.append(h('h3', '', cat));
    var ul = h('ul', 'tech-list');
    byCat[cat].forEach(function (t) {
      var li = h('li');
      var b = h('button', 'tech-chip' + (t.project_count ? '' : ' is-general'), t.name);
      b.type = 'button';
      b.disabled = !t.project_count;
      b.append(h('span', 'tech-count', String(t.project_count)));
      b.onclick = function () {
        state.techId = t.id; state.cat = 'todos'; renderTabs(); renderProjects();
        $('#proyectos').scrollIntoView({ behavior: 'smooth' });
      };
      attachTip(b, function () {
        var box = h('div');
        var tt = h('p', 'tooltip-title');
        tt.append(icon('folder'), document.createTextNode(t.project_count ? 'Aplicada en ' + t.project_count + ' proyecto(s)' : 'Experiencia general'));
        box.append(tt);
        if (t.project_titles) {
          var l = h('ul', 'tooltip-list');
          t.project_titles.split(' | ').forEach(function (x) { l.append(h('li', '', x)); });
          box.append(l);
        }
        return box;
      });
      li.append(b);
      ul.append(li);
    });
    sec.append(ul);
    tg.append(sec);
  });

  // Experiencia y formación
  var tl = $('#timeline');
  tl.innerHTML = '';
  data.experience.forEach(function (j) {
    var li = h('li', 'timeline-item');
    li.append(h('div', 'timeline-dot'));
    var c = h('div', 'timeline-card');
    c.append(h('p', 'timeline-period', j.period), h('h3', '', j.role + ' · ' + j.company));
    var ul = h('ul');
    j.items.forEach(function (i) { ul.append(h('li', '', i)); });
    c.append(ul);
    li.append(c);
    tl.append(li);
  });

  var KIND = { en_curso: 'En curso', grado: 'Grado', tecnico: 'Técnico', certificacion: 'Certificación' };
  var deg = $('#degrees'), certs = $('#certs');
  deg.innerHTML = ''; certs.innerHTML = '';
  data.education.forEach(function (r) {
    if (r.kind === 'certificacion') {
      var ci = h('li', 'cert');
      ci.append(icon('award'), h('span', '', r.title + (r.institution ? ' · ' + r.institution : '')));
      certs.append(ci);
    } else {
      var li = h('li', 'edu-card' + (r.kind === 'en_curso' ? ' is-current' : ''));
      li.append(h('span', 'badge', KIND[r.kind]), h('h3', '', r.title), h('p', '', [r.institution, r.year].filter(Boolean).join(' · ')));
      deg.append(li);
    }
  });

  $$('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
  $('#year').textContent = new Date().getFullYear();
  $('#data-source').textContent = 'data/portfolio.db (snapshot local)';
  $('#theme-toggle').addEventListener('click', function () {
    document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  });
  var authOpen = $('#auth-open-btn'), authDialog = $('#auth-dialog'), authClose = $('#auth-close-btn');
  if (authOpen && authDialog) authOpen.addEventListener('click', function () { authDialog.showModal(); });
  if (authClose && authDialog) authClose.addEventListener('click', function () { authDialog.close(); });
});

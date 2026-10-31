/**
 * Punto de entrada del sitio público.
 * Lee todo el contenido desde SQLite (db.js) y lo renderiza en el DOM.
 */
import { openDatabase, drafts, session, hashPassword } from './db.js';
import { Tooltip } from './tooltip.js';
import { startNeuralBackground } from './neural-bg.js';
import { h, icon, safeUrl, $, $$, normalize, debounce } from './utils.js';

const CATEGORY_LABELS = {
  profesional: 'Profesional',
  academico: 'Académico · IA',
  github: 'GitHub',
};

const LINK_ICONS = { linkedin: 'linkedin', github: 'github', book: 'book', cv: 'download' };

const state = {
  projects: [],
  technologies: [],
  category: 'todos',
  techId: null,
  search: '',
  personId: 1,
};

let tooltip;
let activeDb = null;

/* ============================================================== Arranque */
init().catch((err) => {
  console.error(err);
  $$('.reveal').forEach((el) => el.classList.add('is-visible'));
  const status = $('#data-status');
  status.hidden = false;
  status.textContent =
    'No se pudieron cargar los datos. Si abriste el archivo directamente, ' +
    'sirve el sitio con un servidor local (ver README).';
});

async function init() {
  setupTheme();
  setupNav();
  setupAuth();
  startNeuralBackground($('#hero-canvas'));
  tooltip = new Tooltip();
  $('#project-search').addEventListener('input', debounce((e) => {
    state.search = normalize(e.target.value);
    renderProjects();
  }));

  // Renderizado instantáneo desde el snapshot pre-generado (también funciona en file://)
  if (window.PORTFOLIO_SNAPSHOT) {
    applyData(window.PORTFOLIO_SNAPSHOT, 'data/portfolio.db (snapshot)');
  }

  // Hidratación desde SQLite (WASM) en el navegador
  const preview = new URLSearchParams(location.search).has('preview');
  try {
    activeDb = await openDatabase({ preferDraft: preview });
    refreshFromDb();
    if (preview) $('#preview-banner').hidden = false;
  } catch (err) {
    if (!window.PORTFOLIO_SNAPSHOT) throw err;
    console.warn('[app] SQLite WASM no disponible en este protocolo, usando snapshot:', err.message);
  }
  renderAuthArea();
  document.body.classList.add('is-ready');
}

function refreshFromDb() {
  if (!activeDb) return;
  const pid = state.personId || 1;
  applyData({
    profile: activeDb.getProfile(pid),
    stats: activeDb.getStats(pid),
    links: activeDb.getLinks(pid),
    projects: activeDb.getProjects(),
    technologies: activeDb.getTechnologyUsage(),
    experience: activeDb.getExperience(),
    education: activeDb.getEducation(),
  }, activeDb.source);
}

function applyData(data, source) {
  state.projects = data.projects;
  state.technologies = data.technologies;
  renderProfile(data.profile, data.stats);
  renderLinks(data.links);
  renderProjectFilters();
  renderProjects();
  renderTechnologies();
  renderExperience(data.experience);
  renderEducation(data.education);
  setupReveal();
  $('#data-source').textContent = source;
}

/* ============================================================== Perfil */
function renderProfile(profile, stats) {
  if (!profile) return;
  $('#hero-name').textContent = profile.full_name;
  $('#hero-headline').textContent = profile.headline;
  $('#hero-tagline').textContent = profile.tagline;
  $('#about-summary').textContent = profile.summary;
  $('#about-location').textContent = profile.location ?? '';

  const avatar = $('#hero-avatar');
  if (avatar) {
    const avatarSrc = safeUrl(profile.avatar_url || 'assets/img/Foto de Perfil.jpg');
    if (avatarSrc) avatar.src = avatarSrc;
    avatar.alt = `Foto de perfil de ${profile.full_name}`;
  }

  const badgeLink = $('#hero-linkedin-badge');
  if (badgeLink && profile.linkedin_url) {
    const lUrl = safeUrl(profile.linkedin_url);
    if (lUrl) {
      badgeLink.href = lUrl;
      const handle = lUrl.replace(/\/$/, '').split('/').pop();
      badgeLink.textContent = handle ? `@${handle}` : profile.full_name;
    }
  }

  const email = safeUrl(`mailto:${profile.email}`);
  for (const a of $$('[data-email]')) {
    a.href = email;
    const label = a.querySelector('.email-text');
    if (label) label.textContent = profile.email;
  }

  const items = [
    [`${stats.years}+`, 'años de experiencia'],
    [stats.projects, 'proyectos'],
    [stats.used_technologies, 'tecnologías aplicadas'],
  ];
  $('#hero-stats').replaceChildren(
    ...items.map(([value, label]) =>
      h('div', { class: 'stat' }, h('dt', {}, label), h('dd', {}, String(value)))),
  );
}

/* ============================================================== Enlaces */
function renderLinks(links) {
  // Cualquier elemento con data-link="clave" se conecta a la tabla `links`.
  for (const el of $$('[data-link]')) {
    const link = links[el.dataset.link];
    const url = safeUrl(link?.url);
    if (url) {
      el.href = url;
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
      el.classList.remove('is-pending');
      el.removeAttribute('aria-disabled');
    } else {
      el.removeAttribute('href');
      el.classList.add('is-pending');
      el.setAttribute('aria-disabled', 'true');
      el.title = `${link?.label ?? 'Enlace'} · Próximamente`;
    }
  }

  // Botonera social del hero y del contacto
  for (const container of $$('[data-social]')) {
    container.replaceChildren(
      ...Object.entries(links)
        .filter(([key]) => key !== 'cv')
        .map(([key, link]) => {
          const url = safeUrl(link.url);
          return h(
            'a',
            {
              class: `social${url ? '' : ' is-pending'}`,
              href: url || null,
              target: url ? '_blank' : null,
              rel: url ? 'noopener noreferrer' : null,
              'aria-disabled': url ? null : 'true',
              title: url ? link.label : `${link.label} · Próximamente`,
            },
            icon(LINK_ICONS[key] ?? 'external'),
            h('span', {}, link.label),
            url ? null : h('small', { class: 'pending-tag' }, 'pronto'),
          );
        }),
    );
  }
}

/* ============================================================== Proyectos */
function renderProjectFilters() {
  const counts = state.projects.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});

  const tabs = [['todos', 'Todos', state.projects.length],
    ...Object.entries(CATEGORY_LABELS).map(([k, v]) => [k, v, counts[k] ?? 0])];

  const group = $('#project-tabs');
  group.replaceChildren(
    ...tabs.map(([key, label, count]) =>
      h('button', {
        type: 'button',
        class: 'tab',
        role: 'tab',
        'aria-selected': String(key === state.category),
        dataset: { category: key },
        onClick: () => {
          state.category = key;
          $$('.tab', group).forEach((t) => t.setAttribute('aria-selected', String(t.dataset.category === key)));
          renderProjects();
        },
      }, label, h('span', { class: 'tab-count' }, String(count)))),
  );
}

function filteredProjects() {
  return state.projects.filter((p) => {
    if (state.category !== 'todos' && p.category !== state.category) return false;
    if (state.techId && !p.technologies.some((t) => t.id === state.techId)) return false;
    if (state.search) {
      const haystack = normalize([p.title, p.summary, p.organization, p.impact,
        ...p.technologies.map((t) => t.name)].join(' '));
      if (!haystack.includes(state.search)) return false;
    }
    return true;
  });
}

function renderProjects() {
  const list = filteredProjects();
  const grid = $('#project-grid');
  grid.replaceChildren(...list.map(projectCard));
  $('#project-empty').hidden = list.length > 0;
  $('#project-count').textContent = `${list.length} proyecto${list.length === 1 ? '' : 's'}`;

  const activeTech = state.technologies.find((t) => t.id === state.techId);
  const chip = $('#active-tech');
  chip.hidden = !activeTech;
  if (activeTech) {
    chip.replaceChildren(
      'Filtrando por ', h('strong', {}, activeTech.name),
      h('button', {
        type: 'button', class: 'chip-clear', 'aria-label': 'Quitar filtro de tecnología',
        onClick: () => { state.techId = null; renderProjects(); },
      }, '×'),
    );
  }
}

function projectCard(p) {
  const repo = safeUrl(p.repo_url);
  const demo = safeUrl(p.demo_url);
  const linkedin = safeUrl(p.linkedin_url);

  const card = h('article', {
    class: `project-card cat-${p.category}${p.featured ? ' is-featured' : ''}`,
    tabindex: '0',
    'aria-label': `${p.title}. Tecnologías: ${p.technologies.map((t) => t.name).join(', ')}`,
  },
  h('header', { class: 'project-head' },
    h('span', { class: 'badge' }, CATEGORY_LABELS[p.category]),
    p.year ? h('span', { class: 'project-year' }, p.year) : null),
  h('h3', { class: 'project-title' }, p.title),
  p.organization ? h('p', { class: 'project-org' }, p.organization) : null,
  h('p', { class: 'project-summary' }, p.summary),
  p.impact ? h('p', { class: 'project-impact' }, icon('spark'), p.impact) : null,
  // Visible en pantallas táctiles (sin hover); oculto en desktop donde se usa el tooltip.
  h('ul', { class: 'project-tech-inline', 'aria-hidden': 'true' },
    p.technologies.slice(0, 6).map((t) => h('li', {}, t.name)),
    p.technologies.length > 6 ? h('li', {}, `+${p.technologies.length - 6}`) : null),
  h('footer', { class: 'project-foot' },
    h('span', { class: 'hint' }, icon('layers'), `${p.technologies.length} tecnologías`),
    h('span', { class: 'project-links' },
      linkedin ? h('a', { href: linkedin, target: '_blank', rel: 'noopener noreferrer', title: 'Ver publicación en LinkedIn', 'aria-label': `Publicación en LinkedIn de ${p.title}` }, icon('linkedin')) : null,
      repo ? h('a', { href: repo, target: '_blank', rel: 'noopener noreferrer', title: 'Ver repositorio en GitHub', 'aria-label': `Repositorio de ${p.title}` }, icon('github')) : null,
      demo ? h('a', { href: demo, target: '_blank', rel: 'noopener noreferrer', title: 'Ver demo', 'aria-label': `Demo de ${p.title}` }, icon('external')) : null)));

  tooltip.attach(card, () => techTooltip(p));
  return card;
}

/** Contenido del mensaje de ayuda al posicionarse sobre un proyecto. */
function techTooltip(p) {
  const groups = Map.groupBy
    ? Map.groupBy(p.technologies, (t) => t.category)
    : p.technologies.reduce((m, t) => m.set(t.category, [...(m.get(t.category) ?? []), t]), new Map());

  return h('div', {},
    h('p', { class: 'tooltip-title' }, icon('layers'), 'Tecnologías utilizadas'),
    [...groups].map(([category, techs]) =>
      h('div', { class: 'tooltip-group' },
        h('span', { class: 'tooltip-cat' }, category),
        h('ul', { class: 'tooltip-chips' }, techs.map((t) => h('li', {}, t.name))))));
}

/* ============================================================== Tecnologías */
function renderTechnologies() {
  const byCategory = new Map();
  for (const t of state.technologies) {
    if (!byCategory.has(t.category)) byCategory.set(t.category, []);
    byCategory.get(t.category).push(t);
  }

  $('#tech-groups').replaceChildren(
    ...[...byCategory].map(([category, techs]) =>
      h('section', { class: 'tech-group reveal' },
        h('h3', {}, category),
        h('ul', { class: 'tech-list' },
          techs.map((t) => {
            const btn = h('button', {
              type: 'button',
              class: `tech-chip${t.project_count ? '' : ' is-general'}`,
              onClick: () => filterByTech(t.id),
              disabled: t.project_count === 0,
            }, t.name, h('span', { class: 'tech-count' }, String(t.project_count)));

            tooltip.attach(btn, () => h('div', {},
              h('p', { class: 'tooltip-title' }, icon('folder'), t.project_count
                ? `Aplicada en ${t.project_count} proyecto${t.project_count === 1 ? '' : 's'}`
                : 'Experiencia general'),
              t.project_titles
                ? h('ul', { class: 'tooltip-list' }, t.project_titles.split(' | ').map((x) => h('li', {}, x)))
                : h('p', { class: 'tooltip-muted' }, 'Dominio técnico fuera de los proyectos listados.')));
            return h('li', {}, btn);
          }))))
  );
}

function filterByTech(techId) {
  state.techId = techId;
  state.category = 'todos';
  $$('#project-tabs .tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.category === 'todos')));
  renderProjects();
  tooltip.hide();
  $('#proyectos').scrollIntoView({ behavior: 'smooth' });
}

/* ============================================================== Experiencia */
function renderExperience(jobs) {
  $('#timeline').replaceChildren(
    ...jobs.map((j) =>
      h('li', { class: 'timeline-item reveal' },
        h('div', { class: 'timeline-dot', 'aria-hidden': 'true' }),
        h('div', { class: 'timeline-card' },
          h('p', { class: 'timeline-period' }, j.period),
          h('h3', {}, j.role, h('span', { class: 'at' }, ` · ${j.company}`)),
          h('ul', {}, j.items.map((i) => h('li', {}, i)))))),
  );
}

/* ============================================================== Formación */
function renderEducation(rows) {
  const KIND = { en_curso: 'En curso', grado: 'Grado', tecnico: 'Técnico', certificacion: 'Certificación' };
  const degrees = rows.filter((r) => r.kind !== 'certificacion');
  const certs = rows.filter((r) => r.kind === 'certificacion');

  $('#degrees').replaceChildren(...degrees.map((d) =>
    h('li', { class: `edu-card reveal${d.kind === 'en_curso' ? ' is-current' : ''}` },
      h('span', { class: 'badge' }, KIND[d.kind]),
      h('h3', {}, d.title),
      h('p', {}, [d.institution, d.year].filter(Boolean).join(' · ')))));

  $('#certs').replaceChildren(...certs.map((c) =>
    h('li', { class: 'cert reveal' }, icon('award'),
      h('span', {}, h('strong', {}, c.title), c.institution ? ` · ${c.institution}` : ''))));
}

/* ============================================================== UI global */
function setupTheme() {
  const btn = $('#theme-toggle');
  const apply = (theme) => {
    document.documentElement.dataset.theme = theme;
    btn.setAttribute('aria-pressed', String(theme === 'light'));
  };
  apply(document.documentElement.dataset.theme || 'dark');
  btn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    apply(next);
    localStorage.setItem('theme', next);
  });
}

function setupNav() {
  const toggle = $('#nav-toggle');
  const nav = $('#site-nav');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
    }
  });

  // Resalta la sección activa
  const links = $$('a[href^="#"]', nav);
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`));
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => observer.observe(s));

  $('#year').textContent = new Date().getFullYear();
}

function setupReveal() {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.12 });
  $$('.reveal').forEach((el) => io.observe(el));
}

/* ============================================================== Acceso / Registro (Candidatos) */
function setupAuth() {
  const dialog = $('#auth-dialog');
  if (!dialog) return;

  const savedUser = session.get();
  if (savedUser?.id) state.personId = savedUser.id;

  const closeBtn = $('#auth-close-btn');
  const loginForm = $('#login-form');
  const registerForm = $('#register-form');
  const googleBtn = $('#google-login-btn');
  const tabs = $$('[data-auth-tab]', dialog);

  const showFeedback = (msg, kind = 'ok') => {
    const fb = $('#auth-feedback');
    if (!fb) return;
    fb.hidden = !msg;
    fb.textContent = msg || '';
    fb.dataset.kind = kind;
  };

  tabs.forEach((tab) => tab.addEventListener('click', () => {
    const mode = tab.dataset.authTab;
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
    loginForm.hidden = mode !== 'login';
    registerForm.hidden = mode !== 'register';
    showFeedback('');
  }));

  closeBtn?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!activeDb) return showFeedback('La base SQLite requiere abrir el sitio mediante un servidor local.', 'error');
    const fd = new FormData(loginForm);
    try {
      const pwdHash = await hashPassword(String(fd.get('password') ?? ''));
      const user = activeDb.loginWithPassword(fd.get('email'), pwdHash);
      await completeAuth(user);
      dialog.close();
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  });

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!activeDb) return showFeedback('La base SQLite requiere abrir el sitio mediante un servidor local.', 'error');
    const fd = new FormData(registerForm);
    try {
      const pwdHash = await hashPassword(String(fd.get('password') ?? ''));
      const user = activeDb.registerPerson({
        full_name: fd.get('full_name'),
        email: fd.get('email'),
        headline: fd.get('headline'),
        location: fd.get('location'),
        years_exp: fd.get('years_exp'),
        linkedin_url: fd.get('linkedin_url'),
        password_hash: pwdHash,
        auth_provider: 'local',
      });
      await completeAuth(user);
      registerForm.reset();
      dialog.close();
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  });

  googleBtn?.addEventListener('click', async () => {
    if (!activeDb) return showFeedback('La base SQLite requiere abrir el sitio mediante un servidor local.', 'error');
    try {
      // Si hay Google Identity Services configurado con Client ID real, lo invocamos;
      // de lo contrario ofrecemos el acceso rápido asistido para pruebas locales sin backend.
      const email = prompt('Acceso rápido con Google — Ingresa tu correo de Google:', 'adrian.arayaaguilar@gmail.com');
      if (!email) return;
      const defaultName = email.toLowerCase() === 'adrian.arayaaguilar@gmail.com'
        ? 'Adrián Araya Aguilar'
        : email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const user = activeDb.loginOrRegisterGoogle({
        email,
        full_name: defaultName,
        google_sub: `google-${Date.now()}`,
      });
      await completeAuth(user);
      dialog.close();
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  });
}

async function completeAuth(user) {
  session.set({ id: user.id, full_name: user.full_name, email: user.email, auth_provider: user.auth_provider });
  state.personId = user.id;
  if (activeDb) {
    await drafts.save(activeDb.export());
    refreshFromDb();
  }
  renderAuthArea();
}

function renderAuthArea() {
  const area = $('#auth-area');
  const dialog = $('#auth-dialog');
  if (!area) return;

  const user = session.get();
  if (!user) {
    area.replaceChildren(
      h('button', {
        id: 'auth-open-btn',
        class: 'btn btn-ghost btn-sm auth-trigger',
        type: 'button',
        onClick: () => dialog?.showModal(),
      }, icon('user'), h('span', {}, 'Acceder')),
    );
    return;
  }

  const firstName = String(user.full_name || 'Candidato').split(' ')[0];
  area.replaceChildren(
    h('div', { class: 'user-pill' },
      icon('user'),
      h('span', { class: 'user-pill-name', title: `${user.full_name} (${user.email})` }, firstName),
      user.id !== 1
        ? h('button', {
            type: 'button',
            class: 'user-pill-action',
            title: state.personId === 1 ? 'Ver mi perfil de candidato' : 'Ver portafolio principal de Adrián',
            onClick: () => {
              state.personId = state.personId === 1 ? user.id : 1;
              refreshFromDb();
              renderAuthArea();
            },
          }, state.personId === 1 ? 'Mi perfil' : 'Portafolio Adrián')
        : null,
      h('a', { href: 'admin.html', class: 'user-pill-action', title: 'Editar datos en el panel Admin' }, 'Editar'),
      h('button', {
        type: 'button',
        class: 'user-pill-action',
        title: 'Cerrar sesión',
        onClick: () => {
          session.clear();
          state.personId = 1;
          refreshFromDb();
          renderAuthArea();
        },
      }, 'Salir')),
  );
}

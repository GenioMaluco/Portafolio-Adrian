/**
 * Panel de administración (solo cliente).
 * Edita la base SQLite en memoria, guarda borradores en IndexedDB y permite
 * exportar portfolio.db / seed.sql para publicarlos en el repositorio.
 */
import { openDatabase, openFromBytes, drafts } from './db.js';
import { h, $, $$, safeUrl } from './utils.js';

/** Tablas en orden de dependencias (para el volcado SQL). */
const DUMP_TABLES = ['persons', 'profile', 'links', 'technologies', 'projects', 'project_technologies',
  'experience', 'experience_items', 'education'];

const PROJECT_FIELDS = [
  { name: 'title', label: 'Título', required: true, wide: true },
  { name: 'slug', label: 'Slug (único, sin espacios)', required: true, pattern: '[a-z0-9-]+' },
  { name: 'category', label: 'Categoría', type: 'select', options: ['profesional', 'academico', 'github'] },
  { name: 'organization', label: 'Organización' },
  { name: 'year', label: 'Año' },
  { name: 'summary', label: 'Resumen', type: 'textarea', required: true, wide: true },
  { name: 'impact', label: 'Impacto / métrica', wide: true },
  { name: 'repo_url', label: 'URL repositorio', type: 'url' },
  { name: 'demo_url', label: 'URL demo', type: 'url' },
  { name: 'linkedin_url', label: 'URL publicación LinkedIn', type: 'url', wide: true },
  { name: 'sort_order', label: 'Orden', type: 'number' },
  { name: 'featured', label: 'Destacado', type: 'checkbox' },
];

const SQL_EXAMPLES = {
  'Uso de tecnologías': 'SELECT name, category, project_count FROM v_technology_usage ORDER BY project_count DESC;',
  'Proyectos por categoría': 'SELECT category, COUNT(*) AS total FROM projects GROUP BY category;',
  'Tecnologías sin proyectos': 'SELECT name, category FROM v_technology_usage WHERE project_count = 0;',
  'Proyectos con Spark': `SELECT p.title FROM projects p
JOIN project_technologies pt ON pt.project_id = p.id
JOIN technologies t ON t.id = pt.technology_id
WHERE t.name LIKE '%Spark%';`,
  'Candidatos (persons)': 'SELECT id, full_name, headline, email, auth_provider, created_at FROM persons;',
  'Agregar tecnología': "INSERT INTO technologies (name, category) VALUES ('TensorFlow', 'Datos & IA');",
};

let db;

/* ============================================================== Arranque */
init().catch((err) => {
  console.error(err);
  setStatus(`Error: ${err.message}`, 'error');
});

async function init() {
  db = await openDatabase({ preferDraft: true });
  setStatus(`Fuente: ${db.source}`);
  setupTabs();
  $('#project-new').addEventListener('click', () => openProjectDialog());
  renderAll();
  setupSqlConsole();
  setupDataActions();
}

function renderAll() {
  renderLinksForm();
  renderProfileForm();
  renderPersonsTable();
  renderProjectTable();
}

function setStatus(text, kind = 'ok') {
  const el = $('#status');
  el.textContent = text;
  el.dataset.kind = kind;
}

/** Persiste el estado actual como borrador local. */
async function persist(message = 'Borrador guardado') {
  await drafts.save(db.export());
  setStatus(`${message} · ${new Date().toLocaleTimeString()}`, 'draft');
}

/* ============================================================== Tabs */
function setupTabs() {
  const tabs = $$('.admin-tabs .tab');
  tabs.forEach((tab) => tab.addEventListener('click', () => {
    tabs.forEach((t) => {
      const active = t === tab;
      t.setAttribute('aria-selected', String(active));
      $(`#${t.getAttribute('aria-controls')}`).hidden = !active;
    });
  }));
}

/* ============================================================== Formularios */
function field({ name, label, type = 'text', required, options, pattern, wide }, value) {
  const id = `f-${name}`;
  let control;
  if (type === 'textarea') {
    control = h('textarea', { id, name, rows: 4, required }, value ?? '');
  } else if (type === 'select') {
    control = h('select', { id, name }, options.map((o) => h('option', { value: o, selected: o === value }, o)));
  } else if (type === 'checkbox') {
    control = h('input', { id, name, type, checked: Boolean(value) });
  } else {
    control = h('input', { id, name, type, required, pattern, value: value ?? '' });
  }
  return h('label', { class: `field${wide ? ' wide' : ''}${type === 'checkbox' ? ' field-check' : ''}`, for: id },
    h('span', {}, label), control);
}

function renderLinksForm() {
  const form = $('#links-form');
  const links = db.query('SELECT key, label, url FROM links ORDER BY sort_order');
  form.replaceChildren(
    ...links.map((l) => h('fieldset', { class: 'link-row wide' },
      h('legend', {}, l.key),
      field({ name: `label:${l.key}`, label: 'Texto' }, l.label),
      field({ name: `url:${l.key}`, label: 'URL', type: 'url' }, l.url))),
    h('div', { class: 'wide' }, h('button', { class: 'btn btn-primary btn-sm', type: 'submit' }, 'Guardar enlaces')),
  );
  form.onsubmit = async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    db.transaction(() => {
      for (const l of links) {
        const url = String(data.get(`url:${l.key}`) ?? '').trim();
        if (url && !safeUrl(url)) throw new Error(`URL inválida para ${l.key}`);
        db.run('UPDATE links SET label = ?, url = ? WHERE key = ?',
          [String(data.get(`label:${l.key}`)).trim(), url, l.key]);
      }
    });
    await persist('Enlaces guardados');
  };
}

function renderProfileForm() {
  const form = $('#profile-form');
  const p = db.query('SELECT * FROM profile WHERE id = 1')[0] ?? {};
  const defs = [
    { name: 'full_name', label: 'Nombre completo', required: true },
    { name: 'headline', label: 'Titular', required: true },
    { name: 'tagline', label: 'Frase principal', wide: true, required: true },
    { name: 'summary', label: 'Resumen profesional', type: 'textarea', wide: true, required: true },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'location', label: 'Ubicación' },
    { name: 'years_exp', label: 'Años de experiencia', type: 'number' },
    { name: 'avatar_url', label: 'Ruta foto de perfil (local)', wide: true },
  ];
  form.replaceChildren(...defs.map((d) => field(d, p[d.name])),
    h('div', { class: 'wide' }, h('button', { class: 'btn btn-primary btn-sm', type: 'submit' }, 'Guardar perfil')));
  form.onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const avatar = data.avatar_url || 'assets/img/Foto de Perfil.jpg';
    db.transaction(() => {
      db.run(`UPDATE profile SET full_name=?, headline=?, tagline=?, summary=?, email=?, location=?, years_exp=?, avatar_url=? WHERE id = 1`,
        [data.full_name, data.headline, data.tagline, data.summary, data.email || null, data.location || null,
          data.years_exp ? Number(data.years_exp) : null, avatar]);
      db.run(`UPDATE persons SET full_name=?, headline=?, tagline=?, summary=?, email=?, location=?, years_exp=?, avatar_url=? WHERE id = 1`,
        [data.full_name, data.headline, data.tagline, data.summary, data.email || null, data.location || null,
          data.years_exp ? Number(data.years_exp) : null, avatar]);
    });
    await persist('Perfil guardado');
    renderPersonsTable();
  };
}

function renderPersonsTable() {
  const table = $('#persons-table');
  if (!table) return;
  const rows = db.getPersons();
  table.replaceChildren(
    h('thead', {}, h('tr', {}, ['ID', 'Nombre', 'Titular', 'Email', 'LinkedIn', 'Acceso', ''].map((c) => h('th', { scope: 'col' }, c)))),
    h('tbody', {}, rows.map((r) => h('tr', {},
      h('td', {}, String(r.id)),
      h('td', {}, h('strong', {}, r.full_name)),
      h('td', {}, r.headline),
      h('td', {}, r.email ?? ''),
      h('td', {}, r.linkedin_url ? h('a', { href: safeUrl(r.linkedin_url), target: '_blank', rel: 'noopener noreferrer' }, 'Perfil') : '—'),
      h('td', {}, r.auth_provider),
      h('td', { class: 'row-actions' },
        r.id !== 1
          ? h('button', {
              type: 'button',
              class: 'btn btn-ghost btn-sm danger',
              onClick: async () => {
                if (!confirm(`¿Eliminar al candidato "${r.full_name}"?`)) return;
                db.run('DELETE FROM persons WHERE id = ?', [r.id]);
                renderPersonsTable();
                await persist('Candidato eliminado');
              },
            }, 'Eliminar')
          : h('span', { class: 'muted' }, 'Principal'))))),
  );
}

/* ============================================================== Proyectos */
function renderProjectTable() {
  const rows = db.query(`
    SELECT p.id, p.title, p.category, p.year, p.featured, COUNT(pt.technology_id) AS techs
    FROM projects p LEFT JOIN project_technologies pt ON pt.project_id = p.id
    GROUP BY p.id ORDER BY p.category, p.sort_order`);

  $('#project-table').replaceChildren(
    h('thead', {}, h('tr', {}, ['Título', 'Categoría', 'Año', '★', 'Tecn.', ''].map((c) => h('th', { scope: 'col' }, c)))),
    h('tbody', {}, rows.map((r) => h('tr', {},
      h('td', {}, r.title), h('td', {}, r.category), h('td', {}, r.year ?? ''),
      h('td', {}, r.featured ? '★' : ''), h('td', {}, String(r.techs)),
      h('td', { class: 'row-actions' },
        h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onClick: () => openProjectDialog(r.id) }, 'Editar'),
        h('button', { type: 'button', class: 'btn btn-ghost btn-sm danger', onClick: () => deleteProject(r) }, 'Eliminar'))))),
  );
}

function openProjectDialog(id = null) {
  const dialog = $('#project-dialog');
  const project = id ? db.query('SELECT * FROM projects WHERE id = ?', [id])[0] : { category: 'profesional', sort_order: 99 };
  const selected = new Set(id
    ? db.query('SELECT technology_id FROM project_technologies WHERE project_id = ?', [id]).map((r) => r.technology_id)
    : []);

  $('#project-dialog-title').textContent = id ? `Editar: ${project.title}` : 'Nuevo proyecto';
  $('#project-fields').replaceChildren(...PROJECT_FIELDS.map((f) => field(f, project[f.name])));

  const techs = db.query('SELECT id, name, category FROM technologies ORDER BY category, name');
  const groups = new Map();
  techs.forEach((t) => groups.set(t.category, [...(groups.get(t.category) ?? []), t]));
  $('#tech-picker').replaceChildren(...[...groups].map(([cat, list]) =>
    h('div', { class: 'tech-picker-group' }, h('strong', {}, cat),
      h('div', { class: 'tech-picker-items' }, list.map((t) =>
        h('label', { class: 'check' },
          h('input', { type: 'checkbox', name: 'tech', value: t.id, checked: selected.has(t.id) }), t.name))))));

  const form = $('#project-form');
  form.onsubmit = async (e) => {
    e.preventDefault();
    try {
      saveProject(id, new FormData(form));
      dialog.close();
      renderProjectTable();
      await persist('Proyecto guardado');
    } catch (err) {
      alert(`No se pudo guardar: ${err.message}`);
    }
  };
  $('#project-cancel').onclick = () => dialog.close();
  dialog.showModal();
}

function saveProject(id, data) {
  const v = (k) => {
    const s = String(data.get(k) ?? '').trim();
    return s === '' ? null : s;
  };
  for (const k of ['repo_url', 'demo_url', 'linkedin_url']) {
    if (v(k) && !safeUrl(v(k))) throw new Error(`URL inválida en ${k}`);
  }
  const values = [v('slug'), v('title'), v('summary'), v('impact'), v('category'), v('organization'), v('year'),
    v('repo_url'), v('demo_url'), v('linkedin_url'), data.has('featured') ? 1 : 0, Number(v('sort_order') ?? 0)];
  const techIds = data.getAll('tech').map(Number);

  db.transaction(() => {
    let projectId = id;
    if (id) {
      db.run(`UPDATE projects SET slug=?, title=?, summary=?, impact=?, category=?, organization=?, year=?,
              repo_url=?, demo_url=?, linkedin_url=?, featured=?, sort_order=? WHERE id = ?`, [...values, id]);
    } else {
      db.run(`INSERT INTO projects (slug, title, summary, impact, category, organization, year,
              repo_url, demo_url, linkedin_url, featured, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, values);
      projectId = db.query('SELECT last_insert_rowid() AS id')[0].id;
    }
    db.run('DELETE FROM project_technologies WHERE project_id = ?', [projectId]);
    techIds.forEach((t) => db.run('INSERT INTO project_technologies (project_id, technology_id) VALUES (?, ?)', [projectId, t]));
  });
}

async function deleteProject(row) {
  if (!confirm(`¿Eliminar "${row.title}"?`)) return;
  db.run('DELETE FROM projects WHERE id = ?', [row.id]);
  renderProjectTable();
  await persist('Proyecto eliminado');
}

/* ============================================================== Consola SQL */
function setupSqlConsole() {
  const input = $('#sql-input');
  $('#sql-examples').replaceChildren(...Object.entries(SQL_EXAMPLES).map(([label, sql]) =>
    h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onClick: () => { input.value = sql; input.focus(); } }, label)));

  const run = async () => {
    const out = $('#sql-output');
    const totalChanges = () => db.query('SELECT total_changes() AS n')[0].n;
    const before = totalChanges();
    try {
      const t0 = performance.now();
      const results = db.exec(input.value);
      const ms = (performance.now() - t0).toFixed(1);
      const modified = totalChanges() - before;
      const isDdl = /\b(create|drop|alter)\b/i.test(input.value);
      out.replaceChildren(
        h('p', { class: 'muted' }, `OK · ${ms} ms${modified ? ` · ${modified} fila(s) modificada(s)` : ''}`),
        ...results.map(resultTable));
      if (modified || isDdl) {
        await persist('Cambios SQL guardados');
        renderAll();
      }
    } catch (err) {
      out.replaceChildren(h('p', { class: 'sql-error' }, err.message));
    }
  };
  $('#sql-run').addEventListener('click', run);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
  });
}

function resultTable({ columns, values }) {
  return h('div', { class: 'table-wrap' }, h('table', { class: 'data-table' },
    h('thead', {}, h('tr', {}, columns.map((c) => h('th', { scope: 'col' }, c)))),
    h('tbody', {}, values.map((row) => h('tr', {}, row.map((v) => h('td', {}, v === null ? 'NULL' : String(v))))))));
}

/* ============================================================== Exportar / Importar */
function setupDataActions() {
  $('#export-db').addEventListener('click', () =>
    download(new Blob([db.export()], { type: 'application/x-sqlite3' }), 'portfolio.db'));

  $('#export-sql').addEventListener('click', () =>
    download(new Blob([dumpSql()], { type: 'text/plain;charset=utf-8' }), 'seed.sql'));

  $('#import-db').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      db = await openFromBytes(await file.arrayBuffer(), file.name);
      db.query('SELECT COUNT(*) FROM projects'); // valida esquema
      renderAll();
      await persist(`Importado ${file.name}`);
    } catch (err) {
      alert(`Archivo no válido: ${err.message}`);
    }
  });

  $('#discard').addEventListener('click', async () => {
    if (!confirm('¿Descartar todos los cambios locales?')) return;
    await drafts.clear();
    location.reload();
  });
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Genera un volcado de datos (INSERTs) compatible con data/seed.sql. */
function dumpSql() {
  const lit = (v) => {
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'number') return String(v);
    if (v instanceof Uint8Array) return `X'${[...v].map((b) => b.toString(16).padStart(2, '0')).join('')}'`;
    return `'${String(v).replaceAll("'", "''")}'`;
  };
  const lines = [
    '-- Volcado generado desde admin.html',
    `-- ${new Date().toISOString()}`,
    '-- Reemplaza data/seed.sql y ejecuta: python scripts/build_db.py',
    '',
  ];
  for (const table of DUMP_TABLES) {
    const [res] = db.exec(`SELECT * FROM ${table}`);
    if (!res) continue;
    lines.push(`-- ${table}`, `INSERT INTO ${table} (${res.columns.join(', ')}) VALUES`);
    lines.push(res.values.map((row) => `(${row.map(lit).join(', ')})`).join(',\n') + ';', '');
  }
  return lines.join('\n');
}

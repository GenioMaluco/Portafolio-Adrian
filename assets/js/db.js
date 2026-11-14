/**
 * Capa de datos: SQLite en el navegador (sql.js / WebAssembly).
 *
 * Orden de carga:
 *   1. Borrador local en IndexedDB/localStorage (si existe borrador o sesión activa, o admin/?preview=1)
 *   2. data/portfolio.db   (base publicada en el repositorio)
 *   3. data/schema.sql + data/seed.sql (fallback, se construye en memoria)
 */

const SQL_JS_DIR = 'vendor/sql.js/';
const DB_URL = 'data/portfolio.db';
const SCHEMA_URL = 'data/schema.sql';
const SEED_URL = 'data/seed.sql';

const DRAFT_STORAGE_KEY = 'portfolio.draft.b64';
const SESSION_STORAGE_KEY = 'portfolio.session.user';

let sqlModulePromise = null;

/** Carga (una sola vez) el motor sql.js. */
function loadSqlJs() {
  if (typeof window.initSqlJs !== 'function') {
    throw new Error('sql.js no está cargado. Incluye vendor/sql.js/sql-wasm.js antes de los módulos.');
  }
  sqlModulePromise ??= window.initSqlJs({ locateFile: (file) => `${SQL_JS_DIR}${file}` });
  return sqlModulePromise;
}

async function fetchOk(url, as = 'text') {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`HTTP ${res.status} al cargar ${url}`);
  return as === 'buffer' ? res.arrayBuffer() : res.text();
}

/* --------------------------------------------------------------------------
 * Persistencia local de borradores y sesión de usuario
 * ------------------------------------------------------------------------ */
function bytesToBase64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function base64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export const drafts = {
  async load() {
    const b64 = localStorage.getItem(DRAFT_STORAGE_KEY);
    return b64 ? base64ToBytes(b64) : null;
  },
  async save(bytes) {
    localStorage.setItem(DRAFT_STORAGE_KEY, bytesToBase64(bytes));
  },
  async clear() {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  },
};

export const session = {
  get() {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set(user) {
    if (!user) localStorage.removeItem(SESSION_STORAGE_KEY);
    else localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  },
};

/** Hash SHA-256 usando Web Crypto API para contraseñas locales. */
export async function hashPassword(password) {
  const data = new TextEncoder().encode(`portfolio-salt-v1:${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hashBuffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* --------------------------------------------------------------------------
 * Wrapper de base de datos
 * ------------------------------------------------------------------------ */
export class PortfolioDB {
  /** @param {import('sql.js').Database} db @param {string} source */
  constructor(db, source) {
    this.db = db;
    this.source = source;
    this.db.run('PRAGMA foreign_keys = ON;');
    try {
      this.ensureLatestSchema();
    } catch (err) {
      console.warn('[db] Aviso al verificar esquema:', err);
    }
  }

  ensureLatestSchema() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS persons (
        id            INTEGER PRIMARY KEY,
        slug          TEXT NOT NULL UNIQUE,
        full_name     TEXT NOT NULL,
        headline      TEXT NOT NULL,
        tagline       TEXT NOT NULL,
        summary       TEXT NOT NULL,
        email         TEXT UNIQUE,
        location      TEXT,
        years_exp     INTEGER DEFAULT 0,
        avatar_url    TEXT NOT NULL DEFAULT '',
        linkedin_url  TEXT NOT NULL DEFAULT '',
        github_url    TEXT NOT NULL DEFAULT '',
        book_url      TEXT NOT NULL DEFAULT '',
        cv_url        TEXT NOT NULL DEFAULT '',
        availability  TEXT NOT NULL DEFAULT 'Disponible para nuevos retos',
        auth_provider TEXT NOT NULL DEFAULT 'local',
        google_sub    TEXT,
        password_hash TEXT,
        is_public     INTEGER NOT NULL DEFAULT 1,
        created_at    TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    const cols = (table) => new Set(this.query(`PRAGMA table_info(${table})`).map((c) => c.name));
    const profCols = cols('profile');
    if (!profCols.has('avatar_url')) {
      this.db.run("ALTER TABLE profile ADD COLUMN avatar_url TEXT NOT NULL DEFAULT 'assets/img/Foto de Perfil.jpg'");
    }
    const projCols = cols('projects');
    if (!projCols.has('person_id')) {
      this.db.run('ALTER TABLE projects ADD COLUMN person_id INTEGER NOT NULL DEFAULT 1');
    }
    if (!projCols.has('linkedin_url')) {
      this.db.run('ALTER TABLE projects ADD COLUMN linkedin_url TEXT');
    }
    if (!projCols.has('image_url')) {
      this.db.run('ALTER TABLE projects ADD COLUMN image_url TEXT');
    }
    const expCols = cols('experience');
    if (!expCols.has('person_id')) {
      this.db.run('ALTER TABLE experience ADD COLUMN person_id INTEGER NOT NULL DEFAULT 1');
    }
    const eduCols = cols('education');
    if (!eduCols.has('person_id')) {
      this.db.run('ALTER TABLE education ADD COLUMN person_id INTEGER NOT NULL DEFAULT 1');
    }
    const countPersons = this.query('SELECT COUNT(*) AS n FROM persons')[0]?.n ?? 0;
    if (countPersons === 0) {
      this.db.run(`
        INSERT INTO persons (id, slug, full_name, headline, tagline, summary, email, location, years_exp, avatar_url, linkedin_url, github_url)
        SELECT 1, 'adrian-araya-aguilar', full_name, headline, tagline, summary, email, location, years_exp,
               COALESCE(avatar_url, 'assets/img/Foto de Perfil.jpg'),
               'https://www.linkedin.com/in/adrianarayaaguilar/',
               'https://github.com/GenioMaluco'
        FROM profile WHERE id = 1
      `);
    }
  }

  /** Ejecuta un SELECT parametrizado y devuelve un arreglo de objetos. */
  query(sql, params = []) {
    const stmt = this.db.prepare(sql);
    try {
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      return rows;
    } finally {
      stmt.free();
    }
  }

  /** Ejecuta una sentencia de escritura parametrizada. */
  run(sql, params = []) {
    this.db.run(sql, params);
    return this.db.getRowsModified();
  }

  /** Ejecuta varias sentencias dentro de una transacción. */
  transaction(fn) {
    this.db.run('BEGIN');
    try {
      const result = fn(this);
      this.db.run('COMMIT');
      return result;
    } catch (err) {
      this.db.run('ROLLBACK');
      throw err;
    }
  }

  /** Ejecuta SQL libre (consola admin). Devuelve [{columns, values}]. */
  exec(sql) {
    return this.db.exec(sql);
  }

  export() {
    return this.db.export();
  }

  /* ------------------------------ Repositorio ----------------------------- */

  getProfile(personId = 1) {
    if (personId) {
      const person = this.query('SELECT * FROM persons WHERE id = ?', [personId])[0];
      if (person) return person;
    }
    return this.query('SELECT * FROM profile WHERE id = 1')[0] ?? null;
  }

  getPersons() {
    return this.query(`
      SELECT id, slug, full_name, headline, tagline, summary, email, location,
             years_exp, avatar_url, linkedin_url, github_url, book_url, cv_url,
             availability, auth_provider, is_public, created_at
      FROM persons
      ORDER BY id`);
  }

  getLinks(personId = 1) {
    const rows = this.query('SELECT key, label, url FROM links ORDER BY sort_order');
    const map = Object.fromEntries(rows.map((r) => [r.key, { ...r }]));
    if (personId && personId !== 1) {
      const p = this.query('SELECT linkedin_url, github_url, book_url, cv_url FROM persons WHERE id = ?', [personId])[0];
      if (p) {
        if (map.linkedin) map.linkedin.url = p.linkedin_url || '';
        if (map.github) map.github.url = p.github_url || '';
        if (map.book) map.book.url = p.book_url || '';
        if (map.cv) map.cv.url = p.cv_url || '';
      }
    }
    return map;
  }

  getProjects(personId = null) {
    const where = personId ? 'WHERE person_id = ?' : '';
    const params = personId ? [personId] : [];
    const projects = this.query(`
      SELECT id, person_id, slug, title, summary, impact, category, organization, year,
             repo_url, demo_url, linkedin_url, image_url, featured
      FROM projects
      ${where}
      ORDER BY featured DESC, sort_order, title`, params);

    const techRows = this.query(`
      SELECT pt.project_id, t.id, t.name, t.category
      FROM project_technologies pt
      JOIN technologies t ON t.id = pt.technology_id
      ORDER BY t.category, t.name`);

    const byProject = new Map();
    for (const r of techRows) {
      if (!byProject.has(r.project_id)) byProject.set(r.project_id, []);
      byProject.get(r.project_id).push({ id: r.id, name: r.name, category: r.category });
    }
    return projects.map((p) => ({ ...p, technologies: byProject.get(p.id) ?? [] }));
  }

  getTechnologyUsage() {
    return this.query(`
      SELECT id, name, category, project_count, project_titles
      FROM v_technology_usage
      ORDER BY category, project_count DESC, name`);
  }

  getExperience(personId = null) {
    const jobs = personId
      ? this.query('SELECT * FROM experience WHERE person_id = ? ORDER BY sort_order', [personId])
      : this.query('SELECT * FROM experience ORDER BY sort_order');
    const items = this.query('SELECT experience_id, text FROM experience_items ORDER BY sort_order');
    return jobs.map((j) => ({
      ...j,
      items: items.filter((i) => i.experience_id === j.id).map((i) => i.text),
    }));
  }

  getEducation(personId = null) {
    return personId
      ? this.query('SELECT * FROM education WHERE person_id = ? ORDER BY sort_order', [personId])
      : this.query('SELECT * FROM education ORDER BY sort_order');
  }

  getStats(personId = 1) {
    return this.query(`
      SELECT
        (SELECT COUNT(*) FROM projects)                                        AS projects,
        (SELECT COUNT(*) FROM technologies)                                    AS technologies,
        (SELECT COUNT(DISTINCT technology_id) FROM project_technologies)       AS used_technologies,
        COALESCE((SELECT years_exp FROM persons WHERE id = ?),
                 (SELECT years_exp FROM profile WHERE id = 1), 0)              AS years`, [personId])[0];
  }

  /* ------------------------------ Autenticación & Candidatos -------------- */

  registerPerson({ full_name, email, headline, location, years_exp, linkedin_url, github_url, password_hash, auth_provider = 'local', google_sub = null, avatar_url = '' }) {
    const cleanEmail = String(email).trim().toLowerCase();
    const exists = this.query('SELECT id FROM persons WHERE lower(email) = ?', [cleanEmail])[0];
    if (exists) throw new Error('Ya existe una cuenta registrada con ese correo electrónico.');

    const baseSlug = String(full_name)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'candidato';
    const suffix = Math.floor(100 + Math.random() * 900);
    const slug = `${baseSlug}-${suffix}`;

    this.run(`
      INSERT INTO persons (
        slug, full_name, headline, tagline, summary, email, location, years_exp,
        avatar_url, linkedin_url, github_url, auth_provider, google_sub, password_hash, is_public
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      slug,
      full_name.trim(),
      (headline || 'Profesional en Tecnología & Datos').trim(),
      'Perfil profesional orientado a resultados y nuevas oportunidades laborales.',
      'Candidato registrado en la plataforma de portafolios profesionales.',
      cleanEmail,
      (location || '').trim(),
      Number(years_exp || 0),
      avatar_url || '',
      (linkedin_url || '').trim(),
      (github_url || '').trim(),
      auth_provider,
      google_sub,
      password_hash || null,
    ]);

    const id = this.query('SELECT last_insert_rowid() AS id')[0].id;
    return this.getProfile(id);
  }

  loginWithPassword(email, password_hash) {
    const cleanEmail = String(email).trim().toLowerCase();
    const user = this.query('SELECT * FROM persons WHERE lower(email) = ?', [cleanEmail])[0];
    if (!user) throw new Error('No encontramos una cuenta con ese correo. Puedes registrarte gratis.');
    if (user.auth_provider === 'google' && !user.password_hash) {
      throw new Error('Esta cuenta fue creada con Google. Usa el botón "Continuar con Google".');
    }
    if (user.password_hash && user.password_hash !== password_hash) {
      throw new Error('Contraseña incorrecta.');
    }
    return user;
  }

  loginOrRegisterGoogle({ email, full_name, avatar_url = '', google_sub = '' }) {
    const cleanEmail = String(email).trim().toLowerCase();
    const existing = this.query('SELECT * FROM persons WHERE lower(email) = ?', [cleanEmail])[0];
    if (existing) {
      if (avatar_url && !existing.avatar_url) {
        this.run('UPDATE persons SET avatar_url = ?, google_sub = COALESCE(google_sub, ?) WHERE id = ?',
          [avatar_url, google_sub, existing.id]);
      }
      return this.getProfile(existing.id);
    }
    return this.registerPerson({
      full_name: full_name || cleanEmail.split('@')[0],
      email: cleanEmail,
      headline: 'Especialista en Tecnología · Candidato',
      location: 'Costa Rica',
      years_exp: 1,
      linkedin_url: '',
      github_url: '',
      password_hash: null,
      auth_provider: 'google',
      google_sub,
      avatar_url,
    });
  }
}

/**
 * Abre la base de datos.
 * @param {{ preferDraft?: boolean }} [options]
 * @returns {Promise<PortfolioDB>}
 */
export async function openDatabase({ preferDraft = false } = {}) {
  const SQL = await loadSqlJs();
  const hasActiveSession = Boolean(session.get());

  if (preferDraft || hasActiveSession) {
    try {
      const draft = await drafts.load();
      if (draft) return new PortfolioDB(new SQL.Database(new Uint8Array(draft)), 'borrador local');
    } catch (err) {
      console.warn('[db] No se pudo leer el borrador local:', err);
    }
  }

  try {
    const buffer = await fetchOk(DB_URL, 'buffer');
    return new PortfolioDB(new SQL.Database(new Uint8Array(buffer)), DB_URL);
  } catch (err) {
    console.warn('[db] portfolio.db no disponible por fetch:', err.message);
  }

  if (typeof window.PORTFOLIO_DB_B64 === 'string' && window.PORTFOLIO_DB_B64.length > 0) {
    const bin = atob(window.PORTFOLIO_DB_B64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new PortfolioDB(new SQL.Database(bytes), 'data/portfolio.db (embebido)');
  }

  const [schema, seed] = await Promise.all([fetchOk(SCHEMA_URL), fetchOk(SEED_URL)]);
  const db = new SQL.Database();
  db.exec(schema);
  db.exec(seed);
  return new PortfolioDB(db, 'schema.sql + seed.sql');
}

/** Crea una base a partir de un archivo .db subido por el usuario. */
export async function openFromBytes(bytes, source = 'archivo importado') {
  const SQL = await loadSqlJs();
  return new PortfolioDB(new SQL.Database(new Uint8Array(bytes)), source);
}

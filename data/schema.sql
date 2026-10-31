-- =====================================================================
--  Portafolio Adrian Araya · Esquema SQLite
--  Fuente de verdad de la estructura. Se ejecuta en:
--    · scripts/build_db.py  (genera data/portfolio.db)
--    · el navegador (fallback si portfolio.db no está disponible)
-- =====================================================================
PRAGMA foreign_keys = ON;

-- Personas / Candidatos (permite escalar a múltiples perfiles profesionales)
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
  auth_provider TEXT NOT NULL DEFAULT 'local' CHECK (auth_provider IN ('local','google','firebase')),
  google_sub    TEXT,
  password_hash TEXT,
  is_public     INTEGER NOT NULL DEFAULT 1 CHECK (is_public IN (0,1)),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Perfil principal (sincronizado con la persona principal id = 1)
CREATE TABLE IF NOT EXISTS profile (
  id          INTEGER PRIMARY KEY CHECK (id = 1),
  full_name   TEXT NOT NULL,
  headline    TEXT NOT NULL,
  tagline     TEXT NOT NULL,
  summary     TEXT NOT NULL,
  email       TEXT,
  location    TEXT,
  years_exp   INTEGER,
  avatar_url  TEXT NOT NULL DEFAULT 'assets/img/Foto de Perfil.jpg'
);

-- Enlaces externos (LinkedIn, GitHub, libro, CV...). url vacía = "Próximamente"
CREATE TABLE IF NOT EXISTS links (
  key         TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  url         TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- Catálogo de tecnologías
CREATE TABLE IF NOT EXISTS technologies (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  category    TEXT NOT NULL
);

-- Proyectos
CREATE TABLE IF NOT EXISTS projects (
  id           INTEGER PRIMARY KEY,
  person_id    INTEGER NOT NULL DEFAULT 1 REFERENCES persons(id) ON DELETE CASCADE,
  slug         TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  summary      TEXT NOT NULL,
  impact       TEXT,                      -- métrica / resultado destacado
  category     TEXT NOT NULL CHECK (category IN ('profesional','academico','github')),
  organization TEXT,
  year         TEXT,
  repo_url     TEXT,
  demo_url     TEXT,
  linkedin_url TEXT,                      -- publicación de LinkedIn sobre el proyecto
  featured     INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0,1)),
  sort_order   INTEGER NOT NULL DEFAULT 0
);

-- Relación N:M proyecto ↔ tecnología
CREATE TABLE IF NOT EXISTS project_technologies (
  project_id    INTEGER NOT NULL REFERENCES projects(id)     ON DELETE CASCADE,
  technology_id INTEGER NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, technology_id)
);
CREATE INDEX IF NOT EXISTS ix_pt_technology ON project_technologies(technology_id);

-- Experiencia laboral
CREATE TABLE IF NOT EXISTS experience (
  id          INTEGER PRIMARY KEY,
  person_id   INTEGER NOT NULL DEFAULT 1 REFERENCES persons(id) ON DELETE CASCADE,
  role        TEXT NOT NULL,
  company     TEXT NOT NULL,
  period      TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS experience_items (
  id            INTEGER PRIMARY KEY,
  experience_id INTEGER NOT NULL REFERENCES experience(id) ON DELETE CASCADE,
  text          TEXT NOT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0
);

-- Formación y certificaciones
CREATE TABLE IF NOT EXISTS education (
  id          INTEGER PRIMARY KEY,
  person_id   INTEGER NOT NULL DEFAULT 1 REFERENCES persons(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  institution TEXT,
  year        TEXT,
  kind        TEXT NOT NULL CHECK (kind IN ('en_curso','grado','tecnico','certificacion')),
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- Vista: uso de cada tecnología (cuántos proyectos y cuáles)
DROP VIEW IF EXISTS v_technology_usage;
CREATE VIEW v_technology_usage AS
SELECT t.id,
       t.name,
       t.category,
       COUNT(pt.project_id)                 AS project_count,
       GROUP_CONCAT(p.title, ' | ')         AS project_titles
FROM technologies t
LEFT JOIN project_technologies pt ON pt.technology_id = t.id
LEFT JOIN projects p              ON p.id = pt.project_id
GROUP BY t.id;

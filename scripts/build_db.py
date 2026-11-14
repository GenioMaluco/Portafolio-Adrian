"""Genera data/portfolio.db y data/fallback.js a partir de data/schema.sql + data/seed.sql.

Uso:
    python scripts/build_db.py            # reconstruye la base y el fallback
    python scripts/build_db.py --check    # valida integridad sin escribir

Solo usa la librería estándar (sqlite3, base64, json), sin dependencias externas.
"""
from __future__ import annotations

import argparse
import base64
import json
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
SCHEMA = DATA / "schema.sql"
SEED = DATA / "seed.sql"
OUTPUT = DATA / "portfolio.db"
FALLBACK_JS = DATA / "fallback.js"


def export_snapshot(conn: sqlite3.Connection) -> dict:
    """Extrae un snapshot completo en JSON para que el sitio funcione incluso en file://."""
    conn.row_factory = sqlite3.Row
    q = lambda sql: [dict(r) for r in conn.execute(sql).fetchall()]

    profile = q("SELECT * FROM profile WHERE id = 1")[0]
    persons = q("SELECT id, slug, full_name, headline, tagline, summary, email, location, years_exp, avatar_url, linkedin_url, github_url, book_url, cv_url, availability, auth_provider, is_public FROM persons WHERE is_public = 1 ORDER BY id")
    links = {r["key"]: r for r in q("SELECT key, label, url FROM links ORDER BY sort_order")}

    projects = q(
        "SELECT id, person_id, slug, title, summary, impact, category, organization, year, "
        "repo_url, demo_url, linkedin_url, image_url, featured FROM projects ORDER BY featured DESC, sort_order, title"
    )
    tech_rows = q(
        "SELECT pt.project_id, t.id, t.name, t.category FROM project_technologies pt "
        "JOIN technologies t ON t.id = pt.technology_id ORDER BY t.category, t.name"
    )
    by_proj: dict[int, list] = {}
    for r in tech_rows:
        by_proj.setdefault(r["project_id"], []).append(
            {"id": r["id"], "name": r["name"], "category": r["category"]}
        )
    for p in projects:
        p["technologies"] = by_proj.get(p["id"], [])

    technologies = q(
        "SELECT id, name, category, project_count, project_titles "
        "FROM v_technology_usage ORDER BY category, project_count DESC, name"
    )

    jobs = q("SELECT * FROM experience ORDER BY sort_order")
    items = q("SELECT experience_id, text FROM experience_items ORDER BY sort_order")
    for j in jobs:
        j["items"] = [i["text"] for i in items if i["experience_id"] == j["id"]]

    education = q("SELECT * FROM education ORDER BY sort_order")
    stats = q(
        "SELECT (SELECT COUNT(*) FROM projects) AS projects, "
        "(SELECT COUNT(*) FROM technologies) AS technologies, "
        "(SELECT COUNT(DISTINCT technology_id) FROM project_technologies) AS used_technologies, "
        "(SELECT years_exp FROM profile WHERE id = 1) AS years"
    )[0]

    return {
        "profile": profile,
        "persons": persons,
        "links": links,
        "projects": projects,
        "technologies": technologies,
        "experience": jobs,
        "education": education,
        "stats": stats,
    }


def build(conn: sqlite3.Connection) -> None:
    conn.executescript(SCHEMA.read_text(encoding="utf-8"))
    conn.executescript(SEED.read_text(encoding="utf-8"))
    conn.commit()


def validate(conn: sqlite3.Connection) -> list[str]:
    """Reglas de calidad de datos. Devuelve la lista de problemas encontrados."""
    problems: list[str] = []
    if conn.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
        problems.append("integrity_check falló")
    fk = conn.execute("PRAGMA foreign_key_check").fetchall()
    if fk:
        problems.append(f"{len(fk)} violaciones de llaves foráneas")
    orphans = conn.execute(
        "SELECT slug FROM projects p WHERE NOT EXISTS "
        "(SELECT 1 FROM project_technologies pt WHERE pt.project_id = p.id)"
    ).fetchall()
    for (slug,) in orphans:
        problems.append(f"Proyecto sin tecnologías: {slug}")
    return problems


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="validar sin escribir archivo")
    args = parser.parse_args()

    target = ":memory:" if args.check else str(OUTPUT.with_suffix(".tmp"))
    if not args.check:
        Path(target).unlink(missing_ok=True)

    conn = sqlite3.connect(target)
    try:
        conn.execute("PRAGMA foreign_keys = ON")
        build(conn)
        problems = validate(conn)
        stats = {
            t: conn.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
            for t in ("persons", "projects", "technologies", "project_technologies", "experience", "education")
        }
        snapshot = export_snapshot(conn)
        if not args.check:
            conn.execute("VACUUM")
    finally:
        conn.close()

    for p in problems:
        print(f"[ERROR] {p}", file=sys.stderr)
    if problems:
        return 1

    if not args.check:
        Path(target).replace(OUTPUT)
        b64 = base64.b64encode(OUTPUT.read_bytes()).decode("ascii")
        snap_json = json.dumps(snapshot, ensure_ascii=False, separators=(",", ":"))
        FALLBACK_JS.write_text(
            "// Auto-generado por scripts/build_db.py — respaldo para file:// y carga instantánea\n"
            f'window.PORTFOLIO_DB_B64 = "{b64}";\n'
            f"window.PORTFOLIO_SNAPSHOT = {snap_json};\n",
            encoding="utf-8",
        )
        print(f"OK -> {OUTPUT.relative_to(ROOT)} + {FALLBACK_JS.relative_to(ROOT)}")
    print("  " + ", ".join(f"{k}={v}" for k, v in stats.items()))
    return 0


if __name__ == "__main__":
    sys.exit(main())

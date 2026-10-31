# Portafolio · Adrián Araya Aguilar

Sitio web profesional de **Data Engineering, Inteligencia Artificial y Business Intelligence**.
100 % estático: sin servidor ni servicios externos. El contenido vive en una base **SQLite** que se
consulta con SQL **directamente en el navegador** mediante [sql.js](https://github.com/sql-js/sql.js) (WebAssembly).
Se puede publicar gratis en **GitHub Pages**.

## Características

- Proyectos filtrables (Profesional · Académico IA · GitHub), búsqueda y filtro por tecnología.
- **Tooltip de tecnologías** al pasar el cursor (o enfocar con teclado) sobre cada proyecto.
- Matriz de tecnologías con conteo de uso y lista de proyectos donde se aplicó cada una.
- Experiencia, formación, certificaciones, libro *Proyecto Proton* y contacto.
- Enlaces (LinkedIn, GitHub, libro, CV) gestionados en la tabla `links`: si la URL está vacía se muestran como “Próximamente”.
- Tema claro/oscuro, diseño responsive, accesible (ARIA, foco, `prefers-reduced-motion`) y CSP estricta.
- **Panel `admin.html`**: editar enlaces, perfil y proyectos, consola SQL, exportar `portfolio.db` / `seed.sql`.

## Estructura

```
├── index.html              Sitio público
├── admin.html              Panel de edición (local, noindex)
├── 404.html
├── assets/
│   ├── css/                main.css · admin.css
│   ├── js/
│   │   ├── db.js           Capa de datos (sql.js + IndexedDB + repositorio de consultas)
│   │   ├── app.js          Renderizado del sitio
│   │   ├── admin.js        Lógica del panel admin
│   │   ├── tooltip.js      Tooltip accesible
│   │   ├── neural-bg.js    Fondo animado del hero
│   │   ├── utils.js        Helpers DOM seguros (sin innerHTML)
│   │   └── theme-init.js   Tema sin parpadeo
│   └── img/
├── data/
│   ├── schema.sql          Estructura (tablas, índices, vista)
│   ├── seed.sql            Datos (fuente editable y versionable)
│   └── portfolio.db        Base SQLite compilada (la que carga el sitio)
├── scripts/build_db.py     Genera y valida portfolio.db (solo librería estándar)
└── vendor/sql.js/          Motor SQLite WebAssembly (local, sin CDN)
```

### Modelo de datos

```
profile ─┐
links    │   projects ──< project_technologies >── technologies
         │   experience ──< experience_items
         └── education                      v_technology_usage (vista)
```

## Ejecutar en local

Los navegadores bloquean `fetch()` sobre `file://`, así que usa un servidor local:

```bash
python -m http.server 8000
# abre http://localhost:8000          (sitio)
# abre http://localhost:8000/admin.html (panel)
```

> En VS Code también funciona la extensión **Live Server**.

## Actualizar contenido

**Opción A — Editar SQL (recomendado, queda en el historial de Git):**

1. Edita `data/seed.sql` (o `schema.sql`).
2. `python scripts/build_db.py` → regenera y valida `data/portfolio.db`.
3. `git commit` + `git push`.

**Opción B — Panel admin:**

1. Abre `admin.html`, edita (los cambios se guardan como borrador en IndexedDB).
2. Revisa con **Vista previa** (`index.html?preview=1`).
3. **Exportar seed.sql** → reemplaza `data/seed.sql` y corre `python scripts/build_db.py`
   (o **Exportar portfolio.db** y reemplázalo directamente en `data/`).
4. `git push`.

### Conectar los enlaces pendientes

En `data/seed.sql`, sección `ENLACES`, completa la columna `url` de `linkedin`, `book` y `cv`
(o hazlo desde *admin → Enlaces*). Para el CV puedes subir el PDF a `assets/docs/cv.pdf` y usar esa ruta relativa.

## Publicar en GitHub Pages

1. Crea un repositorio (p. ej. `GenioMaluco.github.io` para usar la URL raíz, o cualquier nombre).
2. `git push` de este proyecto a la rama `main`.
3. En **Settings → Pages** elige *Deploy from a branch* → `main` / `(root)`.
4. El sitio quedará en `https://geniomaluco.github.io/<repo>/`.

El workflow `.github/workflows/validate-data.yml` valida la base en cada push que toque `data/` o `scripts/`.

## Buenas prácticas aplicadas

- Separación de capas: datos (SQL) · acceso a datos (`db.js`) · presentación (`app.js`, CSS).
- Consultas parametrizadas y transacciones; integridad referencial con `FOREIGN KEY` + `CHECK`.
- Renderizado sin `innerHTML` y URLs saneadas (`safeUrl`) para evitar XSS; CSP sin `unsafe-inline`.
- Sin dependencias en tiempo de ejecución de terceros (sql.js se sirve localmente).
- HTML semántico, navegación por teclado, `aria-*`, contraste en ambos temas y soporte de movimiento reducido.
- Script de build idempotente con validaciones de calidad de datos y CI.

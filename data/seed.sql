-- =====================================================================
--  Portafolio Adrian Araya · Datos iniciales
--  Edita este archivo (o usa admin.html) y regenera con:
--      python scripts/build_db.py
-- =====================================================================

-- ---------------------------------------------------------------- PERSONAS (CANDIDATOS)
INSERT INTO persons (
  id, slug, full_name, headline, tagline, summary, email, location, years_exp,
  avatar_url, linkedin_url, github_url, book_url, cv_url, availability, auth_provider, is_public
) VALUES
(1,
 'adrian-araya-aguilar',
 'Adrián Araya Aguilar',
 'Data Engineer · AI Developer · Business Intelligence',
 'Transformo datos en decisiones: ETL de alto rendimiento, modelos de Inteligencia Artificial y soluciones de BI.',
 'Ingeniero en Sistemas con más de 10 años de experiencia en análisis de datos, automatización y desarrollo de software. Especializado en el diseño de procesos ETL de alto rendimiento, optimización de bases de datos SQL y desarrollo de aplicaciones web orientadas a datos. Actualmente curso la Licenciatura en Ingeniería de Inteligencia Artificial, enfocado en Data Science, modelos predictivos y visión por computadora con Python y Spark.',
 'adrian.arayaaguilar@gmail.com',
 'San José, Costa Rica',
 10,
 'assets/img/Foto de Perfil.jpg',
 'https://www.linkedin.com/in/adrianarayaaguilar/',
 'https://github.com/GenioMaluco',
 'https://geniomaluco.github.io/Proyecto-Proton-Web/',
 '',
 'Disponible para nuevos retos',
 'local',
 1);

-- ---------------------------------------------------------------- PERFIL
INSERT INTO profile (id, full_name, headline, tagline, summary, email, location, years_exp, avatar_url) VALUES
(1,
 'Adrián Araya Aguilar',
 'Data Engineer · AI Developer · Business Intelligence',
 'Transformo datos en decisiones: ETL de alto rendimiento, modelos de Inteligencia Artificial y soluciones de BI.',
 'Ingeniero en Sistemas con más de 10 años de experiencia en análisis de datos, automatización y desarrollo de software. Especializado en el diseño de procesos ETL de alto rendimiento, optimización de bases de datos SQL y desarrollo de aplicaciones web orientadas a datos. Actualmente curso la Licenciatura en Ingeniería de Inteligencia Artificial, enfocado en Data Science, modelos predictivos y visión por computadora con Python y Spark.',
 'adrian.arayaaguilar@gmail.com',
 'San José, Costa Rica',
 10,
 'assets/img/Foto de Perfil.jpg');

-- ---------------------------------------------------------------- ENLACES
-- url = '' se muestra como "Próximamente". Complétalos aquí o en admin.html
INSERT INTO links (key, label, url, sort_order) VALUES
('linkedin', 'LinkedIn',              'https://www.linkedin.com/in/adrianarayaaguilar/',    1),
('github',   'GitHub',                'https://github.com/GenioMaluco',                     2),
('book',     'Libro Proyecto Proton', 'https://geniomaluco.github.io/Proyecto-Proton-Web/', 3),
('cv',       'Descargar CV',          '',                                                   4);

-- ---------------------------------------------------------------- TECNOLOGÍAS
INSERT INTO technologies (id, name, category) VALUES
-- Lenguajes
( 1,'Python','Lenguajes'),
( 2,'SQL','Lenguajes'),
( 3,'C#','Lenguajes'),
( 4,'Java','Lenguajes'),
( 5,'VBA','Lenguajes'),
( 6,'JavaScript','Lenguajes'),
( 7,'HTML5 / CSS3','Lenguajes'),
-- Datos & IA
(10,'Apache Spark (PySpark)','Datos & IA'),
(11,'Pandas','Datos & IA'),
(12,'NumPy','Datos & IA'),
(13,'Databricks','Datos & IA'),
(14,'Scikit-learn','Datos & IA'),
(15,'YOLO (Ultralytics)','Datos & IA'),
(16,'OpenCV','Datos & IA'),
(17,'PyTorch','Datos & IA'),
(18,'NLTK','Datos & IA'),
(19,'Jupyter Notebooks','Datos & IA'),
(20,'Modelado Predictivo','Datos & IA'),
(21,'Matplotlib / Seaborn','Datos & IA'),
-- Business Intelligence & Automatización
(30,'Power BI','BI & Automatización'),
(31,'DAX / Power Query (M)','BI & Automatización'),
(32,'Tableau','BI & Automatización'),
(33,'Excel Avanzado','BI & Automatización'),
(34,'Power Apps','BI & Automatización'),
(35,'Power Automate','BI & Automatización'),
(36,'UiPath RPA','BI & Automatización'),
(37,'Alteryx','BI & Automatización'),
(38,'SSIS','BI & Automatización'),
(39,'Google Apps Script','BI & Automatización'),
-- Desarrollo Web
(40,'Streamlit','Desarrollo Web'),
(41,'Flask','Desarrollo Web'),
(42,'FastAPI','Desarrollo Web'),
(43,'ASP.NET MVC','Desarrollo Web'),
-- Bases de datos
(50,'SQL Server','Bases de Datos'),
(51,'MySQL','Bases de Datos'),
(52,'Oracle','Bases de Datos'),
(53,'MongoDB','Bases de Datos'),
(54,'SQLite','Bases de Datos'),
-- Cloud & DevOps
(60,'Docker','Cloud & DevOps'),
(61,'Portainer','Cloud & DevOps'),
(62,'Dev Containers','Cloud & DevOps'),
(63,'AWS (S3, EC2, Redshift)','Cloud & DevOps'),
(64,'Google Cloud Platform','Cloud & DevOps'),
(65,'Git / GitHub','Cloud & DevOps'),
-- Herramientas
(70,'Visual Studio Code','Herramientas'),
(71,'Visual Studio','Herramientas'),
(72,'Jira','Herramientas'),
(73,'Zoho CRM','Herramientas'),
-- Metodologías & Normas
(80,'Scrum','Metodologías & Normas'),
(81,'Kanban','Metodologías & Normas'),
(82,'ISO 9001','Metodologías & Normas'),
(83,'ISO/IEC 27001','Metodologías & Normas'),
(84,'Balanced Scorecard','Metodologías & Normas');

-- ---------------------------------------------------------------- PROYECTOS
INSERT INTO projects (id, slug, title, summary, impact, category, organization, year, repo_url, demo_url, featured, sort_order) VALUES
-- Profesionales
( 1,'arbol-genealogico','Procesamiento Masivo: Árbol Genealógico Nacional',
 'Algoritmo que calcula 22 tipos de relaciones familiares hasta la 4.ª generación para toda la población de Costa Rica.',
 '160 millones de registros procesados en 45 minutos','profesional',NULL,'2025',NULL,NULL,1,1),
( 2,'probabilidad-contacto','Modelo de Probabilidad de Contacto',
 'Modelo de datos que estima la probabilidad de contactar a una persona según comportamiento de pago, deuda, salario y más de 10 variables.',
 'Score ponderado de 1 a 100 para priorizar gestiones','profesional',NULL,'2025',NULL,NULL,1,2),
( 3,'etl-ingesta-diaria','Plataforma ETL de Ingesta Diaria',
 'Procesos ETL para la ingesta diaria de datos y aplicaciones web end-to-end para su procesamiento y consulta.',
 'Consultas SQL hasta 300 % más rápidas','profesional','Sistemas Novedosos S.A.','2025',NULL,NULL,1,3),
( 4,'etl-ssis-powerbi','ETL con SSIS y Dashboards Estratégicos',
 'Flujos ETL de carga diaria con SSIS, SQL Jobs y procedimientos almacenados; dashboards de Power BI junto a stakeholders.',
 '30 % de mejora en tiempos de ejecución SQL','profesional','Instacredit','2024',NULL,NULL,0,4),
( 5,'balanced-scorecard','Balanced Scorecard Corporativo',
 'Dashboard integral en Power BI para el seguimiento diario de KPIs de múltiples unidades de negocio, alineado a objetivos estratégicos.',
 'Migración completa de reportes Excel → Power BI','profesional','INS Servicios','2020',NULL,NULL,1,5),
( 6,'auditoria-calidad','Automatización de Auditorías de Calidad',
 'Sistema de evaluación de calidad de llamadas que envía automáticamente resultados y retroalimentación a cada colaborador según guiones definidos.',
 'Retroalimentación automática por correo','profesional',NULL,'2019',NULL,NULL,0,6),
( 7,'power-platform-bat','Control de Horas Extra y Reservas (Power Platform)',
 'Aplicación de control de horas extra en Power Apps y sistema de reservas de instalaciones durante la pandemia, con flujos automatizados.',
 'Eliminación de controles manuales en papel/Excel','profesional','British American Tobacco','2022',NULL,NULL,0,7),
( 8,'rpa-migracion-alteryx','Automatización RPA y Migración desde Alteryx',
 'Controles de procedimientos operativos (SOP) con UiPath y liderazgo de la migración de procesos automatizados de Alteryx a Power Automate.',
 'Reducción de esfuerzo manual en reportería','profesional','British American Tobacco','2023',NULL,NULL,0,8),
-- Académicos · Licenciatura en Ingeniería de Inteligencia Artificial
(20,'reconocimiento-facial-yolo','Reconocimiento Facial con YOLO',
 'Detección y reconocimiento de rostros en imágenes y video en tiempo real usando modelos YOLO, con preprocesamiento en OpenCV y entrenamiento sobre dataset propio.',
 'Detección en tiempo real desde cámara web','academico','Lic. Ingeniería en IA','2026',NULL,NULL,1,20),
(21,'iso-9001-27001','Políticas y Estándares de Calidad ISO 9001 / ISO 27001',
 'Diseño de un Sistema de Gestión de Calidad y de Seguridad de la Información: políticas, análisis de riesgos, declaración de aplicabilidad y KPIs de cumplimiento.',
 'Matriz de riesgos y tablero de cumplimiento','academico','Lic. Ingeniería en IA','2026',NULL,NULL,1,21),
(22,'aprendizaje-supervisado','Modelos de Aprendizaje Supervisado',
 'Comparativa de modelos de clasificación y regresión (árboles, random forest, regresión logística) con validación cruzada y métricas de desempeño.',
 'Pipeline reproducible de entrenamiento y evaluación','academico','Lic. Ingeniería en IA','2026',NULL,NULL,0,22),
(23,'nlp-sentimiento','Análisis de Sentimiento con NLP',
 'Clasificación de opiniones en texto mediante técnicas de Procesamiento de Lenguaje Natural: limpieza, tokenización, TF-IDF y modelos de clasificación.',
 'Clasificador positivo / negativo / neutro','academico','Lic. Ingeniería en IA','2026',NULL,NULL,0,23),
-- GitHub
(40,'laboratorio-spark','Laboratorio Spark & Big Data',
 'Repositorio de prácticas con Spark: notebooks, estimadores, comparativas SQL vs Spark, Portainer, Dev Containers e integración con Power BI.',
 NULL,'github',NULL,'2025','https://github.com/GenioMaluco/Spark',NULL,1,40),
(41,'docker-spark-csv','Docker + Spark: Lectura de CSV',
 'Contenedor Docker con Spark capaz de leer y procesar información de archivos CSV previamente cargados.',
 NULL,'github',NULL,'2025','https://github.com/GenioMaluco/DockerSparkCSV',NULL,0,41),
(42,'sqlserver-docker-spark','SQL Server + Docker + Spark',
 'Conexión de Spark a SQL Server dentro de contenedores Docker para procesamiento distribuido de datos relacionales.',
 NULL,'github',NULL,'2025','https://github.com/GenioMaluco/SQLServerDockerSpark',NULL,0,42),
(43,'pyspark-proyecto','Proyecto PySpark',
 'Transformaciones y análisis de datos con PySpark aplicando buenas prácticas de procesamiento distribuido.',
 NULL,'github',NULL,'2025','https://github.com/GenioMaluco/PySpark_Proyecto',NULL,0,43),
(44,'streamlit-dashboard','Dashboard Interactivo con Streamlit',
 'Interfaz gráfica en Streamlit para explorar datos procesados con Spark y Python.',
 NULL,'github',NULL,'2025','https://github.com/GenioMaluco/StreamLitDashboard',NULL,0,44),
(45,'streamlit-sqlserver','Streamlit + SQL Server',
 'Aplicación funcional que conecta Streamlit con SQL Server para consulta y visualización de datos.',
 NULL,'github',NULL,'2025','https://github.com/GenioMaluco/StreamlitSQLServer',NULL,0,45),
(46,'webapp-mvc','Aplicación Web ASP.NET MVC',
 'Aplicación web con el patrón Modelo-Vista-Controlador sobre ASP.NET y C#.',
 NULL,'github',NULL,'2025','https://github.com/GenioMaluco/WebApp_MVC',NULL,0,46),
(47,'pagina-web-flask','Aplicación Web de Votaciones (Flask)',
 'Aplicación web en Flask con plantillas, recursos estáticos y persistencia ligera en JSON.',
 NULL,'github',NULL,'2026','https://github.com/GenioMaluco/Pagina-Web',NULL,0,47),
(48,'invitacion-web','Invitación Web Interactiva',
 'Sitio web de evento con galería, música y confirmación de asistencia integrada con Google Apps Script.',
 NULL,'github',NULL,'2026','https://github.com/GenioMaluco/UbicacionesPCD',NULL,0,48),
(49,'portafolio-sqlite','Este Portafolio: SQLite en el Navegador',
 'Sitio estático sin backend: los datos viven en una base SQLite que se consulta con SQL directamente en el navegador mediante WebAssembly.',
 'Cero servidores · desplegado en GitHub Pages','github',NULL,'2026','https://github.com/GenioMaluco/Portafolio-Adrian',NULL,0,49);

-- Proyectos creativos interactivos con portada e imagen destacada
INSERT INTO projects (id, slug, title, summary, impact, category, organization, year, repo_url, demo_url, image_url, featured, sort_order) VALUES
(50,'proyecto-proton-web','Proyecto Protón: Libro Interactivo, Audiolibro & Videojuego',
 'Plataforma web interactiva del Libro 1 Canon: compilador book-builder en Python, lector con seguimiento de progreso, audiolibro Read-Along (TTS/MP3), grafo anti-spoilers de personajes y videojuego demo jugable.',
 'Lector + Audiolibro Read-Along + Grafo de Personajes + Videojuego','github','Autoría propia','2026','https://github.com/GenioMaluco/Proyecto-Proton-Web','https://geniomaluco.github.io/Proyecto-Proton-Web/','assets/img/proton-portada.png',1,15),
(51,'cronicas-disociado','Crónicas de un Disociado (Web Cómic Interactivo)',
 'Web cómic interactivo de stand-up comedy en formato panorámico 16:9 con viñetas secuenciales animadas, efectos de tipeo en vivo, biblia/base de datos de personajes y modo horizontal inteligente.',
 '14 escenas interactivas · Narrativa visual y base de datos de personajes','github','Genio Maluco','2026','https://github.com/GenioMaluco/cronicas-disociado','https://geniomaluco.github.io/cronicas-disociado/#1','assets/img/cronicas-platillo.jpg',1,16);

-- ---------------------------------------------------------------- PROYECTO ↔ TECNOLOGÍA
INSERT INTO project_technologies (project_id, technology_id)
SELECT p.id, t.id FROM projects p JOIN technologies t ON 1 = 1 WHERE
  (p.slug = 'arbol-genealogico'     AND t.name IN ('Python','Apache Spark (PySpark)','Pandas','SQL Server','SQL','Docker','Visual Studio Code'))
OR (p.slug = 'probabilidad-contacto' AND t.name IN ('Python','Pandas','NumPy','Scikit-learn','Modelado Predictivo','SQL Server','SQL','Jupyter Notebooks'))
OR (p.slug = 'etl-ingesta-diaria'    AND t.name IN ('Python','Apache Spark (PySpark)','Pandas','SQL Server','SQL','Streamlit','Flask','FastAPI','Docker','Git / GitHub','Visual Studio Code'))
OR (p.slug = 'etl-ssis-powerbi'      AND t.name IN ('SSIS','SQL Server','SQL','Power BI','DAX / Power Query (M)','Visual Studio'))
OR (p.slug = 'balanced-scorecard'    AND t.name IN ('Power BI','DAX / Power Query (M)','Excel Avanzado','SQL Server','SQL','Balanced Scorecard'))
OR (p.slug = 'auditoria-calidad'     AND t.name IN ('Excel Avanzado','VBA','SQL Server','Power Automate'))
OR (p.slug = 'power-platform-bat'    AND t.name IN ('Power Apps','Power Automate','Power BI'))
OR (p.slug = 'rpa-migracion-alteryx' AND t.name IN ('UiPath RPA','Alteryx','Power Automate','Excel Avanzado'))
OR (p.slug = 'reconocimiento-facial-yolo' AND t.name IN ('Python','YOLO (Ultralytics)','OpenCV','PyTorch','NumPy','Jupyter Notebooks','Docker','Visual Studio Code','Git / GitHub'))
OR (p.slug = 'iso-9001-27001'        AND t.name IN ('ISO 9001','ISO/IEC 27001','Excel Avanzado','Power BI','Jira'))
OR (p.slug = 'aprendizaje-supervisado' AND t.name IN ('Python','Scikit-learn','Pandas','NumPy','Matplotlib / Seaborn','Jupyter Notebooks','Modelado Predictivo'))
OR (p.slug = 'nlp-sentimiento'       AND t.name IN ('Python','NLTK','Scikit-learn','Pandas','Matplotlib / Seaborn','Jupyter Notebooks'))
OR (p.slug = 'laboratorio-spark'     AND t.name IN ('Python','Apache Spark (PySpark)','Jupyter Notebooks','Docker','Portainer','Dev Containers','Power BI','SQL','Visual Studio Code','Git / GitHub'))
OR (p.slug = 'docker-spark-csv'      AND t.name IN ('Python','Apache Spark (PySpark)','Docker','Visual Studio Code'))
OR (p.slug = 'sqlserver-docker-spark' AND t.name IN ('Apache Spark (PySpark)','SQL Server','Docker','SQL','Visual Studio Code'))
OR (p.slug = 'pyspark-proyecto'      AND t.name IN ('Python','Apache Spark (PySpark)','Visual Studio Code'))
OR (p.slug = 'streamlit-dashboard'   AND t.name IN ('Python','Streamlit','Apache Spark (PySpark)','Pandas','Visual Studio Code'))
OR (p.slug = 'streamlit-sqlserver'   AND t.name IN ('Python','Streamlit','SQL Server','SQL','Pandas','Visual Studio Code'))
OR (p.slug = 'webapp-mvc'            AND t.name IN ('C#','ASP.NET MVC','HTML5 / CSS3','Visual Studio'))
OR (p.slug = 'pagina-web-flask'      AND t.name IN ('Python','Flask','HTML5 / CSS3','JavaScript','Visual Studio Code'))
OR (p.slug = 'invitacion-web'        AND t.name IN ('HTML5 / CSS3','JavaScript','Google Apps Script','Docker','Visual Studio Code'))
OR (p.slug = 'portafolio-sqlite'     AND t.name IN ('SQLite','SQL','JavaScript','HTML5 / CSS3','Python','Git / GitHub','Visual Studio Code'))
OR (p.slug = 'proyecto-proton-web'   AND t.name IN ('Python','JavaScript','HTML5 / CSS3','SQLite','Git / GitHub','Visual Studio Code'))
OR (p.slug = 'cronicas-disociado'    AND t.name IN ('JavaScript','HTML5 / CSS3','SQLite','Git / GitHub','Visual Studio Code'));

-- ---------------------------------------------------------------- EXPERIENCIA
INSERT INTO experience (id, role, company, period, sort_order) VALUES
(1,'FullStack Developer','Sistemas Novedosos S.A.','Jul 2025 – Presente',1),
(2,'Data Specialist','Instacredit','Nov 2024 – Jun 2025',2),
(3,'Business Analyst','British American Tobacco','Feb 2021 – Ago 2024',3),
(4,'Data Analyst','INS Servicios','Ago 2014 – Feb 2021',4);

INSERT INTO experience_items (experience_id, text, sort_order) VALUES
(1,'Diseño e implementación de procesos ETL de ingesta diaria con Python, Spark y Pandas.',1),
(1,'Optimización de consultas SQL con mejoras de rendimiento de hasta 300 %.',2),
(1,'Desarrollo de aplicaciones web end-to-end para procesamiento de datos con Streamlit, Flask y FastAPI.',3),
(2,'Flujos ETL de carga diaria con SSIS, SQL Jobs y procedimientos almacenados.',1),
(2,'Reducción del 30 % en tiempos de ejecución mediante indexación y optimización de scripts.',2),
(2,'Dashboards de Power BI junto a stakeholders para la toma de decisiones estratégicas.',3),
(3,'Automatización de reportería con Power Automate.',1),
(3,'Aplicación de control de horas extra en Power Apps.',2),
(3,'Controles SOP automatizados con UiPath RPA.',3),
(3,'Liderazgo de la migración de procesos de Alteryx a Power Automate.',4),
(3,'Implementación de un sistema de reservas de instalaciones durante la pandemia.',5),
(4,'Dashboards especializados en Excel y Power BI para Call Center, Operaciones, TI y Finanzas.',1),
(4,'Automatización de reportes diarios con datos disponibles en tiempo real.',2),
(4,'Transición organizacional de Excel a Power BI con un Balanced Scorecard estratégico.',3),
(4,'Capacitación en Power BI al equipo de Gestión de la Información.',4);

-- ---------------------------------------------------------------- FORMACIÓN
INSERT INTO education (title, institution, year, kind, sort_order) VALUES
('Licenciatura en Ingeniería de Inteligencia Artificial', NULL, 'En curso', 'en_curso', 1),
('Bachillerato en Ingeniería de Sistemas', 'Universidad Americana (UAM)', '2021', 'grado', 2),
('Técnico en Recursos Humanos', 'ITSMO', '2012', 'tecnico', 3),
('RPA Developer', 'UiPath', NULL, 'certificacion', 10),
('Data Analysis & Visualization', 'Microsoft', NULL, 'certificacion', 11),
('Excel Avanzado', 'INA', NULL, 'certificacion', 12),
('Estándares ISO 9001', NULL, NULL, 'certificacion', 13);

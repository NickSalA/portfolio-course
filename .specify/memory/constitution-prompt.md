# Prompt para `/speckit-constitution`

Copia el texto siguiente como entrada de `/speckit-constitution`. Este archivo es una guía para redactar la constitución; no reemplaza ni actualiza por sí mismo `constitution.md`.

---

Actualiza la constitución de este repositorio usando la plantilla activa de Spec Kit y respetando su estructura. Escribe la constitución en español, con principios breves, normativos, comprobables y aplicables a todo el proyecto. No dejes marcadores de plantilla sin resolver.

## Contexto del proyecto

Este repositorio contiene una aplicación web académica única, implementada con Next.js, React y TypeScript, y Supabase/PostgreSQL como backend y base de datos. El propósito principal es facilitar la gestión de docentes y alumnos, con énfasis en las herramientas de gestión para docentes.

La funcionalidad actual incluye la gestión de cursos, alumnos y movimientos de puntos adicionales. Los alumnos pueden consultar su propia información autorizada. La autenticación y autorización deben tratarse como conceptos distintos: iniciar sesión no concede por sí solo acceso a los datos académicos. Los permisos y las reglas críticas deben validarse en servidor y/o PostgreSQL, no solo en la interfaz.

Como trabajo final del curso de Automatización y Control de Software, se espera diseñar e implementar una automatización de un proceso real del sistema. La propuesta debe demostrar automatización de actividades repetitivas, reglas de control, gestión de eventos, validación de la ejecución, registro de evidencias y resultados, manejo de errores y excepciones, monitoreo y evaluación mediante pruebas. La constitución debe establecer principios de ingeniería que faciliten cumplir estos criterios sin especificar por adelantado toda la solución del trabajo final.

En el futuro se podrían añadir otros tipos de calificaciones para los alumnos. Esto es una posibilidad futura, no una funcionalidad actual ni un compromiso que deba detallarse en la constitución; cuando se decida realizarla, se definirá mediante `/speckit-specify`.

El repositorio será utilizado por varias personas y herramientas de agentes de código. La constitución debe ser la referencia normativa compartida del proyecto, estar redactada de forma independiente de un proveedor o agente específico y no depender de `AGENTS.md` ni de `CONTEXT.md`, que se retirarán para evitar duplicación o conflicto de reglas.

## Principios que debe formalizar

Incluye principios que cubran estos compromisos, consolidándolos si la plantilla requiere menos principios:

1. **Seguridad y autorización por defecto:** aplicar mínimo privilegio, validar autorización en servidor y proteger los datos académicos en PostgreSQL mediante RLS. La autenticación no concede por sí sola acceso académico. No exponer secretos ni confiar en validaciones del cliente.
2. **Integridad y trazabilidad de los datos:** mantener las reglas del dominio en límites verificables y reforzarlas con restricciones o transacciones en PostgreSQL/RPC cuando corresponda. Las operaciones que cambian información académica deben conservar suficiente trazabilidad para explicar qué resultado produjeron. No borrar el historial de puntos para corregirlo; usar ajustes o reversiones.
3. **Separación de responsabilidades y simplicidad:** mantener límites claros entre interfaz, reglas de negocio, autenticación y acceso a datos, sin sobrearquitectura. Conservar una aplicación única mientras satisfaga los requisitos; justificar cualquier servicio separado por una necesidad técnica demostrable.
4. **Automatización controlada, observable y recuperable:** toda automatización debe identificar entradas, reglas, estados/eventos relevantes, resultados esperados, validaciones, errores y excepciones. Debe dejar evidencia útil de las ejecuciones y exponer información suficiente para monitorear su funcionamiento, protegiendo secretos y datos personales. Diseñar idempotencia y recuperación ante fallos cuando el proceso lo requiera. Al completar una automatización, registrar su diseño realizado, operación y evaluación en documentación versionada dentro de `docs/`, incluyendo resultados y evidencias, y enlazar los artefactos de especificación sin duplicarlos.
5. **Calidad evaluable, CI/CD y colaboración:** validar el comportamiento con pruebas representativas, incluidos casos válidos, inválidos y excepcionales. Evaluar los resultados frente a criterios definidos y conservar evidencia reproducible. Ejecutar automáticamente las verificaciones disponibles antes de integrar cambios y desplegar de forma controlada, sin exigir herramientas o pipelines que aún no estén configurados. Usar Git Flow con ramas de trabajo, integración, release y producción; integrar cambios mediante pull requests revisados y verificaciones, sin trabajar directamente sobre las ramas compartidas. Documentar decisiones de forma compartida; las convenciones no deben depender de un agente o proveedor específico.
6. **Commits y versionado reproducibles:** usar Conventional Commits para que los cambios sean comprensibles y puedan alimentar changelogs o automatización de releases. Aplicar SemVer a versiones publicadas y automatizar su cálculo/publicación en el límite de un release, no incrementando la versión por cada commit. Mantener el versionado de migraciones de base de datos separado del versionado de la aplicación.

## Restricciones y flujo de trabajo

- Mantén Next.js, Supabase y PostgreSQL como tecnologías actuales; no propongas reemplazos ni nuevas dependencias como regla general.
- Las migraciones de base de datos son versionadas en `portfolio-coursse/supabase/migrations/`.
- Mantén los secretos fuera del control de versiones y nunca expongas credenciales privadas al navegador.
- Conserva los límites de acceso por rol: los docentes gestionan la información bajo su responsabilidad y los alumnos solo consultan sus propios datos autorizados.
- Para el proceso de automatización elegido para el trabajo final, exige requisitos y criterios de aceptación que permitan verificar controles, validaciones, manejo de errores, evidencia, monitoreo y resultados de pruebas. La constitución fija estos estándares; la funcionalidad concreta se especificará por separado con `/speckit-specify`.
- Al completar una automatización, crea un registro versionado en `docs/automatizaciones/<nombre-del-proceso>/evaluacion.md`. Incluye el proceso y problema abordado, reglas y controles implementados, arquitectura aplicada y su justificación, eventos, validaciones, manejo de errores y excepciones, monitoreo, pruebas ejecutadas, evidencias, resultados frente a indicadores definidos y conclusiones. Distingue claramente lo planificado de lo efectivamente implementado y evaluado.
- El registro de `docs/` debe ser una memoria de implementación y evaluación, no una copia de los specs, planes o tareas. Enlaza los artefactos de Spec Kit relacionados y conserva allí los resultados y evidencias finales que no estén en esos artefactos. No incluyas credenciales ni datos personales reales innecesarios; usa datos anonimizados o sintéticos para evidencias compartidas.
- Mantén los entregables formales del curso (informe y presentación) como documentos del trabajo académico, derivados de la evidencia del proyecto; no confundas esos entregables con los artefactos de planificación de Spec Kit.
- Antes de agregar complejidad, justifica su necesidad respecto a los requisitos y al tamaño real del proyecto.
- Las revisiones de cambios deben comprobar seguridad, integridad de datos, pruebas pertinentes y coherencia con la constitución.
- Aplica Git Flow: `main` representa producción y `develop` integra el trabajo aprobado para la siguiente versión. Desarrolla cada funcionalidad en `feature/<nombre>` y cada corrección regular en `bugfix/<nombre>`, ambas derivadas de `develop` e integradas de vuelta mediante pull request a `develop` con revisión y verificaciones. No hagas commits directos a `main` ni a `develop`.
- Prepara releases desde `develop` mediante `release/<version>`; tras validar, integra la release en `main`, etiqueta la versión y devuelve los cambios necesarios a `develop`. Reserva `hotfix/<nombre>` derivadas de `main` para correcciones urgentes de producción e intégralas tanto en `main` como en `develop`. Elimina ramas de trabajo ya integradas cuando sea seguro.
- La integración continua debe ejecutar las comprobaciones que el repositorio tenga configuradas y que sean pertinentes al cambio (por ejemplo, lint, tipos, pruebas y build); no declares como requisito un pipeline inexistente.
- Los despliegues continuos deben proteger secretos y entornos. La producción solo se despliega cuando exista un proceso aprobado y verificable; no se exige despliegue automático si el proyecto aún no tiene configurado un entorno.
- Usa Conventional Commits con el formato `tipo(alcance): descripción imperativa`, respetando los tipos permitidos acordados por el proyecto. Usa el historial para preparar changelogs o releases cuando corresponda.
- Usa SemVer (`MAJOR.MINOR.PATCH`) para releases de la aplicación. Automatiza la determinación y publicación de la versión al preparar un release; no cambies la versión por cada commit. Mantén las migraciones de Supabase secuenciales y versionadas de manera independiente.
- No conviertas una posibilidad futura, como añadir más tipos de calificaciones, en requisito actual de la constitución. Cuando se apruebe esa funcionalidad, deberá especificarse por separado.
- La constitución gobierna el desarrollo del producto completo. No incorpores como principios permanentes fechas de entrega, formato del informe o presentación del curso; esos son entregables del trabajo académico, no reglas generales de ingeniería.

Redacta la constitución usando únicamente el contexto confirmado en este prompt y los archivos actuales del proyecto que sigan vigentes. No uses `AGENTS.md` ni `CONTEXT.md` como fuentes normativas; serán retirados y la constitución debe evitar duplicar su contenido. Si una fecha original de ratificación no puede determinarse a partir del repositorio, no la inventes: déjala identificada como TODO para revisión humana. Incrementa la versión según el cambio real de la constitución y actualiza la fecha de última enmienda según corresponda.

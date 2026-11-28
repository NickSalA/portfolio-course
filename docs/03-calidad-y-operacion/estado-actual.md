# Calidad y operación: estado documentado

## Verificaciones disponibles en el repositorio

Esta actualización es una **inspección estática**, no una certificación operativa. El
[paquete de la aplicación](../../portfolio-coursse/package.json) declara `dev`, `start`, `lint`,
`build`, `typecheck`, `test` (Vitest), `test:e2e` (Playwright) y `test:db` (Supabase).
Hay una prueba unitaria de infraestructura en `tests/unit/test-harness.test.ts`, soporte E2E y
pruebas SQL; esto no equivale a una batería funcional completa ni a resultados aprobados.
[Vitest](../../portfolio-coursse/vitest.config.ts) busca `tests/unit/**/*.test.ts` (incluidas las pruebas de contraste WCAG en `tests/unit/wcag-contrast.test.ts`; `17` archivos / `90` pruebas);
[Playwright](../../portfolio-coursse/playwright.config.ts) apunta a `tests/e2e`, exige Supabase
local y configura servidor Next.js local, donde ya existe la suite [`tests/e2e/qa-01-integrated-accessibility.spec.ts`](../../portfolio-coursse/tests/e2e/qa-01-integrated-accessibility.spec.ts) ejecutada localmente contra Docker/Supabase (`Q-E01`–`Q-E18`, `16/16` pruebas en `38.6s`).

El workflow [CI](../../.github/workflows/ci.yml) declara instalación, lint, generación de tipos,
TypeScript y build para PR/push a `main`; **no ejecuta** `test`, `test:e2e` ni `test:db`.
[Release](../../.github/workflows/release.yml) declara `semantic-release` en push a `main`, sin
pruebas ni dependencia declarada del job de CI. Su presencia no prueba ejecuciones exitosas,
despliegues ni conexión a producción. La referencia previa a Vercel/Supabase productivo procede
del responsable; no se inspeccionaron proveedor, registros ni disponibilidad de un entorno remoto
de pruebas. Hay configuración local, no certificación de su funcionamiento.

Las [migraciones SQL](../../portfolio-coursse/supabase/migrations/) definen políticas RLS y
funciones para proteger operaciones académicas. La evidencia histórica documenta aplicación de
`0001`–`0029` mediante `db reset --local` en la instancia local. No se repitió aquí. La prueba reproducible
[`group_grades_rls.sql`](../../portfolio-coursse/supabase/qa/group_grades_rls.sql) pasó
con identidades sintéticas: alumno sin lectura, docentes restringidos a sus propios cursos,
modificación permitida al docente responsable e inserción entre cursos rechazada. Los fixtures
se revierten al final. Esto **no prueba la aplicación remota** ni despliegue. En
particular, la migración
[`0029`](../../portfolio-coursse/supabase/migrations/0029_restrict_group_grades_to_teachers.sql)
retira el acceso de lectura estudiantil a notas grupales concedido por `0028` y limita
escrituras docentes a pares grupo/evaluación del mismo curso. Producción no fue modificada.

## Alcance vigente frente a evidencia anterior

El [consolidado](../../development/PLAN-REFINAMIENTO-PARTE-I.md), leído completo, autoriza
consulta estudiantil de notas desde el registro confirmado por participantes históricos de cada
actividad. `0029` la bloquea actualmente: no se revierte ni se interpreta el test histórico de
denegación como aceptación del nuevo alcance. El panel observado consulta puntos y matrícula,
no notas históricas. Reclamos, avisos docentes y XLSX calculado son objetivo acordado, no operación
verificada. La reapertura de ventana es para todo el curso y no obliga a un traslado directo docente.

La [evaluación](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md#alcance-vigente-y-backlog-pendiente)
conserva los FR verificados del alcance anterior y añade historias vigentes pendientes, vinculadas
al [backlog BK-01–BK-24](../04-gestion/backlog-y-responsabilidades.md). BK-01 exige sincronizar
`specs`, que todavía contiene reglas contradictorias. Ningún estado histórico certifica esas ampliaciones.

### Recorrido de descarga XLSX por curso (`EXP-03 #40`)

Se incorporó la descarga individual por curso en [`GET /api/teacher/courses/[coursePublicId]/export`](../../portfolio-coursse/app/api/teacher/courses/[coursePublicId]/export/route.ts), respaldada por la RPC de solo lectura [`list_course_export_grade_attributions`](../../portfolio-coursse/supabase/migrations/0051_course_export_historical_data.sql) (`0051`, `STABLE SECURITY DEFINER`), el módulo puro [`course-export.ts`](../../portfolio-coursse/lib/export/course-export.ts) sobre `EXP-02` ([`adjusted-average.ts`](../../portfolio-coursse/lib/export/adjusted-average.ts)) y el botón [`CourseExportButton`](../../portfolio-coursse/components/teacher/grades/course-export-button.tsx) en `/teacher/grades` y `/teacher/courses/[coursePublicId]`.

- **Reglas implementadas:** autorización docente por sesión verificada y propiedad del curso en servidor y RPC; lectura exclusiva de notas confirmadas (`revision > 0`) vinculadas a `academic_access.group_grade_participants` (sin inferencia por grupo actual ni inclusión de notas legacy `revision = 0`); pendientes en blanco, cero explícito numérico, cálculo derivado con el supuesto revisable del equipo y cero mutaciones sobre notas o saldo al repetir descargas.
- **Límites vigentes:** la migración `0051` y la suite SQL [`exp_03_course_export.sql`](../../portfolio-coursse/supabase/qa/exp_03_course_export.sql) no se ejecutaron en Docker/Supabase local en esta sesión; el recorrido visual en navegador en vivo, la revisión independiente de R2 (`@RobertoPizarro`), la validación QA de `EXP-04 #41` y cualquier entorno desplegado siguen pendientes. No es acta oficial ni integración SUM.

### Presentación de reclamos (`REC-02 #32`)

Se incorporaron las operaciones de presentación y consulta estudiantil sobre el modelo `REC-01` (`0050`): migración [`0052_submit_claims_rpc.sql`](../../portfolio-coursse/supabase/migrations/0052_submit_claims_rpc.sql) (`submit_group_grade_claim`, `submit_point_transaction_claim` y `list_student_claims`), servicio [`lib/claims/submit-claim.ts`](../../portfolio-coursse/lib/claims/submit-claim.ts), validaciones [`lib/claims/validation.ts`](../../portfolio-coursse/lib/claims/validation.ts) y Server Actions [`app/student/claims/actions.ts`](../../portfolio-coursse/app/student/claims/actions.ts).

- **Reglas implementadas:** creación exclusiva en estado `pending`, autorización en servidor/BD por participación histórica (`group_grade`) o titularidad (`point_transaction`), convergencia idempotente ante reintento equivalente del mismo autor (`created: false`), rechazo con error comprensible ante duplicados o accesos no autorizados, y persistencia desacoplada del envío de correo (`REC-06`).
- **Límites vigentes:** las migraciones `0050`/`0052` y las suites SQL [`rec_01_claims_model.sql`](../../portfolio-coursse/supabase/qa/rec_01_claims_model.sql) y [`rec_02_claim_submission.sql`](../../portfolio-coursse/supabase/qa/rec_02_claim_submission.sql) quedan pendientes de ejecución en Docker/Supabase local; la interfaz estudiantil corresponde a `REC-04 #34` y la atención docente a `REC-03 #33` / `REC-05 #35`.

### Bandeja y detalle docente de reclamos (`REC-05 #35`)

Se implementó la vista docente [`/teacher/claims`](../../portfolio-coursse/app/teacher/claims/page.tsx) con entrada «Reclamos» en el sidebar docente ([`teacher-sidebar.tsx`](../../portfolio-coursse/components/teacher/shell/teacher-sidebar.tsx)), filtros por estado y tipo, detalle del registro histórico asociado, acciones ordenadas (`Iniciar revisión` → `Enviar respuesta final`), aviso explícito con enlace separado a Notas/Puntos para correcciones académicas y control técnico de reintento de correo (`REC-06`). El recorrido visual en navegador en vivo, la ejecución SQL local y la revisión independiente de R2 (`@RobertoPizarro`) siguen pendientes.

### Interfaz estudiantil de reclamos (`REC-04 #34`)

Se integró la presentación y consulta de reclamos en [`/student`](../../portfolio-coursse/app/student/page.tsx) mediante [`lib/claims/student-claims.ts`](../../portfolio-coursse/lib/claims/student-claims.ts), [`getStudentDashboard`](../../portfolio-coursse/lib/student/get-dashboard.ts) (`listStudentClaims`), [`StudentCourseAcademicRecords`](../../portfolio-coursse/components/student-portal/student-claims-panel.tsx) y [`StudentCourseCard`](../../portfolio-coursse/components/student-portal/student-course-card.tsx):

- **Presentación contextual y unicidad visible:** desde cada fila de *Notas grupales* históricas (`group_grade`, identificando evaluación, grupo histórico y nota o `Pendiente`) y desde cada movimiento de *Puntos* (`point_transaction`), el alumno abre un `<dialog>` accesible con validación (`1–2000` caracteres), contador, prevención de doble envío (`inFlightRef`) y conservación del motivo ante error o conflicto (`23505`). Cuando ya existe un reclamo sobre ese registro (propio o presentado por un compañero histórico en notas grupales), la fila reemplaza el botón por su badge de estado e impide crear otro.
- **Consulta, privacidad y cierre definitivo:** la sección *Reclamos* de cada curso filtra por estado (`Todos`, `Pendiente`, `En revisión`, `Respondido`), identifica autor (`Tú` o compañero histórico), tipo/alcance (*Visible para tu grupo histórico* vs. *Privado entre tú y el docente*), fechas `America/Lima`, motivo y **Respuesta final del docente** sin controles de réplica, edición ni reapertura, manteniendo las notas y puntos sin mutación automática y el estado `claimsError` aislado con botón «Reintentar».
- **Límites vigentes:** la revisión independiente en PR (`@fabrizio25504`, R4), la batería integral de `REC-07 #37` y la revisión transversal de `QA-01 #42` quedan pendientes; en la base local también se observó un fallo preexistente en `rec_01_claims_model.sql:145` al validar `DELETE`/`UPDATE` directo, mientras `rec_02`, `rec_03` y `rec_06` pasaron completos.

### Revisión de accesibilidad y claridad de recorridos integrados (`QA-01 #42`)

Se ejecutó la revisión de accesibilidad, teclado, contraste y claridad sobre los recorridos integrados en la rama `feature/QA-01-accesibilidad-recorridos-integrados` (sin migraciones nuevas, `0001`–`0054`), junto con las correcciones de los hallazgos `Q1`–`Q10` y la suite automatizada [`qa-01-integrated-accessibility.spec.ts`](../../portfolio-coursse/tests/e2e/qa-01-integrated-accessibility.spec.ts) + [`wcag-contrast.test.ts`](../../portfolio-coursse/tests/unit/wcag-contrast.test.ts):

- **Correcciones aplicadas:** contraste WCAG AA en tema claro y oscuro (`--on-accent` para subir botones `bg-accent` en `.dark` de `2.04:1` a `8.78:1`, `--muted` claro a `6.22:1`–`7.22:1` y sustitución de `text-red-400` por `text-danger`), migración de `EvaluationManagerDialog` a `<dialog>` nativo con focus trap, `Focus Not Obscured` (`scroll-margin-top: 6rem` y `jumpToClaim` al restablecer filtro), foco directo al detalle de `/teacher/claims` y preservación de `?period`/`?course`, `focus-visible:ring-2` homogéneo, skip links `min-h-10` y objetivos `>= 24×24 px` (como «Anular» en puntos), `aria-labelledby`/`aria-invalid`/`aria-describedby`/`role="alert"` y cierre `Escape` en diálogos/menú `⋯`, distinción explícita `0` (`Calificada · Nota base` / `0 (Calificada — nota grupal base)`) frente a `Pendiente`, diseño adaptable en `1280×800` y `375×812` (`SignOutButton compact`, filas responsivas de puntos), sincronización de `ThemeToggle` y ajuste de hidratación SSR/cliente en fechas `es-PE`.
- **Verificación en Chrome local (`16/16` pruebas para `Q-E01`–`Q-E18`, `38.6s`):** además de los recorridos estudiantiles y docentes de acceso, grupos, notas y puntos, quedaron verificados visualmente en navegador local con Docker/Supabase los recorridos en vivo de `/teacher/claims` (`REC-05 #35`) y la descarga `.xlsx` por curso (`EXP-03 #40`, con lectura binaria del archivo descargado) que habían quedado pendientes desde el PR #71.
- **Límites vigentes:** la revisión acredita ausencia de bloqueos de teclado, contraste computado `>= 4.5:1`, objetivos `>= 24×24 px` y responsividad en Chrome headless (`1280×800` y `375×812`) con identidades sintéticas `@example.test`, pero **no declara conformidad total WCAG 2.2 AA** (no sustituye evaluación manual con `NVDA`/`JAWS`/`VoiceOver`/`TalkBack`, dispositivos físicos, *Windows High Contrast*, zoom al `400 %` ni servicios externos productivos). Siguen pendientes la revisión independiente de `@fabrizio25504` en PR, `QA-02 #43`, `QA-04 #45`, `QA-05 #46`, `REC-07 #37` y `EXP-04 #41`, y en GitHub Actions CI (`ci.yml`) continúan sin ejecutarse `test`, `test:e2e` ni `test:db`.

## Datos de operación aún no confirmados

El responsable indicó que aún no dispone de monitoreo, alertas, respaldos o procedimientos de
recuperación adicionales documentados; tampoco hay evidencia de indicadores de ejecución.
No se verificó la configuración del proveedor ni el mecanismo que conecta el repositorio con
Vercel. Por eso no se atribuyen al sistema controles operativos o resultados de pruebas no
comprobados. La [hoja de ruta de controles](controles-operativos.md) indica cómo preparar,
verificar y documentar esas capacidades; las métricas y CI/CD propuestos figuran en
[indicadores y CI/CD](indicadores-y-ci-cd.md). La referencia anterior a una guía de entorno
Supabase aislado no tiene archivo disponible en este árbol; no se conserva como enlace válido.
Antes de pruebas destructivas debe confirmarse el aislamiento respecto de producción.

Para una automatización terminada, la [constitución](../../.specify/memory/constitution.md)
exige controles, evidencia, monitoreo y una evaluación versionada en
`docs/automatizaciones/<nombre-del-proceso>/evaluacion.md`. En ese registro se deben consignar
pruebas y resultados **ejecutados**, con datos sintéticos o anonimizados, y distinguirlos de lo
planeado. Los detalles del proyecto académico están en
[trabajo final](../05-entregables/trabajo-final.md).

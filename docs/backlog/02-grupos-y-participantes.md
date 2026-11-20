# Backlog 02 — Grupos y participantes de las actividades

> Convenciones e índices: [README](README.md). Fuentes: [caso](../01-definicion/caso-evaluacion-grupal.md), [diseño](../02-diseno/modelo-datos.md) y [hitos](../04-gestion/milestones.md). Son funciones de apoyo al registro y seguimiento; no un proyecto independiente.

### GRP-01 · Configurar número, capacidad y ventana de grupos

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#3-grupos-cupo-ventana-e-historia). Reutilizar capacidad y reapertura general existentes. El número de grupos es automático, no independiente; revisar reducción que elimina grupos con posibles notas y coordinación con selección concurrente.

**Rol:** R2 · **Revisor:** R1 · **Milestone:** M1 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** BASE-04

**GitHub:** [#18](https://github.com/NickSalA/portfolio-course/issues/18) · **Asignado:** @RobertoPizarro · **Revisión propuesta:** @NickSalA

- [ ] Verificar las funciones docentes existentes de grupos y selección.
- [ ] Permitir definir número, capacidad y ventana del curso con validaciones comprensibles.
- [ ] Incluir ampliación o reapertura para todo el curso, sin permisos individuales de selección.

**Aceptación:** docente responsable configura sus grupos y ventana; la reapertura habilita a todos los alumnos del curso y no afecta cursos ajenos.

**Documentación:** condiciones de configuración y prototipo del recorrido.

**Seguimiento local de implementación:** la migración `0047_configure_group_count_and_locks.sql` agrega el parámetro opcional `target_group_count integer default null` a `synchronize_course_groups` (conservando la firma retrocompatible y la protección `0039`), exige `courses.active = true` en grupos y ventana, y serializa el control de capacidad mediante `pg_advisory_xact_lock(group.id)` ordenados. En la interfaz docente (`/teacher/courses/[coursePublicId]`) y `group-actions.ts` se conservó la base existente y se corrigieron las brechas comprobadas: entrada independiente de número de grupos con sugerido `ceil(activos/capacidad)` y vista previa, visibilidad permanente de la tarjeta de ventana con badge de estado (`Sin configurar`, `Programada`, `Abierta`, `Cerrada`) y horario `America/Lima`, flujo explícito de ampliación y reapertura para todo el curso (sin `step="900"`), mensajes `role="alert"` y `role="status"` completos, y conteos filtrados por alumnos activos. Decisión propuesta para revisar en PR con R1 (`@NickSalA`): cuando `número × capacidad < autorizados activos`, mostrar advertencia clara sin bloquear el guardado.

**Evidencia y pendientes:** pasaron `pnpm lint`, `pnpm typecheck`, `pnpm test` (7 archivos / 26 pruebas, incluidas 6 de `group-config.test.ts`), `pnpm build`, las 10 suites SQL de `pnpm test:db` hasta `grp_02` (incluida la nueva `grp_01_group_configuration.sql`; `grp_06_activity_participants.sql` falla de forma preexistente en Windows por CRLF en `grp_06_concurrency.sh`) y los recorridos en navegador local (`1280×800`, móvil `375×812` y teclado). Detalle en [evaluacion.md](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md#grp-01-18--configuración-de-número-capacidad-y-ventana-de-grupos). Pendiente de revisión de R1 (`@NickSalA`) en PR y continuación en `GRP-03 #20` y `GRP-04 #21`. Este seguimiento se actualizó solo localmente, no en GitHub.

### GRP-02 · Conservar la historia de pertenencia a grupos

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#3-grupos-cupo-ventana-e-historia). El cambio sobrescribe group_id sin historia. Preservar grupos relevantes y notas frente a borrados en cascada; no reconstruir pertenencias previas desde el grupo actual.

**Rol:** R3 · **Revisor:** R4 · **Milestone:** M1 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** BASE-03, BASE-06

**GitHub:** [#19](https://github.com/NickSalA/portfolio-course/issues/19) · **Asignado:** @MathiMomos · **Revisión propuesta:** @fabrizio25504

- [ ] Definir cómo registrar pertenencias y su orden temporal, incluidos alumnos sin grupo.
- [ ] Incorporar cambios de datos aditivos sin inventar pertenencias anteriores desconocidas.
- [ ] Proteger la coherencia de curso y evitar historia solapada o eliminación de grupos necesarios para explicar resultados.
- [ ] Probar consulta de pertenencia antes y después de un cambio con datos sintéticos.

**Aceptación:** se puede identificar el grupo de un alumno para un instante académico conocido; la historia insuficiente se informa para revisión y no se reemplaza por el grupo actual.

**Documentación:** modelo y regla temporal, casos y decisiones de datos previos.

**Seguimiento local de GRP-02.** `0039` registra intervalos desde el corte de migración, distingue matrícula sin grupo de historia desconocida y preserva grupos con historial o notas. Se validaron la actualización desde `0038`, cambios simultáneos, rollback y permisos del docente. La resolución de participantes por actividad sigue en GRP-06 #23 y el acceso estudiantil histórico en EVA-04 #27. El cupo concurrente de preasignaciones sigue en GRP-03 #20. [Evidencia de GRP-02](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md#grp-02-19--historial-de-pertenencia-a-grupos).

### GRP-03 · Elegir y cambiar de grupo preservando historia y cupo

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#3-grupos-cupo-ventana-e-historia). Conservar validaciones de la RPC de selección; contrastar bypass docente directo, sincronización que restaura el grupo autorizado y concurrencia con cambios de capacidad.

**Rol:** R1 · **Revisor:** R3 · **Milestone:** M1 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** GRP-01, GRP-02

**GitHub:** [#20](https://github.com/NickSalA/portfolio-course/issues/20) · **Asignado:** @NickSalA · **Revisión propuesta:** @MathiMomos

- [ ] Verificar la operación existente y completar el mantenimiento de historia en todos los caminos de cambio.
- [ ] Comprobar ventana, matrícula propia, curso y cupo antes de confirmar.
- [ ] Probar concurrencia por el último cupo, repetición de selección y sincronización posterior de matrícula.

**Aceptación:** no se excede la capacidad ni se pierde la relación anterior; fuera de ventana no cambia el grupo. No se añade un traslado directo docente no acordado.

**Documentación:** reglas de selección, fallos y prueba de concurrencia.

### GRP-04 · Completar la selección de grupo del alumno

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#interfaces-y-recorrido-visible). Reutilizar GroupSelection; ejecutar elección/cambio, rechazo, recarga y reapertura. Revisar minimización de nombres/correos en la RPC; el payload entregado no queda protegido por ocultarlo en pantalla.

**Rol:** R2 · **Revisor:** R4 · **Milestone:** M1 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** GRP-03, BASE-07

**GitHub:** [#21](https://github.com/NickSalA/portfolio-course/issues/21) · **Asignado:** @RobertoPizarro · **Revisión propuesta:** @fabrizio25504

- [ ] Mostrar grupo vigente, opciones con cupo y condición de ventana.
- [ ] Permitir elección y cambio con estados de confirmación y errores accesibles.
- [ ] Verificar el recorrido tras la reapertura para todo el curso y después de actualizar la página.

**Aceptación:** el alumno reconoce su grupo confirmado; un rechazo no muestra un cambio ficticio y no se presentan grupos ajenos como elegibles.

**Documentación:** recorrido de selección y pruebas de interfaz.

### GRP-05 · Comprobar grupos y participación histórica en M1

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#comprobaciones-necesarias-para-aceptación-funcional). Incluir último cupo concurrente, reducción de capacidad, selección B con autorización A, grupo vacío con notas y trayectoria T1 en A/T2 en B. No asumir que los controles existentes ya pasaron estas pruebas.

**Rol:** R4 · **Revisor:** R1 · **Milestone:** M1 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** GRP-04, GRP-06

**GitHub:** [#22](https://github.com/NickSalA/portfolio-course/issues/22) · **Asignado:** @fabrizio25504 · **Revisión propuesta:** @NickSalA

- [ ] Ejecutar casos de ventana cerrada/abierta/reabierta y grupo lleno.
- [ ] Comprobar un alumno en A antes y B después de una actividad.
- [ ] Registrar esperado/observado, fallos y correcciones necesarias con sus autores.

**Aceptación:** demostración reproducible de selección y relación histórica; los fallos bloqueantes se devuelven al responsable, no se declaran resueltos por documentarlos.

**Documentación:** evidencia de M1 y pendientes para registro.

### GRP-06 · Definir actividades y resolver sus participantes

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#3-grupos-cupo-ventana-e-historia). No hay fecha de realización ni resolver de participantes históricos en el modelo revisado. Acordar orden temporal y reparación de pasado desconocido antes de atribuir resultados.

**Rol:** R1 · **Revisor:** R3 · **Milestone:** M1 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** GRP-02, BASE-04

**GitHub:** [#23](https://github.com/NickSalA/portfolio-course/issues/23) · **Asignado:** @NickSalA · **Revisión propuesta:** @MathiMomos

- [ ] Identificar actividad, curso y fecha de realización, sin gestionar recepción ni plazos de tareas.
- [ ] Acordar orden de eventos coincidentes y revisión de un cambio de fecha que afecte participantes.
- [ ] Resolver grupos y alumnos de cada actividad según su historia, no según la fecha de guardado.

**Aceptación:** actividades anteriores y posteriores a un cambio producen sus participantes correctos; cambiar fecha exige revisar el impacto y no altera silenciosamente atribuciones.

**Documentación:** regla de actividad y casos que utilizarán registro, reclamos y exportación.

**Seguimiento local:** `0044` incorpora un instante de realización opcional y resolución docente según intervalos históricos `[inicio, fin)`: ante coincidencia exacta se utiliza el estado nuevo. No inventa fechas para evaluaciones existentes ni pertenencia anterior al corte histórico; el resolver identifica historia desconocida y no garantiza que el padrón retenido esté completo. La interfaz identificada en `/teacher/grades` permite fijar el instante y consultar la resolución, pero la matriz y exportación existentes siguen mostrando integrantes actuales: su integración corresponde a EVA-01/EVA-03 y EXP-04; la consulta estudiantil histórica corresponde a EVA-04.

**Corrección de fecha:** `0045` añade revisión y confirmación auditada, sin permitir escritura directa ni eliminación de actividades fechadas. `review_activity_date_correction(curso, evaluación, instante, motivo)` exige docente responsable, instante finito no futuro y motivo; devuelve `review_id`, fechas y `impact` con cada matrícula/autorización retenida y estados y grupos anterior y propuesto. `unknown` no significa ausencia. `confirm_activity_date_correction(curso, evaluación, review_id)` exige el mismo docente y comprueba fecha, padrón e historia bajo bloqueos; rechaza revisión obsoleta (`40001`) o reutilizada y requiere `READ COMMITTED`. Una confirmación conserva actor, motivo, fechas, comparación y momento en tablas privadas. Ante conflicto hay que volver a revisar. No se cambian notas ni se certifica el padrón histórico completo. La interfaz permite revisar el impacto y confirmarlo por separado. La reparación de historia desconocida sigue pendiente de decisión en GRP-06 #23; matriz/exportación y consulta estudiantil siguen en EVA-01 #24, EVA-03 #26, EXP-04 #41 y EVA-04 #27. El usuario confirmó el recorrido visual de consulta y corrección con revisión de impacto. Una prueba automatizada con dos sesiones verificó el bloqueo de confirmaciones simultáneas, la obsolescencia tras cambios de padrón o historia y el bloqueo de escrituras concurrentes durante la confirmación. Los cambios de historia en la prueba son sintéticos y se ejecutan con privilegios de propietario; no acreditan todos los caminos de escritura ni RLS. La evidencia detallada está en `portfolio-coursse/supabase/qa/grp_06_concurrency_evidence.md`. La issue sigue abierta y el seguimiento se actualizó solo localmente.

**Evidencia:** se aplicaron `0044` y `0045` en la base local sin reiniciarla; `DOCKER_HOST=unix:///run/docker.sock pnpm test:db` pasó, incluida GRP-06 con revisión de impacto, permisos y rollback de fixtures sintéticos. También pasaron `pnpm typecheck`, `pnpm lint`, `pnpm test` (13 pruebas) y `git diff --check`. El usuario confirmó que funciona el recorrido visual docente de consulta y corrección; no se ha realizado una evaluación formal de usabilidad. Las dependencias GRP-02 #19 y BASE-04 #13 figuran cerradas en GitHub. La issue GRP-06 sigue abierta y no aceptada; seguimiento actualizado solo localmente.

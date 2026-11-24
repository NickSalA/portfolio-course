# Reclamos y aviso al docente

Referencias: [convenciones del backlog](README.md) · [milestones](../04-gestion/milestones.md) · [caso vigente](../01-definicion/caso-evaluacion-grupal.md) · [calendario](../04-gestion/calendario-y-contingencia.md) · [roles](../04-gestion/equipo-y-flujo-de-trabajo.md).

Antes de implementar, verificar capacidades existentes y conservar las que pasen los criterios; completar únicamente las brechas comprobadas. M3 es el cierre integrado, no el inicio de todo el trabajo: durante M1 preparar modelo, permisos, escenarios y configuración segura del correo; durante M2 adelantar contratos, interfaces y pruebas con datos sintéticos, respetando los bloqueos de integración. No se incorpora un control de publicación de resultados. Las dependencias se expresan mediante IDs del catálogo.

### REC-01 · Modelo, permisos y unicidad de reclamos

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#6-descargas-reclamos-y-correo). No se encontró modelo de reclamos implementado. Diseñar unicidad y permisos sobre participantes históricos/titular, sin atribución por grupo actual.

**Rol:** R3 · **Revisor:** R4 · **Milestone:** M3 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** EVA-04

**GitHub:** [#31](https://github.com/NickSalA/portfolio-course/issues/31) · **Asignado:** @MathiMomos · **Revisión propuesta:** @fabrizio25504

- [ ] Verificar el modelo y los permisos existentes frente a ambos tipos de reclamo y registrar brechas.
- [ ] Relacionar el reclamo grupal con grupo y evaluación históricos, y el individual con el movimiento de puntos; conservar quién lo presentó.
- [ ] Restringir el acceso grupal a participantes históricos y docente responsable, y el individual al titular y docente responsable.
- [ ] Garantizar unicidad durante toda la vida del registro, incluso con concurrencia y después de la respuesta final.

**Aceptación:** dos participantes históricos no pueden crear reclamos distintos sobre el mismo grupo y evaluación; un movimiento admite un único reclamo. Cambiar de grupo no altera los permisos históricos. Actores ajenos no pueden leer ni modificar el recurso; responder no libera la unicidad.

**Documentación:** actualizar [modelo de datos](../02-diseno/modelo-datos.md) con relaciones, restricciones y permisos; registrar comprobaciones en [evidencia](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md).

**Seguimiento local de REC-01:** la migración [`0050_claims_model_and_rls.sql`](../../portfolio-coursse/supabase/migrations/0050_claims_model_and_rls.sql) define la tabla `public.claims`, claves foráneas compuestas por curso/titular, índices únicos parciales permanentes (`(group_id, evaluation_id)` para `group_grade` y `(point_transaction_id)` para `point_transaction`), funciones de participación histórica (`academic_access.is_historical_group_participant`, `can_read_historical_group_claim`), políticas RLS de lectura/alta y trigger `guard_claim_mutation` que bloquea borrados, inmutabilidad de identidad y reapertura tras `responded`.
- **Pendiente de ejecución:** aplicar `0050` y ejecutar [`rec_01_claims_model.sql`](../../portfolio-coursse/supabase/qa/rec_01_claims_model.sql) en Supabase local (Docker Desktop no estuvo disponible en este entorno) y revisión independiente; seguimiento actualizado solo localmente, no en GitHub. Desbloquea `REC-02 #32`.

### REC-02 · Presentación de ambos tipos de reclamo

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#6-descargas-reclamos-y-correo). No se encontró operación de presentación. Conservar identidad del autor y registro académico original; comprobar concurrencia e idempotencia sin supeditar persistencia al correo.

**Rol:** R5 · **Revisor:** R3 · **Milestone:** M3 · **Prioridad:** Alta · **Estado:** In review · **Bloqueado por:** REC-01

**GitHub:** [#32](https://github.com/NickSalA/portfolio-course/issues/32) · **Asignado:** @Forex549 · **Revisión propuesta:** @MathiMomos

- [x] Verificar y reutilizar las operaciones de presentación que cumplan el caso vigente.
- [x] Permitir presentar el reclamo grupal a cualquier participante de aquella actividad, en nombre del grupo.
- [x] Permitir al titular presentar el reclamo sobre su movimiento de puntos, conservando autor y motivo.
- [x] Crear en estado Pendiente y tratar envíos repetidos o simultáneos sin duplicados, con errores comprensibles.

**Aceptación:** cada tipo crea un único reclamo Pendiente sobre un registro autorizado; el reclamo grupal queda disponible para los participantes históricos y el individual solo para su titular y docente. Repetir el envío no crea otra solicitud ni altera notas o puntos.

**Documentación:** actualizar [estado actual](../03-calidad-y-operacion/estado-actual.md) con las operaciones verificadas y [evidencia](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md) con casos de presentación y repetición.

**Seguimiento local de REC-02 (no sincronizado con GitHub):**
- **Implementación:** migración [`0052_submit_claims_rpc.sql`](../../portfolio-coursse/supabase/migrations/0052_submit_claims_rpc.sql) (`public.submit_group_grade_claim`, `public.submit_point_transaction_claim` y `public.list_student_claims`), validaciones y mapeo de errores en [`lib/claims/validation.ts`](../../portfolio-coursse/lib/claims/validation.ts), servicio [`lib/claims/submit-claim.ts`](../../portfolio-coursse/lib/claims/submit-claim.ts) y Server Actions en [`app/student/claims/actions.ts`](../../portfolio-coursse/app/student/claims/actions.ts). La identidad del autor, curso y matrícula se resuelven exclusivamente en PostgreSQL/servidor desde `auth.uid()`; reintentos equivalentes del mismo autor en estado `pending` convergen de forma idempotente (`created: false`) sin duplicar ni alterar notas/puntos; envíos de terceros o motivos distintos sobre el mismo registro devuelven conflicto (`23505`). La persistencia no depende del aviso por correo (`REC-06 #36`).
- **Pruebas ejecutadas:** `pnpm test` (`7/7` en [`claims-submission.test.ts`](../../portfolio-coursse/tests/unit/claims-submission.test.ts), `62/62` en 11 archivos), `pnpm lint`, `pnpm typecheck` y `pnpm build` (con variables placeholder de CI).
- **Pendientes para cierre y aceptación:** aplicar `0050` y `0052` y ejecutar [`rec_01_claims_model.sql`](../../portfolio-coursse/supabase/qa/rec_01_claims_model.sql) y [`rec_02_claim_submission.sql`](../../portfolio-coursse/supabase/qa/rec_02_claim_submission.sql) en Supabase local (Docker no estuvo disponible en este entorno), integración en la interfaz estudiantil (`REC-04 #34`), conexión del aviso docente (`REC-06 #36`), QA integral (`REC-07 #37`) y revisión independiente de R3 (`@MathiMomos`) en PR. Este seguimiento se actualizó solo localmente, no en GitHub.

### REC-03 · Transiciones y respuesta final docente

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#6-descargas-reclamos-y-correo). No se encontró implementación de estados/respuesta. La respuesta final debe permanecer separada de las correcciones de notas/puntos, cuya trazabilidad también requiere trabajo.

**Rol:** R5 · **Revisor:** R4 · **Milestone:** M3 · **Prioridad:** Alta · **Estado:** In review · **Bloqueado por:** REC-02

**GitHub:** [#33](https://github.com/NickSalA/portfolio-course/issues/33) · **Asignado:** @Forex549 · **Revisión propuesta:** @fabrizio25504

- [x] Verificar e implementar el recorrido Pendiente → En revisión → Respondido.
- [x] Autorizar únicamente al docente responsable a revisar y emitir una respuesta motivada.
- [x] Impedir réplica, reapertura y nueva solicitud sobre el mismo registro tras responder.
- [x] Mantener la respuesta separada de cualquier corrección académica expresa del docente.

**Aceptación:** solo el docente autorizado completa las transiciones en orden y responde con fundamento. Respondido es final; acciones posteriores o repetidas no reabren ni duplican el caso. Responder no cambia por sí mismo la nota ni los puntos.

**Documentación:** actualizar [modelo de datos](../02-diseno/modelo-datos.md) con estados y restricciones; registrar transiciones válidas e inválidas en [evidencia](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md).

**Seguimiento local de REC-03 (no sincronizado con GitHub):**
- **Implementación:** migración [`0053_claim_teacher_transitions.sql`](../../portfolio-coursse/supabase/migrations/0053_claim_teacher_transitions.sql) (`public.start_claim_review`, `public.respond_to_claim` y `public.list_teacher_claims`), validaciones en [`lib/claims/validation.ts`](../../portfolio-coursse/lib/claims/validation.ts), servicio [`lib/claims/teacher-claims.ts`](../../portfolio-coursse/lib/claims/teacher-claims.ts) y Server Actions en [`app/teacher/claims/actions.ts`](../../portfolio-coursse/app/teacher/claims/actions.ts). Las mutaciones quedan centralizadas en RPCs (`authenticated` sigue sin `UPDATE`/`DELETE` directo en `public.claims`), exigen `is_teacher_of_course`, bloquean la fila `FOR UPDATE`, imponen orden estricto `pending → in_review → responded` (con `start_claim_review` idempotente si ya está `in_review`), impiden reapertura tras `responded` (`claim_response_is_final`) y nunca alteran `group_grades` ni `point_transactions`.
- **Pruebas ejecutadas:** `pnpm test` (`6/6` en [`claims-transitions.test.ts`](../../portfolio-coursse/tests/unit/claims-transitions.test.ts), `68/68` en 12 archivos), `pnpm lint`, `pnpm typecheck` y `pnpm build` (con variables placeholder de CI).
- **Pendientes para cierre y aceptación:** aplicar `0050`/`0052`/`0053` y ejecutar [`rec_03_claim_transitions.sql`](../../portfolio-coursse/supabase/qa/rec_03_claim_transitions.sql) en Supabase local (Docker no estuvo disponible en este entorno), bandeja e interfaz docente (`REC-05 #35`), QA integral (`REC-07 #37`) y revisión independiente de R4 (`@fabrizio25504`) en PR. Este seguimiento se actualizó solo localmente, no en GitHub.

### REC-04 · Interfaz estudiantil para presentar y consultar

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#interfaces-y-recorrido-visible). No se identificó interfaz estudiantil de reclamos. Integrarla con resultado histórico/movimiento propio y registrar navegación, funcionamiento y usabilidad por separado.

**Rol:** R2 · **Revisor:** R4 · **Milestone:** M3 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** REC-02, REC-03

**GitHub:** [#34](https://github.com/NickSalA/portfolio-course/issues/34) · **Asignado:** @RobertoPizarro · **Revisión propuesta:** @fabrizio25504

- [ ] Verificar y conservar las interfaces existentes que cumplan ambos recorridos.
- [ ] Integrar presentación desde la nota histórica o el movimiento propio con identificación clara del registro.
- [ ] Mostrar autor, motivo, estado y respuesta final según los permisos de cada tipo.
- [ ] Resolver carga, vacío, error y confirmación, con etiquetas y navegación por teclado y sin acciones de réplica o reapertura.

**Aceptación:** un alumno presenta y consulta ambos tipos autorizados; los demás participantes históricos consultan el grupal sin crear otro. La interfaz distingue estados, muestra la respuesta final y no expone reclamos ajenos ni ofrece acciones incompatibles con el cierre.

**Documentación:** actualizar [estado actual](../03-calidad-y-operacion/estado-actual.md) con el recorrido estudiantil y [evidencia](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md) con pruebas de interacción y privacidad.

### REC-05 · Bandeja y detalle docente

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#interfaces-y-recorrido-visible). No se identificó bandeja/detalle docente de reclamos. Verificar descubrimiento desde navegación, contexto del registro, respuesta final y operación académica separada.

**Rol:** R5 · **Revisor:** R2 · **Milestone:** M3 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** REC-03

**GitHub:** [#35](https://github.com/NickSalA/portfolio-course/issues/35) · **Asignado:** @Forex549 · **Revisión propuesta:** @RobertoPizarro

- [ ] Verificar la bandeja y el detalle existentes antes de completar sus brechas.
- [ ] Mostrar los reclamos de los cursos autorizados, diferenciando tipo y estado.
- [ ] Presentar registro histórico, autor, motivo y respuesta, e integrar revisión y respuesta motivada.
- [ ] Mostrar confirmaciones y errores sin duplicar acciones; identificar la corrección académica como una operación separada.

**Aceptación:** el docente localiza un reclamo de cada tipo, consulta su contexto y completa la atención sin acceder a cursos ajenos. Un caso Respondido muestra la decisión final sin controles de reapertura; responder no modifica el registro académico.

**Documentación:** actualizar [estado actual](../03-calidad-y-operacion/estado-actual.md) con el recorrido docente y [evidencia](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md) con sus comprobaciones.

### REC-06 · Correo docente y recuperación de fallos

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#6-descargas-reclamos-y-correo). No se encontró aviso académico implementado. Reutilizar preparación de BASE-08; conservar reclamo ante fallo y distinguir envío técnico de entrega/lectura.

**Rol:** R5 · **Revisor:** R1 · **Milestone:** M3 · **Prioridad:** Alta · **Estado:** In review · **Bloqueado por:** REC-02, BASE-08

**GitHub:** [#36](https://github.com/NickSalA/portfolio-course/issues/36) · **Asignado:** @Forex549 · **Revisión propuesta:** @NickSalA

- [x] Verificar el mecanismo disponible y preparar su configuración segura desde M1–M2, sin imponer una biblioteca nueva ni documentar secretos.
- [x] Generar por nuevo reclamo un aviso breve al docente responsable con enlace que requiera autorización, sin notas, puntos ni texto de la solicitud.
- [x] Conservar el reclamo aunque falle el aviso y registrar el resultado técnico sin contenido sensible.
- [x] Definir e implementar recuperación, reintentos y visibilidad del fallo para el actor autorizado, evitando avisos duplicados ante repetición de la solicitud.

**Aceptación:** cada nuevo reclamo activa el aviso al destinatario correcto; una creación repetida no dispara otro aviso lógico. Un fallo no pierde ni bloquea la atención del reclamo y puede recuperarse según la política documentada. El estado técnico no afirma entrega ni lectura sin evidencia; no se añaden correos al alumno, recordatorios ni escalamiento.

**Documentación:** actualizar [controles operativos](../03-calidad-y-operacion/controles-operativos.md) con configuración sin secretos y recuperación; registrar éxito, fallo y reintento en [evidencia](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md).

**Seguimiento local de REC-06 (no sincronizado con GitHub):**
- **Implementación:** migración [`0054_claim_email_notifications.sql`](../../portfolio-coursse/supabase/migrations/0054_claim_email_notifications.sql) (`public.claim_notifications` 1:1 por reclamo, trigger `tr_create_claim_notification`, RLS solo docente y RPCs `prepare_claim_email_dispatch`, `record_claim_email_outcome`, `list_teacher_claim_notifications`); despacho seguro en [`lib/mail/claim-notice.ts`](../../portfolio-coursse/lib/mail/claim-notice.ts) reutilizando `BASE-08` (`readMailConfig` y `buildTeacherNoticeEmail` con enlace `/teacher/claims?claim=<public_id>` sin datos académicos ni secretos); conexión no bloqueante en [`app/student/claims/actions.ts`](../../portfolio-coursse/app/student/claims/actions.ts) solo cuando `created === true`; y acción docente de recuperación `retryClaimNoticeAction` en [`app/teacher/claims/actions.ts`](../../portfolio-coursse/app/teacher/claims/actions.ts).
- **Pruebas ejecutadas:** `pnpm test` (`5/5` en [`claim-notice.test.ts`](../../portfolio-coursse/tests/unit/claim-notice.test.ts), `73/73` en 13 archivos), `pnpm lint`, `pnpm typecheck` y `pnpm build` (con variables placeholder de CI).
- **Pendientes para cierre y aceptación:** aplicar `0054` y ejecutar [`rec_06_claim_notifications.sql`](../../portfolio-coursse/supabase/qa/rec_06_claim_notifications.sql) en Supabase local (Docker no estuvo disponible), exponer el indicador y botón de reintento en la bandeja docente (`REC-05 #35`), prueba integrada en `REC-07 #37` y revisión independiente de R1 (`@NickSalA`) en PR. Este seguimiento se actualizó solo localmente, no en GitHub.

### REC-07 · QA de reclamos y correo

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#comprobaciones-necesarias-para-aceptación-funcional). Preparar participantes anteriores/nuevos, actores ajenos y repetición concurrente; comprobar interfaces y correo sin inferir aceptación de presencia de código o configuración Auth.

**Rol:** R4 · **Revisor:** R3 · **Milestone:** M3 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** REC-04, REC-05, REC-06

**GitHub:** [#37](https://github.com/NickSalA/portfolio-course/issues/37) · **Asignado:** @fabrizio25504 · **Revisión propuesta:** @MathiMomos

- [ ] Preparar desde M1–M2 escenarios sintéticos de ambos tipos, participantes históricos y actores ajenos.
- [ ] Ejecutar presentación, consulta, revisión y respuesta final en ambas interfaces.
- [ ] Probar concurrencia, envíos repetidos, unicidad tras responder y rechazo de réplica o reapertura.
- [ ] Comprobar destinatario y contenido del aviso, fallo y recuperación, y permanencia del reclamo sin cambios académicos automáticos.

**Aceptación:** los recorridos de ambos tipos tienen resultado esperado y observado reproducible; se comprueban privacidad histórica, unicidad permanente y decisión final. El fallo del correo no pierde el caso y la evidencia distingue envío de entrega o lectura. Los defectos y pruebas no ejecutadas quedan explícitos, sin declarar cierre mientras falle un criterio esencial.

**Documentación:** actualizar [evidencia](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md) con escenarios, resultados y limitaciones, y [estado actual](../03-calidad-y-operacion/estado-actual.md) con el alcance efectivamente verificado.

# Reclamos y aviso al docente

Referencias: [convenciones del backlog](README.md) · [milestones](../04-gestion/milestones.md) · [caso vigente](../01-definicion/caso-evaluacion-grupal.md) · [calendario](../04-gestion/calendario-y-contingencia.md) · [roles](../04-gestion/equipo-y-flujo-de-trabajo.md).

Antes de implementar, verificar capacidades existentes y conservar las que pasen los criterios; completar únicamente las brechas comprobadas. M3 es el cierre integrado, no el inicio de todo el trabajo: durante M1 preparar modelo, permisos, escenarios y configuración segura del correo; durante M2 adelantar contratos, interfaces y pruebas con datos sintéticos, respetando los bloqueos de integración. No se incorpora un control de publicación de resultados. Las dependencias se expresan mediante IDs del catálogo.

### REC-01 · Modelo, permisos y unicidad de reclamos

**Rol:** R3 · **Revisor:** R4 · **Milestone:** M3 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** EVA-04

**GitHub:** [#31](https://github.com/NickSalA/portfolio-course/issues/31) · **Asignado:** @MathiMomos · **Revisión propuesta:** @fabrizio25504

- [ ] Verificar el modelo y los permisos existentes frente a ambos tipos de reclamo y registrar brechas.
- [ ] Relacionar el reclamo grupal con grupo y evaluación históricos, y el individual con el movimiento de puntos; conservar quién lo presentó.
- [ ] Restringir el acceso grupal a participantes históricos y docente responsable, y el individual al titular y docente responsable.
- [ ] Garantizar unicidad durante toda la vida del registro, incluso con concurrencia y después de la respuesta final.

**Aceptación:** dos participantes históricos no pueden crear reclamos distintos sobre el mismo grupo y evaluación; un movimiento admite un único reclamo. Cambiar de grupo no altera los permisos históricos. Actores ajenos no pueden leer ni modificar el recurso; responder no libera la unicidad.

**Documentación:** actualizar [modelo de datos](../02-diseno/modelo-datos.md) con relaciones, restricciones y permisos; registrar comprobaciones en [evidencia](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md).

### REC-02 · Presentación de ambos tipos de reclamo

**Rol:** R5 · **Revisor:** R3 · **Milestone:** M3 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** REC-01

**GitHub:** [#32](https://github.com/NickSalA/portfolio-course/issues/32) · **Asignado:** @Forex549 · **Revisión propuesta:** @MathiMomos

- [ ] Verificar y reutilizar las operaciones de presentación que cumplan el caso vigente.
- [ ] Permitir presentar el reclamo grupal a cualquier participante de aquella actividad, en nombre del grupo.
- [ ] Permitir al titular presentar el reclamo sobre su movimiento de puntos, conservando autor y motivo.
- [ ] Crear en estado Pendiente y tratar envíos repetidos o simultáneos sin duplicados, con errores comprensibles.

**Aceptación:** cada tipo crea un único reclamo Pendiente sobre un registro autorizado; el reclamo grupal queda disponible para los participantes históricos y el individual solo para su titular y docente. Repetir el envío no crea otra solicitud ni altera notas o puntos.

**Documentación:** actualizar [estado actual](../03-calidad-y-operacion/estado-actual.md) con las operaciones verificadas y [evidencia](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md) con casos de presentación y repetición.

### REC-03 · Transiciones y respuesta final docente

**Rol:** R5 · **Revisor:** R4 · **Milestone:** M3 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** REC-02

**GitHub:** [#33](https://github.com/NickSalA/portfolio-course/issues/33) · **Asignado:** @Forex549 · **Revisión propuesta:** @fabrizio25504

- [ ] Verificar e implementar el recorrido Pendiente → En revisión → Respondido.
- [ ] Autorizar únicamente al docente responsable a revisar y emitir una respuesta motivada.
- [ ] Impedir réplica, reapertura y nueva solicitud sobre el mismo registro tras responder.
- [ ] Mantener la respuesta separada de cualquier corrección académica expresa del docente.

**Aceptación:** solo el docente autorizado completa las transiciones en orden y responde con fundamento. Respondido es final; acciones posteriores o repetidas no reabren ni duplican el caso. Responder no cambia por sí mismo la nota ni los puntos.

**Documentación:** actualizar [modelo de datos](../02-diseno/modelo-datos.md) con estados y restricciones; registrar transiciones válidas e inválidas en [evidencia](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md).

### REC-04 · Interfaz estudiantil para presentar y consultar

**Rol:** R2 · **Revisor:** R4 · **Milestone:** M3 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** REC-02, REC-03

**GitHub:** [#34](https://github.com/NickSalA/portfolio-course/issues/34) · **Asignado:** @RobertoPizarro · **Revisión propuesta:** @fabrizio25504

- [ ] Verificar y conservar las interfaces existentes que cumplan ambos recorridos.
- [ ] Integrar presentación desde la nota histórica o el movimiento propio con identificación clara del registro.
- [ ] Mostrar autor, motivo, estado y respuesta final según los permisos de cada tipo.
- [ ] Resolver carga, vacío, error y confirmación, con etiquetas y navegación por teclado y sin acciones de réplica o reapertura.

**Aceptación:** un alumno presenta y consulta ambos tipos autorizados; los demás participantes históricos consultan el grupal sin crear otro. La interfaz distingue estados, muestra la respuesta final y no expone reclamos ajenos ni ofrece acciones incompatibles con el cierre.

**Documentación:** actualizar [estado actual](../03-calidad-y-operacion/estado-actual.md) con el recorrido estudiantil y [evidencia](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md) con pruebas de interacción y privacidad.

### REC-05 · Bandeja y detalle docente

**Rol:** R5 · **Revisor:** R2 · **Milestone:** M3 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** REC-03

**GitHub:** [#35](https://github.com/NickSalA/portfolio-course/issues/35) · **Asignado:** @Forex549 · **Revisión propuesta:** @RobertoPizarro

- [ ] Verificar la bandeja y el detalle existentes antes de completar sus brechas.
- [ ] Mostrar los reclamos de los cursos autorizados, diferenciando tipo y estado.
- [ ] Presentar registro histórico, autor, motivo y respuesta, e integrar revisión y respuesta motivada.
- [ ] Mostrar confirmaciones y errores sin duplicar acciones; identificar la corrección académica como una operación separada.

**Aceptación:** el docente localiza un reclamo de cada tipo, consulta su contexto y completa la atención sin acceder a cursos ajenos. Un caso Respondido muestra la decisión final sin controles de reapertura; responder no modifica el registro académico.

**Documentación:** actualizar [estado actual](../03-calidad-y-operacion/estado-actual.md) con el recorrido docente y [evidencia](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md) con sus comprobaciones.

### REC-06 · Correo docente y recuperación de fallos

**Rol:** R5 · **Revisor:** R1 · **Milestone:** M3 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** REC-02, BASE-08

**GitHub:** [#36](https://github.com/NickSalA/portfolio-course/issues/36) · **Asignado:** @Forex549 · **Revisión propuesta:** @NickSalA

- [ ] Verificar el mecanismo disponible y preparar su configuración segura desde M1–M2, sin imponer una biblioteca nueva ni documentar secretos.
- [ ] Generar por nuevo reclamo un aviso breve al docente responsable con enlace que requiera autorización, sin notas, puntos ni texto de la solicitud.
- [ ] Conservar el reclamo aunque falle el aviso y registrar el resultado técnico sin contenido sensible.
- [ ] Definir e implementar recuperación, reintentos y visibilidad del fallo para el actor autorizado, evitando avisos duplicados ante repetición de la solicitud.

**Aceptación:** cada nuevo reclamo activa el aviso al destinatario correcto; una creación repetida no dispara otro aviso lógico. Un fallo no pierde ni bloquea la atención del reclamo y puede recuperarse según la política documentada. El estado técnico no afirma entrega ni lectura sin evidencia; no se añaden correos al alumno, recordatorios ni escalamiento.

**Documentación:** actualizar [controles operativos](../03-calidad-y-operacion/controles-operativos.md) con configuración sin secretos y recuperación; registrar éxito, fallo y reintento en [evidencia](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md).

### REC-07 · QA de reclamos y correo

**Rol:** R4 · **Revisor:** R3 · **Milestone:** M3 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** REC-04, REC-05, REC-06

**GitHub:** [#37](https://github.com/NickSalA/portfolio-course/issues/37) · **Asignado:** @fabrizio25504 · **Revisión propuesta:** @MathiMomos

- [ ] Preparar desde M1–M2 escenarios sintéticos de ambos tipos, participantes históricos y actores ajenos.
- [ ] Ejecutar presentación, consulta, revisión y respuesta final en ambas interfaces.
- [ ] Probar concurrencia, envíos repetidos, unicidad tras responder y rechazo de réplica o reapertura.
- [ ] Comprobar destinatario y contenido del aviso, fallo y recuperación, y permanencia del reclamo sin cambios académicos automáticos.

**Aceptación:** los recorridos de ambos tipos tienen resultado esperado y observado reproducible; se comprueban privacidad histórica, unicidad permanente y decisión final. El fallo del correo no pierde el caso y la evidencia distingue envío de entrega o lectura. Los defectos y pruebas no ejecutadas quedan explícitos, sin declarar cierre mientras falle un criterio esencial.

**Documentación:** actualizar [evidencia](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md) con escenarios, resultados y limitaciones, y [estado actual](../03-calidad-y-operacion/estado-actual.md) con el alcance efectivamente verificado.

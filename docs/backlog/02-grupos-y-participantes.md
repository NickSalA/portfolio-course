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

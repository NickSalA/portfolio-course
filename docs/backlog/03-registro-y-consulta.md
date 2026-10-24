# Backlog 03 — Registro y consulta de resultados

> Convenciones e índices: [README](README.md). Alcance: [caso](../01-definicion/caso-evaluacion-grupal.md). Hito principal: [M2](../04-gestion/milestones.md). Se preserva el código que supere la verificación; no se considera suficiente el guardado o la pantalla sin probar sus permisos y destinatarios.

### EVA-01 · Registrar y corregir una nota por grupo y evaluación

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#4-registro-corrección-y-consulta-de-notas). Conservar rango 0–20, unicidad y RLS de mismo curso; el upsert actual sobrescribe nota/feedback sin versiones ni autor/motivo de corrección. Mantener participantes originales y revisar borrados destructivos.

**Rol:** R3 · **Revisor:** R4 · **Milestone:** M2 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** GRP-06, BASE-03

**GitHub:** [#24](https://github.com/NickSalA/portfolio-course/issues/24) · **Asignado:** @MathiMomos · **Revisión propuesta:** @fabrizio25504

- [ ] Verificar nota única por grupo/evaluación y coincidencia de curso y docente.
- [ ] Admitir 0–20 y distinguir nota pendiente de cero explícito.
- [ ] Conservar valor anterior/nuevo, responsable y momento de las correcciones confirmadas.
- [ ] Mantener destinatarios históricos de la actividad cuando cambie la nota.

**Aceptación:** la nota grupal se registra una vez y corresponde a los participantes; valor inválido, curso ajeno o corrección no autorizada no deja un cambio aceptado.

**Documentación:** reglas de registro/corrección y evidencia de límites y permisos.

### EVA-02 · Verificar puntos individuales y corrección no destructiva

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#5-puntos-y-correcciones). Conservar saldo derivado y anulación autorizada; completar trazabilidad de anulación/reemplazo y comprobar titularidad/contexto. Los anulados se ocultan de los historiales revisados.

**Rol:** R1 · **Revisor:** R3 · **Milestone:** M2 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** BASE-06

**GitHub:** [#25](https://github.com/NickSalA/portfolio-course/issues/25) · **Asignado:** @NickSalA · **Revisión propuesta:** @MathiMomos

- [ ] Revisar asignación de puntos, destinatario y consulta del historial existentes.
- [ ] Mantener saldo derivado y corrección por anulación o ajuste que preserve el original.
- [ ] Probar que registrar puntos no modifica notas grupales ni resultados de otros alumnos.

**Aceptación:** el docente gestiona movimientos de sus alumnos y corrige sin borrado de historia; exportar no se introduce como una operación que descuente saldo.

**Documentación:** movimientos incluidos/excluidos del saldo y pruebas; decisiones pendientes de cálculo se cierran en EXP-01.

### EVA-03 · Completar la matriz docente de notas y pendientes

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#interfaces-y-recorrido-visible). Existe /teacher/grades con entrada «Notas» y tabla de consulta/edición; no hay evidencia visual ni vista independiente de solo consulta identificada. Reutilizarla y comprobar guardado por pérdida de foco, confirmación, fallo, pendientes/cero y participantes históricos.

**Rol:** R2 · **Revisor:** R4 · **Milestone:** M2 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** EVA-01, BASE-07

**GitHub:** [#26](https://github.com/NickSalA/portfolio-course/issues/26) · **Asignado:** @RobertoPizarro · **Revisión propuesta:** @fabrizio25504

- [ ] Presentar curso, actividad y grupos/participantes correspondientes.
- [ ] Mostrar nota guardada, corrección y pendiente sin confundir vacío con cero.
- [ ] Informar progreso, confirmación y error; evitar doble envío accidental y conservar entradas ante un fallo.

**Aceptación:** el docente registra una calificación por grupo sin buscar a cada alumno; la interfaz no anuncia éxito antes de confirmar ni exige publicar después.

**Documentación:** prototipo y recorrido docente actualizados.

### EVA-04 · Autorizar consultas por participación histórica y titularidad

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#4-registro-corrección-y-consulta-de-notas). 0029 bloquea lectura estudiantil; no restaurar la política de 0028 basada en grupo actual. Diseñar acceso histórico y titularidad de puntos con pruebas directas.

**Rol:** R3 · **Revisor:** R4 · **Milestone:** M2 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** EVA-01, EVA-02, GRP-02

**GitHub:** [#27](https://github.com/NickSalA/portfolio-course/issues/27) · **Asignado:** @MathiMomos · **Revisión propuesta:** @fabrizio25504

- [ ] Diseñar el permiso de consulta estudiantil según participantes de la actividad y puntos propios.
- [ ] Sustituir la denegación antigua mediante cambios nuevos y comprobados; no restaurar una lectura basada solo en grupo actual.
- [ ] Probar alumno trasladado, nuevo integrante, curso ajeno, docente ajeno y sesión ausente por acceso directo.

**Aceptación:** cada resultado confirmado se puede consultar inmediatamente por sus destinatarios, sin exponer datos ajenos. La evidencia antigua de denegación se conserva como histórica, no como aceptación nueva.

**Documentación:** permisos vigentes, diseño y matriz esperado/observado.

### EVA-05 · Mostrar notas y puntos propios en el panel del alumno

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#interfaces-y-recorrido-visible). El panel existente muestra puntos, no notas. Integrar consulta histórica sin reconstruir el panel completo; verificar actividad/grupo original, pendientes/cero y estados visibles.

**Rol:** R2 · **Revisor:** R4 · **Milestone:** M2 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** EVA-04, BASE-07

**GitHub:** [#28](https://github.com/NickSalA/portfolio-course/issues/28) · **Asignado:** @RobertoPizarro · **Revisión propuesta:** @fabrizio25504

- [ ] Mostrar actividad, nota grupal base y relación con el grupo de la actividad.
- [ ] Mantener consulta de puntos y movimientos propios, separada de calificaciones.
- [ ] Distinguir pendientes y ceros; no agregar un botón de publicación ni una nota final individual no acordada en pantalla.

**Aceptación:** tras el registro, el alumno consulta sus resultados y conserva los de actividades anteriores después de un cambio de grupo.

**Documentación:** recorrido estudiantil y pruebas de carga, vacío y error.

### EVA-06 · Comprobar registro y consulta de extremo a extremo

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#comprobaciones-necesarias-para-aceptación-funcional). Ejecutar registro/corrección, límites, consulta por participante histórico y acceso ajeno. Separar pruebas de interfaz, persistencia y políticas directas; el inventario no certifica el recorrido M2.

**Rol:** R4 · **Revisor:** R1 · **Milestone:** M2 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** EVA-03, EVA-05, EVA-07

**GitHub:** [#29](https://github.com/NickSalA/portfolio-course/issues/29) · **Asignado:** @fabrizio25504 · **Revisión propuesta:** @NickSalA

- [ ] Ejecutar registro/corrección docente y consulta del alumno con límites 0/20 y pendiente.
- [ ] Probar alumnos de actividades anteriores, nuevo grupo y acceso ajeno.
- [ ] Contrastar puntos visibles con sus movimientos sin alterar notas.

**Aceptación:** recorrido M2 demostrado con datos sintéticos; defectos reproducibles asignados al autor del módulo y evidencias de su corrección antes del cierre.

**Documentación:** pruebas y resultados de M2.

### EVA-07 · Integrar recuperación de guardados sin duplicación

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#5-puntos-y-correcciones). El registro de puntos trata cualquier 23505 como éxito sin verificar equivalencia. Probar UUID con contenido igual/distinto; revisar también confirmación incierta y sobrescrituras concurrentes de notas.

**Rol:** R1 · **Revisor:** R3 · **Milestone:** M2 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** EVA-01, EVA-02, GRP-03

**GitHub:** [#30](https://github.com/NickSalA/portfolio-course/issues/30) · **Asignado:** @NickSalA · **Revisión propuesta:** @MathiMomos

- [ ] Comprobar fallos antes/después de confirmar y repetición de acciones de grupos, notas y puntos.
- [ ] Permitir verificar el resultado sin duplicar registros o correcciones.
- [ ] Comunicar rechazo, fallo o confirmación incierta con una acción siguiente comprensible.

**Aceptación:** un reintento equivalente converge al mismo resultado académico; una corrección nueva no se confunde con un reintento y los fallos no se presentan como éxito.

**Documentación:** comportamiento de recuperación, pasos y resultados de prueba.

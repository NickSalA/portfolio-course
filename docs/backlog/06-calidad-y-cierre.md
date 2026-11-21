# Backlog 06 — Calidad integrada y cierre del desarrollo

> Convenciones e índices: [README](README.md). Fuentes: [indicadores](../03-calidad-y-operacion/indicadores-y-ci-cd.md), [controles](../03-calidad-y-operacion/controles-operativos.md) y [M4](../04-gestion/milestones.md). Las pruebas de cada función ya forman parte de su issue; estas tareas integran recorridos, evaluación y cierre, no posponen toda la calidad a la última semana.

### QA-01 · Revisar accesibilidad y claridad de los recorridos integrados

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#interfaces-y-recorrido-visible). No se ejecutó recorrido visual en BASE-01. Comprobar navegación real, teclado/foco, estados, contexto y diseño adaptable; no declarar usabilidad o accesibilidad por inspección de componentes.

**Rol:** R2 · **Revisor:** R4 · **Milestone:** M4 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** EVA-05, REC-04, REC-05, EXP-03

**GitHub:** [#42](https://github.com/NickSalA/portfolio-course/issues/42) · **Asignado:** @RobertoPizarro · **Revisión propuesta:** @fabrizio25504

- [ ] Recorrer con teclado registro, consulta, presentación/atención de reclamo y descarga.
- [ ] Revisar foco, etiquetas, mensajes de error y estados identificados con texto.
- [ ] Comprobar distinción pendiente/cero, resultado base/ajustado y decisión final del reclamo.

**Aceptación:** no quedan bloqueos de interacción en los recorridos esenciales; registrar y corregir hallazgos sin declarar conformidad total de accesibilidad por una revisión parcial.

**Documentación:** casos, hallazgos, correcciones y limitaciones de revisión.

### QA-02 · Integrar privacidad, integridad y recuperación

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#comprobaciones-necesarias-para-aceptación-funcional). Retomar hallazgos de aislamiento, vínculos, revocación, bypass de selección, historia y reintentos; exigir evidencia de corrección y regresión, no solo actualización documental.

**Rol:** R3 · **Revisor:** R4 · **Milestone:** M4 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** EVA-07, REC-07, EXP-04

**GitHub:** [#43](https://github.com/NickSalA/portfolio-course/issues/43) · **Asignado:** @MathiMomos · **Revisión propuesta:** @fabrizio25504

- [ ] Repetir matriz docente/alumno, curso propio/ajeno y participante histórico/nuevo integrante.
- [ ] Probar accesos directos, solicitudes duplicadas, cambio de grupo y correcciones posteriores.
- [ ] Revisar evidencias y señales sin datos personales, notas, puntos o texto privado de reclamos expuestos.
- [ ] Corregir fallos de seguridad/integridad y volver a ejecutar los casos afectados.

**Aceptación:** sin fallos conocidos que expongan información ajena o alteren registros de otro actor; reintentos y fallos preservan los resultados y la historia.

**Documentación:** matriz de permisos, pruebas de fallos y evidencia de correcciones.

### QA-03 · Preparar operación y demostración reproducible

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#interfaces-y-recorrido-visible). El inventario identifica rutas/componentes, no demostración ejecutada. Preparar cuentas y recorrido reproducible, diferenciando servicios externos, navegación en vivo y evidencia previa.

**Rol:** R5 · **Revisor:** R1 · **Milestone:** M4 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** REC-06, EXP-03

**GitHub:** [#44](https://github.com/NickSalA/portfolio-course/issues/44) · **Asignado:** @Forex549 · **Revisión propuesta:** @NickSalA

- [ ] Documentar configuración de prueba, requisitos de ejecución y tratamiento de fallo de correo sin secretos.
- [ ] Preparar conjunto sintético para demostrar registro, cambio de grupo, consulta, reclamo y XLSX.
- [ ] Comprobar qué se puede ejecutar y qué depende de un servicio externo; registrar limitaciones y responsable.
- [ ] Preparar alternativa de demostración con evidencia real previa, sin presentarla como ejecución en vivo.

**Aceptación:** otro integrante reproduce el recorrido documentado; se distingue prueba local, envío/entrega de correo y cualquier configuración remota no verificada. No se exige un proveedor, despliegue o respaldo nuevo por analogía con otro proyecto.

**Documentación:** instrucciones operativas y evidencia de demostración.

### QA-04 · Evaluar registro y seguimiento con escenarios acordados

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#comprobaciones-necesarias-para-aceptación-funcional). El contraste es estático, no medición ni aceptación funcional. Registrar resultados reales con condiciones y limitaciones, sin reutilizar estimaciones como tiempos medidos.

**Rol:** R4 · **Revisor:** R1 · **Milestone:** M4 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** QA-01, QA-02, QA-03

**GitHub:** [#45](https://github.com/NickSalA/portfolio-course/issues/45) · **Asignado:** @fabrizio25504 · **Revisión propuesta:** @NickSalA

- [ ] Acordar participantes, repeticiones, conjunto de datos y condiciones antes de medir.
- [ ] Comparar tiempo de registro con un procedimiento manual simulado equivalente, sin cronometrar la evaluación del contenido de trabajos.
- [ ] Revisar consulta, reclamos, correo y exportación contra sus criterios, sin inventar una línea base histórica de seguimiento.
- [ ] Registrar observaciones, cálculos, discrepancias y limitaciones, incluso si no hay mejora.

**Aceptación:** resultados reproducibles que permiten responder a la contribución del sistema; metas no acordadas ni porcentajes supuestos se presentan como logros.

**Documentación:** protocolo, resultados y limitaciones en el registro de evaluación.

### QA-05 · Cerrar integración y pendientes del sistema

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#comprobaciones-necesarias-para-aceptación-funcional). Reconciliar hallazgos del inventario con evidencia posterior y pendientes por issue. No cerrar por haber documentado riesgos ni convertir el inventario histórico en prueba del estado nuevo.

**Rol:** R1 · **Revisor:** R4 · **Milestone:** M4 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** QA-04

**GitHub:** [#46](https://github.com/NickSalA/portfolio-course/issues/46) · **Asignado:** @NickSalA · **Revisión propuesta:** @fabrizio25504

- [ ] Revisar criterios M1–M4 y asignar a sus autores la corrección de los defectos encontrados.
- [ ] Comprobar nuevamente los recorridos afectados y registrar qué permanece pendiente.
- [ ] Consolidar versión evaluada y decisión de cierre; no etiquetar ni desplegar una versión por redactar el acta.

**Aceptación:** sin fallos que impidan recorridos esenciales o expongan información ajena; pendientes restantes explícitos, resultados y versión identificados para preparar entrega. Si no se cumple, el hito permanece abierto y se aplica contingencia.

**Documentación:** cierre del desarrollo, evidencia y limitaciones del producto entregable.

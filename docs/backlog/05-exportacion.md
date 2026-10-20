# Exportación XLSX y cálculo individual

Referencias: [convenciones del backlog](README.md) · [milestones](../04-gestion/milestones.md) · [caso vigente](../01-definicion/caso-evaluacion-grupal.md) · [calendario](../04-gestion/calendario-y-contingencia.md) · [roles](../04-gestion/equipo-y-flujo-de-trabajo.md).

Antes de implementar, verificar lo existente y conservar lo que pase los criterios; completar solo las brechas comprobadas, sin imponer nuevas bibliotecas. La regla de puntos es un **supuesto revisable del equipo**, no una indicación confirmada por el docente. EXP-01 cierra decisiones en M1; durante M1–M2 preparar en paralelo ejemplos, contratos, columnas acordadas y pruebas sintéticas. M3 integra y verifica cálculo y descarga, no concentra todo el inicio. No se añade un control de publicación ni se requiere actualizar especificaciones históricas como dependencia.

### EXP-01 · Cerrar decisiones del cálculo y las columnas

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#6-descargas-reclamos-y-correo). Hay exportadores separados de notas y puntos, no salida individual integrada. Cerrar negativos, anulados, precisión y columnas; mantener el cálculo como supuesto revisable del equipo.

**Rol:** R1 · **Revisor:** R3 · **Milestone:** M1 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** BASE-01

**GitHub:** [#38](https://github.com/NickSalA/portfolio-course/issues/38) · **Asignado:** @NickSalA · **Revisión propuesta:** @MathiMomos

- [ ] Contrastar las capacidades existentes con el supuesto del equipo y registrar lo reutilizable y las brechas.
- [ ] Acordar el tratamiento de saldos negativos y movimientos anulados, sin deducir reglas no confirmadas.
- [ ] Concretar precisión de notas y puntos, conservando el redondeo solo del promedio final ajustado a dos decimales.
- [ ] Cerrar columnas y ejemplos de salida: notas base, promedio base, saldo, aplicados, excedente y promedio ajustado, con pendientes diferenciados de cero.
- [ ] Documentar el acuerdo y cualquier decisión todavía abierta; no inventar una distribución de puntos por trabajo ni avanzar el cálculo con reglas pendientes.

**Aceptación:** el caso registra decisiones explícitas sobre negativos, anulados, precisión y columnas, con ejemplos verificables y revisión de R3. Se preservan igual peso, límite 20, cálculo sin consumo y condición de supuesto del equipo. Una decisión sin resolver permanece como bloqueo, no como regla implícita.

**Documentación:** actualizar [caso vigente](../01-definicion/caso-evaluacion-grupal.md) con las decisiones acordadas y [evidencia](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md) con ejemplos esperados, identificados como preparación y no como pruebas ejecutadas.

### EXP-02 · Cálculo puro de saldo y promedio ajustado

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#6-descargas-reclamos-y-correo). No se identificó cálculo individual integrado. Separar cálculo puro de generación XLSX y usar únicamente decisiones cerradas en EXP-01, sin modificar notas ni saldo.

**Rol:** R3 · **Revisor:** R4 · **Milestone:** M3 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** EXP-01, EVA-04

**GitHub:** [#39](https://github.com/NickSalA/portfolio-course/issues/39) · **Asignado:** @MathiMomos · **Revisión propuesta:** @fabrizio25504

- [ ] Verificar el cálculo existente y preparar desde M2 pruebas con entradas sintéticas según las decisiones de EXP-01.
- [ ] Implementar una operación pura para n trabajos completos de igual peso y saldo no negativo: margen = suma de (20 − nota base), aplicados = mínimo entre saldo y margen y excedente = saldo − aplicados.
- [ ] Calcular promedio base = suma de notas base / n y promedio ajustado = (suma de notas base + aplicados) / n; cada punto equivale a una unidad de nota sin superar 20 por trabajo ni reutilizarlo dentro del cálculo.
- [ ] Redondear solo el resultado final ajustado a dos decimales; tratar negativos y anulados únicamente conforme a EXP-01, sin redondeos intermedios que alteren el resultado.
- [ ] Mantener pendiente el promedio final ajustado con notas incompletas o sin trabajos; no dividir entre cero, consumir puntos ni persistir calificaciones ajustadas como notas base.

**Aceptación:** con notas 10 y 18 y saldo 15, el margen es 12, los aplicados 12, el excedente 3, el promedio base 14 y el ajustado 20,00. Con notas 10, 10 y 11 y saldo 1, el ajustado es 10,67 sin redondeos intermedios. Una nota faltante no se convierte en cero ni produce un final completo; cero explícito sí cuenta. Iguales entradas producen iguales resultados sin escrituras ni cambios de saldo o notas base.

**Documentación:** actualizar [modelo de datos](../02-diseno/modelo-datos.md) con el contrato de cálculo derivado y la preservación de datos base; registrar pruebas y límites en [evidencia](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md).

### EXP-03 · Descarga XLSX por curso con atribución histórica

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#6-descargas-reclamos-y-correo). Reutilizar generación XLSX, no la atribución actual: exporta integrantes actuales y notas locales incluso no confirmadas, con pendiente «-». Integrar datos históricos confirmados y cálculo sin mutaciones.

**Rol:** R5 · **Revisor:** R2 · **Milestone:** M3 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** EXP-02

**GitHub:** [#40](https://github.com/NickSalA/portfolio-course/issues/40) · **Asignado:** @Forex549 · **Revisión propuesta:** @RobertoPizarro

- [ ] Verificar y reutilizar la generación XLSX existente que cumpla el contrato y las columnas acordadas en EXP-01.
- [ ] Obtener notas de cada alumno según participantes históricos de cada actividad, no desde el grupo actual ni inventando pertenencias.
- [ ] Integrar el cálculo puro y las columnas acordadas, manteniendo notas pendientes vacías, cero explícito y promedio final ajustado pendiente cuando corresponda.
- [ ] Permitir la descarga solo al docente autorizado del curso, con carga, error y confirmación comprensibles.
- [ ] Garantizar que generar o repetir la descarga no consume puntos ni escribe calificaciones ajustadas en los registros base.

**Aceptación:** el docente descarga un XLSX legible de su curso con los datos y columnas acordados. Un alumno que cambia de grupo conserva las notas de sus actividades originales; una atribución no establecida no se completa desde el grupo actual. El archivo distingue vacío de cero y muestra el cálculo acordado, sin convertirlo en acta oficial ni modificar registros. Un actor no autorizado no puede obtenerlo.

**Documentación:** actualizar [estado actual](../03-calidad-y-operacion/estado-actual.md) con el recorrido de descarga y sus límites; registrar archivo sintético y comprobaciones en [evidencia](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md).

### EXP-04 · QA de descarga, cálculo, privacidad y repetición

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#comprobaciones-necesarias-para-aceptación-funcional). Comprobar guardado fallido seguido de descarga, pendientes/cero, cambio A→B y repetición sin cambios académicos. Abrir y revisar archivos sintéticos; no basta encontrar un botón de exportación.

**Rol:** R4 · **Revisor:** R1 · **Milestone:** M3 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** EXP-03

**GitHub:** [#41](https://github.com/NickSalA/portfolio-course/issues/41) · **Asignado:** @fabrizio25504 · **Revisión propuesta:** @NickSalA

- [ ] Preparar desde M1–M2 una matriz sintética con notas completas, pendientes, cero, límite 20, saldo cero, margen agotado y excedentes.
- [ ] Contrastar cálculo y XLSX con resultados esperados, incluyendo precisión final y tratamiento acordado de negativos y anulados.
- [ ] Probar cambio de grupo y atribución histórica, y denegar descarga a alumnos y docentes de otros cursos.
- [ ] Repetir descargas con iguales entradas y comparar resultados académicos y registros antes y después, sin exigir identidad binaria del archivo.
- [ ] Registrar errores de generación, recuperación y discrepancias; verificar las correcciones antes del cierre.

**Aceptación:** los casos documentan esperado y observado, incluido un promedio que exige redondeo final. Las descargas repetidas mantienen resultados y dejan intactos puntos y notas base; no hay acceso ajeno ni sustitución de pendientes por cero. Los casos pendientes o fallidos se identifican y no se declara cierre con fallos esenciales de cálculo, atribución o privacidad.

**Documentación:** actualizar [evidencia](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md) con matriz, resultados, archivos sintéticos y limitaciones; reflejar el alcance verificado en [estado actual](../03-calidad-y-operacion/estado-actual.md).

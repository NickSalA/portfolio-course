# Especificación: decisiones de cálculo y exportación (EXP-01)

**Rama**: no creada por esta especificación  
**Creada**: 2026-10-28  
**Estado**: decisiones confirmadas por R1; aceptación de R3 comunicada por R1, pendiente de registrar en la evidencia  
**Entrada**: issue [#38](https://github.com/NickSalA/portfolio-course/issues/38) y ficha `docs/backlog/05-exportacion.md` (EXP-01).

## Clarifications

### Session 2026-10-28

- Q: ¿Cómo se muestra el promedio base con decimales adicionales? → A: Se muestra con dos decimales; el cálculo usa la precisión completa, no el valor mostrado.
- Q: ¿Qué se muestra cuando no hay trabajos? → A: El saldo permanece visible y promedio base, puntos aplicados, excedente y promedio ajustado quedan vacíos.
- Q: ¿Quién confirmó las decisiones y qué estado tiene la revisión? → A: El usuario se identificó como R1 (@NickSalA), confirmó las decisiones y comunicó que R3 las revisó y aceptó; no se ha verificado una aprobación en GitHub.

## Escenarios y validación

### Historia 1 — Acordar las reglas de puntos (P1)

Como responsable del proceso, quiero que el equipo acuerde cómo tratar los saldos negativos y movimientos anulados para que la futura exportación no aplique reglas implícitas.

**Validación independiente**: revisar el caso vigente, las decisiones y ejemplos con R3; comprobar que una decisión sin acuerdo permanece bloqueada.

1. **Dado** un alumno con saldo negativo, **cuando** se documenta la regla, **entonces** el resultado esperado y su justificación quedan explícitos o el caso sigue bloqueado.
2. **Dado** un movimiento anulado, **cuando** se define el conjunto de movimientos incluidos, **entonces** se identifica su tratamiento en el cálculo y se preserva la historia del movimiento.

### Historia 2 — Precisar valores y columnas (P1)

Como docente que revisará la exportación, quiero columnas y precisión acordadas para distinguir notas pendientes, ceros y resultados calculados sin ambigüedad.

**Validación independiente**: revisar una tabla de columnas y ejemplos sintéticos que incluyan una nota pendiente y un cero explícito.

1. **Dado** un trabajo sin nota y otro con cero, **cuando** se describen sus celdas, **entonces** ambos estados son diferenciables y no se presenta un promedio ajustado completo.
2. **Dado** un cálculo con decimales, **cuando** se documenta su precisión, **entonces** no se introduce redondeo intermedio que altere el resultado y el promedio ajustado final tiene dos decimales.
3. **Dado** al menos una nota pendiente, **cuando** se describe la exportación, **entonces** el saldo permanece visible y promedio base, puntos aplicados, excedente y promedio ajustado quedan vacíos.

### Historia 3 — Revisar capacidades y evidencia (P2)

Como revisor R3, quiero contrastar las capacidades existentes y los ejemplos con el supuesto del equipo para identificar reutilización, brechas y decisiones pendientes antes de aprobar el contrato.

**Validación independiente**: contrastar la documentación con el código vigente y verificar que el registro distingue inspección, preparación y pruebas ejecutadas.

1. **Dado** que existen exportaciones separadas de notas y puntos, **cuando** se contrastan con la salida individual prevista, **entonces** se identifican lo reutilizable y las brechas sin afirmar aceptación funcional no verificada.
2. **Dado** un acuerdo documentado, **cuando** otra persona distinta de su autoría lo revisa, **entonces** se registra la revisión y cualquier bloqueo restante.

### Casos límite

- Saldo negativo: cada punto reduce una unidad de nota individual con límite inferior 0; lo que exceda el margen hasta cero queda como excedente negativo no aplicado y no modifica el saldo.
- Movimientos anulados: se excluyen del saldo sin borrar su historia.
- Notas pendientes, cero explícito y ausencia total de trabajos: diferenciar estados; sin trabajos mantener visible el saldo y dejar vacíos ambos promedios, aplicados y excedente, sin dividir entre cero.
- Puntos superiores al margen o notas ya en 20: conservar el excedente sin consumo; se permite aplicar una fracción de un punto entero cuando el margen restante sea fraccionario.
- Participación histórica no establecida: no atribuir una nota desde el grupo actual.
- Promedios con decimales: no redondear antes del resultado final ajustado; mostrar promedio base con dos decimales sin usar ese valor visualizado para calcular.

## Requisitos

### Requisitos funcionales

- **FR-001**: Registrar el contraste entre las capacidades actuales y la salida individual requerida, distinguiendo inspección estática de pruebas realmente ejecutadas.
- **FR-002**: Registrar la decisión indicada por el usuario: cada punto negativo reduce una unidad de nota individual de un trabajo hasta un mínimo de 0, sin modificar la nota grupal base; si el saldo supera el margen disponible hasta cero, el excedente negativo queda sin aplicar y no altera el saldo registrado.
- **FR-003**: Excluir los movimientos anulados del saldo y del cálculo, preservándolos en la historia; registrar la decisión indicada por R1 y la aceptación de R3 comunicada por R1, sin presentarla como aprobación verificada en GitHub.
- **FR-004**: Registrar la decisión indicada por el usuario: identificar a cada alumno mediante nombre y correo, y admitir notas base con hasta dos decimales. Mostrar columnas de notas base por actividad, promedio base, saldo, puntos aplicados, excedente y promedio ajustado; distinguir las notas pendientes de cero. Mantener el redondeo solo del promedio ajustado final a dos decimales. Los movimientos de puntos son siempre enteros. Las notas base pendientes se representan con celdas vacías; si falta alguna nota, promedio base, puntos aplicados, excedente y promedio ajustado quedan vacíos. El saldo permanece visible. Con notas completas, calcular con precisión sin redondeos intermedios y mostrar los promedios base y ajustado con dos decimales; el formato del promedio base no interviene en el cálculo. Redondear el resultado final ajustado al centésimo más cercano, con empate hacia arriba (13,505 → 13,51).
- **FR-005**: Conservar las reglas ya documentadas: igual peso, límite de 20 por trabajo, aplicación automática sin reutilización y sin consumo de puntos ni cambios de notas base.
- **FR-006**: Documentar ejemplos verificables de notas base, promedio base, saldo, aplicados, excedente y promedio ajustado, diferenciando pendiente de cero.
- **FR-007**: Mantener el cálculo como supuesto revisable del equipo, no confirmado por el profesor. Mostrar notas base por trabajo y el resultado ajustado individual, sin mostrar una distribución de puntos por trabajo; no deducir qué trabajo recibió cada ajuste.
- **FR-008**: Registrar cada decisión no acordada como bloqueo; no declarar aceptación sin revisión R3 independiente de la autoría.
- **FR-009**: Actualizar el caso vigente y la evidencia de preparación, diferenciando ejemplos esperados de pruebas ejecutadas.

### Entidades clave

- **Nota base**: resultado de un trabajo para sus participantes, potencialmente pendiente o cero explícito.
- **Movimiento de puntos**: ajuste individual con valor y estado, incluido o excluido según el acuerdo.
- **Saldo y resultado calculado**: saldo, margen, puntos aplicados, excedente y promedios; el cálculo no modifica registros.
- **Decisión de exportación**: regla, justificación, ejemplos, responsables, revisión y estado de acuerdo o bloqueo.

## Criterios de éxito

### Resultados verificables

- **SC-001**: El caso documenta las cuatro áreas —negativos, anulados, precisión y columnas— con acuerdo explícito y revisión R3, o identifica cada área sin acuerdo como bloqueo; solo se acepta el issue si las cuatro están acordadas.
- **SC-002**: Los ejemplos incluyen notas 10 y 18 con saldo 15 (aplicados 12, excedente 3, promedio base 14 y ajustado 20,00), así como 10, 10 y 11 con saldo 1 (ajustado 10,67).
- **SC-003**: Los ejemplos distinguen pendiente de cero, exceso de puntos y ausencia de trabajos; con notas 0 y 1 y saldo −3 se aplican −1, quedan −2 sin aplicar y el promedio ajustado es 0,00. Con nota 19,50 y saldo +1 se aplican +0,50 y quedan +0,50 sin aplicar; con nota 0,25 y saldo −1 se aplican −0,25 y quedan −0,75 sin aplicar. Los resultados preparados no se presentan como pruebas ejecutadas.
- **SC-004**: Toda decisión acordada tiene trazabilidad a su responsable y revisión independiente; el caso y la evidencia enlazan sus acuerdos y límites.

## Supuestos y alcance

- El modelo de puntos es un supuesto de trabajo del equipo, no una regla confirmada por el profesor.
- BASE-01 (#10) es antecedente y dependencia documentada; EXP-02 (#39) y DOC-01 (#47) se desbloquean con las decisiones de este issue.
- Implementación del cálculo (#39), XLSX histórico (#40), actas oficiales e integración SUM quedan fuera del alcance.
- El inventario BASE-01 es histórico; contrastarlo con el código actual y no actualizarlo como si probara aceptación nueva.
- Las reglas de negativos, límite inferior y anulación, así como nombre y correo, hasta dos decimales para notas base y puntos enteros, fueron confirmadas por el usuario, quien se identificó como responsable R1 (@NickSalA). R1 comunicó que R3 revisó y aceptó las decisiones; falta registrar el resultado en la evidencia. No se verificó una aprobación en GitHub ni se modificó el issue.

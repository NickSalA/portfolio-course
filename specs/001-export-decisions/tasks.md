# Tareas: decisiones de cálculo y columnas (EXP-01 / #38)

**Entrada**: `specs/001-export-decisions/spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/export-decision.md` y `quickstart.md`  
**Alcance**: documentación y revisión; no implementar cálculo (#39), exportación (#40), historia ni cambios de permisos. Las decisiones expresadas por el usuario son propuestas pendientes de revisión R3 y no están confirmadas por el profesor.

## Fase 1: Preparación

- [x] T001 Contrastar el alcance, responsable y aceptación de #38 en `docs/backlog/05-exportacion.md` y el issue de GitHub; registrar en `specs/001-export-decisions/research.md` cualquier divergencia sin asumir sincronización automática.
- [x] T002 [P] Revisar los principios de privacidad, integridad y evidencia de `.specify/memory/constitution.md` y registrar restricciones aplicables en `specs/001-export-decisions/plan.md` sin afirmar que se ejecutaron pruebas.

## Fase 2: Fundamentos

- [x] T003 Contrastar los antecedentes de `docs/03-calidad-y-operacion/inventario-capacidades-base-01.md` con los exportadores actuales `portfolio-coursse/components/teacher/grades/group-grades-table.tsx` y `portfolio-coursse/components/teacher/points/export-points-button.tsx`; documentar reutilización y brechas en `specs/001-export-decisions/research.md` sin modificar el inventario histórico ni declarar validación de interfaz.
- [x] T004 Confirmar con el responsable el estado de las decisiones indicadas por el usuario y registrar su fuente, la revisión R3 pendiente y cualquier desacuerdo o bloqueo en `specs/001-export-decisions/research.md`; no atribuir confirmación al profesor.

## Fase 3: Historia 1 — Reglas de puntos (P1)

**Objetivo**: documentar las reglas de saldos positivos y negativos, límites y anulaciones sin mutar datos.  
**Validación independiente**: revisar con datos sintéticos que un saldo negativo no reduce una nota por debajo de cero, el excedente conserva su signo, los movimientos anulados no se suman y ningún registro base se modifica.

- [x] T005 [US1] Precisar en `docs/01-definicion/caso-evaluacion-grupal.md` que un movimiento es de importe entero, activo o anulado; el saldo suma únicamente activos y las anulaciones conservan su historia, identificando la regla como supuesto sujeto a revisión.
- [x] T006 [US1] Describir en `docs/01-definicion/caso-evaluacion-grupal.md` aplicación individual positiva hasta 20 y negativa hasta 0, sin reutilización ni consumo; permitir aplicación parcial con margen fraccionario y conservar el excedente con signo.
- [x] T007 [US1] Registrar ejemplos esperados para saldo positivo, negativo, límite cero, límite 20, movimiento anulado y márgenes fraccionarios en `docs/automatizaciones/gestion-evaluacion-grupal/evaluacion.md`, identificándolos como preparación y no pruebas ejecutadas.
- [x] T008 [US1] Comprobar manualmente contra `specs/001-export-decisions/data-model.md` los ejemplos `0, 1 / −3 → −1 aplicado, −2 excedente`, `19,50 / +1 → +0,50 y +0,50` y `0,25 / −1 → −0,25 y −0,75`; registrar fecha, versión, esperado, observado y límites en `docs/automatizaciones/gestion-evaluacion-grupal/evaluacion.md`.

## Fase 4: Historia 2 — Precisión y columnas (P1)

**Objetivo**: definir los valores visibles de la futura exportación sin inventar distribución por trabajo.  
**Validación independiente**: revisar la tabla de columnas y los casos pendiente, cero y promedios con precisión no terminante; el formato no debe alterar el cálculo.

- [x] T009 [US2] Documentar en `docs/01-definicion/caso-evaluacion-grupal.md` las columnas nombre, correo, notas base por actividad, promedio base, saldo, aplicados, excedente y promedio ajustado; no incluir notas ajustadas por trabajo ni atribuir notas desde el grupo actual.
- [x] T010 [US2] Precisar en `docs/01-definicion/caso-evaluacion-grupal.md` las restricciones «valor entre 0 y 20 con hasta dos decimales, o pendiente», «importe entero no nulo», límites 0–20 y movimientos anulados excluidos del saldo; separar visualización de dos decimales de cálculo sin redondeos intermedios y registrar aceptación de R3 comunicada por R1, sin validación independiente.
- [x] T011 [US2] Documentar en `docs/01-definicion/caso-evaluacion-grupal.md` que una nota pendiente es celda vacía y cero es numérico; con nota pendiente dejar vacíos promedio base, aplicados, excedente y promedio ajustado manteniendo visible el saldo; registrar la confirmación del usuario para el caso sin trabajos, pendiente de revisión R3.
- [x] T012 [US2] Añadir ejemplos esperados de columnas y valores en `docs/automatizaciones/gestion-evaluacion-grupal/evaluacion.md` para notas completas, pendiente, cero, ausencia de trabajos y resultados fraccionarios; indicar explícitamente que no se ha generado ni probado un XLSX nuevo.
- [x] T013 [US2] Verificar manualmente en `docs/automatizaciones/gestion-evaluacion-grupal/evaluacion.md` los ejemplos `10, 18 / 15 → 14 y 20,00`, `10, 10, 11 / 1 → 10,67` y `13,505 → 13,51`, así como la independencia del cálculo respecto del promedio base visualizado; registrar resultados y límites reales.

## Fase 5: Historia 3 — Contraste y revisión independiente (P2)

**Objetivo**: dejar trazabilidad de lo existente, los ejemplos y la revisión R3.  
**Validación independiente**: un revisor distinto de la autoría contrasta el caso y la evidencia con las fuentes; si no hay revisión, la aceptación permanece bloqueada.

- [x] T014 [US3] Integrar en `docs/automatizaciones/gestion-evaluacion-grupal/evaluacion.md` el contraste de T003, distinguiendo exportadores existentes, datos locales no confirmados, historia ausente y verificaciones visuales no realizadas, con seguimiento en #39/#40 y GRP-06 sin ampliar #38.
- [ ] T015 [US3] Registrar en `docs/automatizaciones/gestion-evaluacion-grupal/evaluacion.md` el resultado real de la revisión independiente R3 en el PR, incluida confirmación o rechazo de presentación de promedio base y ausencia de trabajos; R1 indica que R3 revisará el PR completo, sin resultado independiente verificado todavía.
- [x] T016 [US3] Reflejar en `docs/backlog/05-exportacion.md` el estado real de EXP-01, decisiones y bloqueos con referencia a evidencia; no marcar aceptación sin acuerdo y revisión R3, ni afirmar cambios en GitHub por editar documentación local.

## Fase final: Revisión transversal

- [x] T017 Comparar `docs/01-definicion/caso-evaluacion-grupal.md` y `docs/automatizaciones/gestion-evaluacion-grupal/evaluacion.md` con `specs/001-export-decisions/contracts/export-decision.md`; resolver contradicciones, verificar enlaces y mantener diferenciados ejemplos, pruebas ejecutadas y decisiones pendientes.
- [x] T018 Ejecutar `git diff --check` desde la raíz y las comprobaciones documentales de `specs/001-export-decisions/quickstart.md`; registrar en `docs/automatizaciones/gestion-evaluacion-grupal/evaluacion.md` resultados reales o imposibilidad de ejecución.
- [x] T019 Registrar en `docs/backlog/05-exportacion.md` si el seguimiento quedó solo local y los bloqueos #39/#40/#23; actualizar GitHub únicamente con autorización explícita y nunca afirmar que se actualizó sin verificarlo.

## Dependencias y orden

- Preparación T001–T002 → fundamentos T003–T004 → historias.
- US1 y US2 son verificables por separado, pero ambas editan `docs/01-definicion/caso-evaluacion-grupal.md` y `docs/automatizaciones/gestion-evaluacion-grupal/evaluacion.md`: coordinar ediciones secuenciales, no en paralelo sobre los mismos archivos.
- US3 integra T003 y las evidencias de US1/US2; la revisión R3 requiere un revisor humano independiente y puede quedar bloqueada.
- Fase final después de US1, US2 y US3; #38 solo se acepta con acuerdo formal y revisión R3 real.

## Oportunidades de ejecución paralela

- **Preparación**: T001 y T002 pueden realizarse en paralelo: modifican archivos distintos.
- **US1**: un colaborador puede verificar los ejemplos de `specs/001-export-decisions/data-model.md` mientras otro prepara la redacción de `docs/01-definicion/caso-evaluacion-grupal.md`; integrar secuencialmente T005–T008, sin escritura concurrente en la evidencia.
- **US2**: se pueden revisar independientemente el contrato `specs/001-export-decisions/contracts/export-decision.md` y los ejemplos de `specs/001-export-decisions/quickstart.md`; integrar T009–T013 secuencialmente en los documentos compartidos.
- **US3**: la inspección de exportadores puede hacerse en paralelo con la identificación del revisor; registrar T014–T016 secuencialmente y esperar el resultado real de R3.

## Estrategia

MVP documental: completar preparación, fundamentos y US1; verificar sus ejemplos sin afirmar cierre de #38. A continuación completar US2 y US3; finalmente comprobar coherencia y seguimiento. La suite de cálculo y la generación de XLSX pertenecen a otros issues, no a estas tareas.

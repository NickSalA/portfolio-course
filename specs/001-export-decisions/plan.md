# Plan: decisiones de cálculo y columnas (EXP-01 / #38)

**Rama actual**: `feature/EXP-01` | **Fecha**: 2026-10-28 | **Especificación**: [spec.md](spec.md)

## Resumen

Documentar las reglas indicadas por el usuario, contrastarlas con el código existente, preparar ejemplos verificables y solicitar revisión independiente R3. Es un supuesto revisable del equipo, no confirmado por el profesor. R1 confirmó las decisiones y comunicó la aceptación de R3; no se ha verificado una aprobación independiente en GitHub. No implementar el cálculo ni la exportación en esta issue.

## Contexto técnico

- **Artefactos**: documentación Markdown versionada; aplicación Next.js/TypeScript existente, Supabase/PostgreSQL y generación XLSX con `xlsx` como contexto, no tecnologías nuevas.
- **Datos existentes**: notas `numeric(4,2)` y movimientos enteros; validar alcance real en `supabase/migrations/0028_group_evaluations_and_grades.sql` y `0001_academic_platform.sql`.
- **Verificación**: inspección de código y enlaces, revisión independiente y cálculos sintéticos manuales. Las pruebas de cálculo en `lib/export/adjusted-average.test.mjs` corresponden a #39 y no acreditan implementación de #38.
- **Restricciones**: preservar notas base y movimientos; límites 0–20; no consumo; redondear el promedio ajustado solo al final; historial no sustituible por grupo actual; sin datos reales en evidencia.
- **Alcance**: definir y documentar contrato y ejemplos para #38; #39 implementa cálculo, #40 exportación y #41 verifica integración.

## Comprobación constitucional

| Principio                 | Evaluación previa y posterior al diseño                                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Seguridad y autorización  | Sin cambios de permisos; contrato futuro exige identidad, rol y curso en servidor y RLS. No restaurar lectura estudiantil de notas sin EVA-04. |
| Integridad y trazabilidad | Sin escrituras académicas; anulados conservados, no incluidos en saldo; ejemplos identificados como preparación.                               |
| Simplicidad               | Reutilizar capacidades existentes cuando cumplan; sin bibliotecas ni servicios nuevos.                                                         |
| Automatización y calidad  | Validación documental y ejemplos reproducibles; no presentar resultados no ejecutados ni el supuesto como confirmado por profesor.             |
| Colaboración              | Revisión R3 independiente requerida antes de aceptación; GitHub y documentación local no se sincronizan automáticamente.                       |

Sin desviaciones constitucionales identificadas para el alcance documental. La revisión R3 es una condición de aceptación pendiente, no un permiso para afirmar implementación o aprobación.

## Estructura y fases

1. **Contraste**: revisar exportadores y precisión actuales, `docs/03-calidad-y-operacion/inventario-capacidades-base-01.md` y [research.md](research.md); no modificar el inventario histórico.
2. **Formalización**: actualizar `docs/01-definicion/caso-evaluacion-grupal.md` con decisiones propuestas y fuente, preservando su estado de supuesto sujeto a revisión; comparar con [contrato](contracts/export-decision.md) y [modelo](data-model.md).
3. **Evidencia**: actualizar `docs/automatizaciones/gestion-evaluacion-grupal/evaluacion.md` con matriz de casos, fecha, versión, esperado/observado y límites; diferenciar ejemplos preparados de validación ejecutada.
4. **Revisión y cierre**: solicitar revisión independiente R3; resolver discrepancias o mantener bloqueo; registrar seguimiento local y actualizar GitHub solo mediante una acción explícita autorizada. No marcar #38 aceptado sin acuerdo y revisión.

**Artefactos**: [research.md](research.md), [data-model.md](data-model.md), [contrato](contracts/export-decision.md), [quickstart.md](quickstart.md). Las tareas detalladas se generan en una fase posterior.

## Dependencias y riesgos

- BASE-01 #10 es antecedente documentado; el inventario no acredita aceptación vigente.
- EXP-02 #39 y DOC-01 #47 dependen de estas decisiones; atribución histórica y exportación corresponden a sus responsables respectivos, sin ampliar el alcance de #38.
- La especificación contempla medias no terminantes: el formato de dos decimales es presentación y no entrada al cálculo.
- Existe discrepancia documental sobre si sincronizar especificaciones históricas es obligatorio: la ficha de #38 dice que no es requisito para comenzar. Registrar la discrepancia y no imponer una dependencia adicional.
- El responsable y R3 deben confirmar formalmente las decisiones; la especificación recoge lo expresado por el usuario, no una revisión ya ejecutada.

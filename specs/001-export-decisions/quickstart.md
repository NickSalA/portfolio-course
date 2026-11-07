# Validación de decisiones EXP-01

## Requisitos previos

Trabajar en el repositorio local; disponer de la ficha `docs/backlog/05-exportacion.md`, el caso `docs/01-definicion/caso-evaluacion-grupal.md` y la evidencia `docs/automatizaciones/gestion-evaluacion-grupal/evaluacion.md`. No usar datos reales ni bases de producción. No es necesario arrancar Supabase para revisión documental.

## Comprobaciones documentales

1. Comparar el caso vigente con [spec.md](spec.md), el [contrato](contracts/export-decision.md) y [data-model.md](data-model.md). Registrar discrepancias y decisiones indicadas por el usuario como pendientes de revisión R3.
2. Ejecutar `git diff --check` para comprobar errores de whitespace; revisar enlaces y rutas por separado, y que el inventario histórico no se reescribió como evidencia nueva.
3. Registrar fecha, versión, casos, resultados y limitaciones en la evidencia; no presentar ejemplos preparados como pruebas ejecutadas.
4. Registrar la aceptación de R3 comunicada por R1 y distinguirla de una revisión independiente comprobada; no inventar fecha ni aprobación en GitHub. Mantener #38 abierto hasta verificar su aceptación.

## Ejemplos para verificar

| Notas      | Saldo | Aplicados | Excedente |           Base | Ajustado |
| ---------- | ----: | --------: | --------: | -------------: | -------: |
| 10, 18     |    15 |        12 |         3 |          14,00 |    20,00 |
| 10, 10, 11 |     1 |         1 |         0 | 10,33 (visual) |    10,67 |
| 0, 1       |    −3 |        −1 |        −2 |           0,50 |     0,00 |
| 19,50      |     1 |      0,50 |      0,50 |          19,50 |    20,00 |
| 0,25       |    −1 |     −0,25 |     −0,75 |           0,25 |     0,00 |

Además comprobar un movimiento anulado excluido del saldo, un cero explícito, una nota pendiente y cero trabajos. El saldo se mantiene visible; no hay promedios, aplicados ni excedente completos cuando falta una nota. Comparar 13,505 → 13,51 como regla de redondeo del resultado final.

Estos son **resultados esperados**, no pruebas ejecutadas. Los tests de cálculo de #39 pueden estar rojos hasta su implementación; no sustituir la revisión documental por un resultado que no se haya ejecutado.

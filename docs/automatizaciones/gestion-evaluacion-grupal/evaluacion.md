# Registro de evaluación: gestión de evaluación grupal

Registro de QA (R4). Solo se anotan como resultados las pruebas **ejecutadas**; lo preparado y no
ejecutado figura como pendiente. Datos sintéticos (`@example.test`), sin secretos ni producción.

## Cómo reproducir

Requisitos: Docker y la base local de Supabase (`portfolio-coursse/`).

```bash
pnpm dlx supabase start
pnpm dlx supabase db reset            # aplica 0001..última migración en local
docker cp supabase/tests/. supabase_db_portfolio-course:/tmp/qa
docker exec supabase_db_portfolio-course psql -U postgres -f /tmp/qa/current_capabilities.sql
docker exec supabase_db_portfolio-course psql -U postgres -f /tmp/qa/group_grades_rls.sql
docker exec supabase_db_portfolio-course psql -U postgres -f /tmp/qa/pending_requirements.sql
pnpm test                              # cálculo puro de EXP-02 (Node 24, sin dependencias)
```

Cada script SQL corre en una transacción que termina en `rollback`: no deja datos.

## Conjunto sintético (BASE-02, #11)

[`supabase/tests/fixtures.sql`](../../../portfolio-coursse/supabase/tests/fixtures.sql), reutilizable
con `\ir`:

| Elemento | Contenido |
| --- | --- |
| Docentes | A (curso A, grupos A1/A2) y B (curso B, grupo B1) |
| S1 | autorizado en A; realizó T1 con A1 y después pasó a A2 (trasladado) |
| S2 | autorizado en A; siempre en A1 |
| S3 | autenticado, sin autorización |
| S4 | autorizado solo en B |
| Notas A | A1/T1 = 15, A1/T2 pendiente (`null`), A2/T1 = 0 explícito |
| Puntos S1 | +3 y −1 (el −1 se usa para anulación) |

## Pruebas de capacidades existentes (deben pasar)

[`current_capabilities.sql`](../../../portfolio-coursse/supabase/tests/current_capabilities.sql)

| Issue | Escenario | Esperado |
| --- | --- | --- |
| BASE-03 | Alumno sin autorización | Sin cursos, grupos, matrículas ni puntos |
| BASE-03 | Sin sesión anula puntos | Rechazado |
| BASE-03/04 | Docente B sobre curso A | No lee ni modifica curso ni padrón |
| EVA-02 | Docente B anula puntos de A | `not_course_teacher` |
| BASE-06 | Sincronizar dos veces | Una matrícula; conserva el grupo elegido |
| EVA-01 | Notas 0/20, 20.01/−0.01, duplicado, curso ajeno | Acepta límites; rechaza el resto; pendiente ≠ 0 |
| EVA-02 | Anular dos veces | Conserva el movimiento, segunda vez sin cambio, saldo 3 |
| GRP-05 | Ventana cerrada, grupo lleno, grupo ajeno, ventana abierta | Rechaza los tres primeros; aplica el último |

## Pruebas TDD de reglas pendientes (rojas hasta implementar)

[`pending_requirements.sql`](../../../portfolio-coursse/supabase/tests/pending_requirements.sql)
y [`adjusted-average.test.mjs`](../../../portfolio-coursse/lib/export/adjusted-average.test.mjs).
Un FAIL aquí es un requisito por implementar, no una regresión.

| Issue | Escenario | Esperado |
| --- | --- | --- |
| EVA-04 (#27) | S1 trasladado lee A1/T1 | Visible (participó) |
| EVA-04 | S1 lee A2/T1 | No visible (llegó después) |
| EVA-04 | S2 lee su nota y la pendiente | Visible; pendiente como `null` |
| EVA-04 | S4 (otro curso) | No ve notas de A |
| GRP-02 (#19) | Resincronizar grupos con un grupo calificado sin miembros | El grupo y su nota se conservan |
| EXP-02 (#39) | 10, 18 / saldo 15 | margen 12, aplicados 12, excedente 3, base 14, ajustado 20 |
| EXP-02 | 10, 10, 11 / saldo 1 | ajustado 10,67, sin redondeo intermedio |
| EXP-02 | Nota faltante / sin trabajos | ajustado pendiente (`null`), sin dividir entre cero |
| EXP-02 | Cero explícito, margen agotado, saldo 0, pureza | Ver archivo de prueba |
| EXP-02 | Saldo negativo, movimientos anulados | `todo`: bloqueado por EXP-01 (#38) |

## Escenarios preparados sin prueba automatizable aún

No existe esquema para estos casos; no se inventan tablas para no condicionar el diseño del
responsable. Se automatizarán cuando exista la interfaz.

| Issue | Escenario | Esperado |
| --- | --- | --- |
| EVA-01 (#24) | Corregir A1/T1 de 15 a 16 | Queda valor anterior, nuevo, responsable y momento |
| EVA-07 (#30) | Reenviar el mismo guardado | Mismo resultado, sin corrección duplicada |
| GRP-03 (#20) | Dos alumnos por el último cupo a la vez | Solo uno entra (requiere dos sesiones) |
| REC-01/02 (#31, #32) | S1 y S2 reclaman A1/T1 | Un único reclamo; ambos lo ven; S4 no |
| REC-01 | S1 reclama su movimiento −1 dos veces | Un único reclamo, solo S1 y docente A |
| REC-03 (#33) | Pendiente → En revisión → Respondido; reabrir | Solo docente A; Respondido es final; nota y puntos sin cambio |
| REC-06 (#36) | Falla el correo al docente | El reclamo persiste; aviso sin notas ni texto privado |
| EXP-03 (#40) | XLSX del curso A tras el traslado de S1 | S1 conserva T1 de A1; pendientes vacíos; cero visible; S4/docente B sin acceso |
| EXP-04 (#41) | Descargar dos veces | Mismos resultados; puntos y notas base intactos |

## Resultados ejecutados

| Fecha | Prueba | Observado | Estado |
| --- | --- | --- | --- |
| 2026-10-21 | `pnpm test` (Node 24.12.0) | Falla al importar `lib/export/adjusted-average.ts`, que todavía no existe | Rojo esperado (EXP-02) |
| 2026-10-21 | Casos de `adjusted-average.test.mjs` contra una implementación de referencia desechable, fuera del repositorio | 8 aprobados, 2 `todo` | Coherencia de los casos con #39; no acepta EXP-02 |
| 2026-10-21 | Scripts SQL | No ejecutados: Docker Desktop responde `500 Internal Server Error` y Supabase local no arranca | **Pendiente: fallo de infraestructura**, no funcional |

Defecto sospechado para GRP-02 (#19), **pendiente de confirmar** cuando se ejecute
`pending_requirements.sql`: `synchronize_course_groups` (migración `0021`) elimina grupos sin
miembros activos, y `group_grades.group_id` usa `on delete cascade`. En consecuencia, un grupo
calificado que quede vacío tras los traslados perdería sus notas al resincronizar.

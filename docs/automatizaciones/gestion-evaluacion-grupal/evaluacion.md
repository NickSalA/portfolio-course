# Registro de evaluación: gestión de evaluación grupal

Registro de QA (R4). Solo se anotan como resultados las pruebas **ejecutadas**; lo preparado y no
ejecutado figura como pendiente. Datos sintéticos (`@example.test`), sin secretos ni producción.

## Cómo reproducir

Requisitos: Docker y la base local de Supabase. Todos los comandos se ejecutan desde
`portfolio-coursse/`; el contenedor se llama `supabase_db_portfolio-course` (`project_id` de
`supabase/config.toml`).

```bash
# Solo base de datos y auth: el stack completo agotó la memoria de un equipo de 16 GB.
pnpm dlx supabase start -x studio,realtime,storage-api,imgproxy,edge-runtime,logflare,vector,postgres-meta,mailpit,supavisor,postgrest,kong
pnpm dlx supabase db reset            # solo local; nunca --linked ni db push
docker exec supabase_db_portfolio-course mkdir -p /tmp/qa
docker cp supabase/tests/. supabase_db_portfolio-course:/tmp/qa
docker exec supabase_db_portfolio-course psql -U postgres -f /tmp/qa/current_capabilities.sql
docker exec supabase_db_portfolio-course psql -U postgres -f /tmp/qa/group_grades_rls.sql
docker exec supabase_db_portfolio-course psql -U postgres -f /tmp/qa/pending_requirements.sql
pnpm test                              # cálculo puro de EXP-02 (Node 24, sin dependencias)
```

En Git Bash (Windows) anteponer `MSYS_NO_PATHCONV=1` para que `/tmp/qa` no se convierta en una
ruta de Windows.

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
| GRP-05 | Sin ventana, ventana vencida, grupo lleno, grupo ajeno, ventana reabierta | Rechaza los cuatro primeros; aplica el último |

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

Entorno: Windows 11, Docker Desktop, Supabase CLI vía `pnpm dlx`, Node 24.12.0, base local
reiniciada con `db reset`. Versión: rama `test/qa-r4-tdd-suite`, commit base `42a3fd7` más los
cambios de prueba registrados aquí.

| Fecha | Versión | Prueba | Esperado | Observado | Estado |
| --- | --- | --- | --- | --- | --- |
| 2026-10-21 | `42a3fd7` | `pnpm test` | Rojo hasta EXP-02 | Falla al importar `lib/export/adjusted-average.ts`, que no existe | Rojo esperado (EXP-02 #39) |
| 2026-10-21 | `42a3fd7` | Casos de `adjusted-average.test.mjs` contra implementación de referencia desechable, fuera del repositorio | Coherencia de casos | 8 aprobados, 2 `todo` | Solo valida los casos; no acepta EXP-02 |
| 2026-10-21 | `42a3fd7` | Scripts SQL | — | Docker Desktop respondía `500 Internal Server Error` | Fallo de infraestructura |
| 2026-10-24 | `42a3fd7` | `supabase db reset` | Migraciones 0001–0029 aplican | Aplican sin errores | PASS |
| 2026-10-24 | `42a3fd7` | `current_capabilities.sql` (primera ejecución) | 8 PASS | 7 PASS; GRP-05 «full group accepted a member» | Defecto **de la prueba**: el `update` de capacidad corría como `authenticated` y RLS lo descartaba (0 filas) sin error |
| 2026-10-24 | rama | `current_capabilities.sql` corregido (capacidad preparada como propietario) y con caso de ventana vencida y reabierta | 8 PASS | 8 PASS, rollback completo | PASS |
| 2026-10-24 | `42a3fd7` | `group_grades_rls.sql` | Alumno sin lectura; docente solo su curso | 3 PASS, rollback completo | PASS |
| 2026-10-24 | `42a3fd7` | `pending_requirements.sql` — EVA-04 | Rojo hasta #27 | 2 PASS (S1 no ve A2/T1; S4 no ve curso A), 3 FAIL (participante actual, trasladado y pendiente no visibles: `group_grades` solo es legible por docentes desde 0029) | Rojo esperado (EVA-04 #27) |
| 2026-10-24 | `42a3fd7` | `pending_requirements.sql` — GRP-02 | Grupo calificado vacío se conserva | FAIL: tras `synchronize_course_groups` la nota del grupo vacío desaparece | **Defecto confirmado**, devuelto a GRP-02 (#19) |
| 2026-10-24 | `42a3fd7` | `pnpm test` | Rojo hasta EXP-02 | 1 fallo: módulo inexistente | Rojo esperado (EXP-02 #39) |

Defecto confirmado para GRP-02 (#19): `synchronize_course_groups` (migración `0021`) elimina grupos
sin miembros activos y `group_grades.group_id` usa `on delete cascade`; un grupo calificado que queda
vacío tras los traslados pierde sus notas al resincronizar. La corrección corresponde al responsable
de #19; esta prueba debe pasar antes de cerrarla.

## Estado por issue de R4

| Issue | Avance verificable | Bloqueo para cerrar |
| --- | --- | --- |
| BASE-02 (#11) | Datos sintéticos y comprobación inicial reproducibles en local | Revisión de R3 (@MathiMomos) |
| GRP-05 (#22) | Ventana sin configurar/vencida/reabierta, cupo y grupo ajeno: PASS | Historia por actividad (GRP-02 #19 con defecto, GRP-06 #23), GRP-04 #21; revisión R1 |
| EVA-06 (#29) | Registro 0/20, pendiente ≠ 0 y corrección de puntos: PASS | Consulta del alumno (EVA-04 #27, EVA-05 #28), EVA-03 #26, EVA-07 #30 |
| REC-07 (#37) | Escenarios preparados | No existe esquema de reclamos (#31–#36) |
| EXP-04 (#41) | Casos de cálculo preparados | EXP-02 #39, EXP-03 #40 y reglas de EXP-01 #38 |
| QA-04 (#45) | Protocolo propuesto abajo | QA-01–03 (#42–#44) y acuerdo del equipo |
| DOC-04 (#50) | Este registro | DOC-03 #49 y QA-05 #46 |

## Protocolo propuesto para QA-04 (#45) — pendiente de acuerdo

Propuesta, no medición. A acordar antes de medir: participantes (al menos dos personas que no
desarrollaron el módulo), conjunto sintético (curso A de `fixtures.sql` ampliado a la cantidad de
grupos acordada), repeticiones (tres por procedimiento, alternando el orden manual/sistema) y
condiciones (mismo equipo y red local). Se cronometra solo el registro de notas y puntos ya
decididos, no la evaluación del contenido. Consulta, reclamos, correo y exportación se revisan contra
sus criterios sin línea base histórica. Se registran todos los resultados, aunque no haya mejora.

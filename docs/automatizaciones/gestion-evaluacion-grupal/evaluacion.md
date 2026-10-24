# Evaluación de la automatización: gestión de evaluación grupal

**Estado del registro:** inventario histórico conservado y capa de alcance vigente pendiente.
Inventario por inspección estática; pruebas locales de QA R4 ejecutadas el 2026-10-24 (ver «Resultados de implementación y pruebas»).

Este documento registra evidencia ejecutada para la Parte II. Una capacidad presente en código o documentación se clasifica como `present-unverified` hasta superar una comprobación reproducible en un entorno aislado. No contiene resultados de producción ni afirma que existan monitoreo, alertas, respaldos o recuperación no verificados.

## Referencias

- Especificación: [`../../../specs/001-manage-group-evaluation/spec.md`](../../../specs/001-manage-group-evaluation/spec.md)
- Plan: [`../../../specs/001-manage-group-evaluation/plan.md`](../../../specs/001-manage-group-evaluation/plan.md)
- Tareas: [`../../../specs/001-manage-group-evaluation/tasks.md`](../../../specs/001-manage-group-evaluation/tasks.md)
- Guía de validación: [`../../../specs/001-manage-group-evaluation/quickstart.md`](../../../specs/001-manage-group-evaluation/quickstart.md)

## Vocabulario de estado

- `verified`: comportamiento ejecutado y respaldado por evidencia reproducible indicada aquí.
- `present-unverified`: existe una implementación candidata, pero aún no se ejecutó toda su aceptación.
- `missing`: la revisión encontró una brecha necesaria.
- `out-of-scope`: decisión explícita de no implementar en Parte II.
- `evaluated`: además de verificarse, cuenta con medición frente al protocolo acordado.

## Alcance vigente y backlog pendiente

Fuente de acuerdos: [consolidado vigente](../../../development/PLAN-REFINAMIENTO-PARTE-I.md),
leído completo, especialmente secciones 4–6. Esta capa no reemplaza ni recalifica la evidencia
histórica que sigue abajo. Las exclusiones iniciales de consulta de notas y reclamos fueron
reemplazadas por acuerdos con el solicitante, no por peticiones iniciales literales del profesor.

**Gestión BK:** el [backlog vigente](../../04-gestion/backlog-y-responsabilidades.md) identifica
BK-01–BK-24. BK-01 registra la sincronización de `specs`, que conserva contradicciones (por ejemplo,
FR-032 y traslado docente FR-013); no usarla como aceptación del nuevo alcance sin sincronizar.
Las historias siguientes describen la situación inspeccionada, no tareas ya completadas:
consulta BK-13, reapertura BK-08, reclamos BK-14–BK-17, correo BK-18 y cálculo/exportación BK-19–BK-20.

| Historia / fuente del caso                          | Estado de alcance vigente                                  | Brecha y aceptación pendiente (no ejecutada aquí)                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta de notas por participantes históricos — §4 | Acordada; missing en consulta estudiantil                  | Panel solo consulta matrícula/puntos; `0029` bloquea lectura. Persistir historia y permitir nota al confirmar registro a participantes de esa actividad, aun tras cambiar de grupo; negar a ajenos. No revertir `0029` ni restaurar permiso por grupo actual de `0028`.                                                                                                                                          |
| Reapertura general de selección — §4                | Acordada; present-unverified para configuración de ventana | Existen ventana y acciones de grupos; comprobar ampliación/reapertura para todo el curso, cupo y cambios del alumno. No exigir traslado directo docente ni categoría automática de solicitud. FR-013 histórico no es obligación nueva.                                                                                                                                                                           |
| Reclamo grupal histórico — §4                       | Acordada; missing en esquema inspeccionado                 | Un reclamo por grupo/evaluación, creado por cualquier participante histórico, visible solo a esos participantes y docente. Probar unicidad concurrente, cambios de grupo y aislamiento.                                                                                                                                                                                                                          |
| Reclamo individual de puntos — §4                   | Acordada; missing en esquema inspeccionado                 | Uno por movimiento propio; privacidad alumno/docente. Probar rechazo de movimiento ajeno y segundo reclamo del mismo registro.                                                                                                                                                                                                                                                                                   |
| Atención final de reclamos — §4                     | Acordada; missing                                          | Pendiente → En revisión → Respondido; motivo y decisión final docente, sin réplica, reapertura ni segundo reclamo. Respuesta favorable no modifica notas/puntos automáticamente; corrección expresa.                                                                                                                                                                                                             |
| Aviso docente de reclamo — §4 y §6                  | Acordada; missing                                          | Correo solo al docente por reclamo nuevo: aviso breve y enlace, sin notas, puntos ni texto. Sin avisos al alumno, recordatorios o escalamiento. Reclamo persiste ante fallo; recuperación por definir.                                                                                                                                                                                                           |
| XLSX histórico por curso — §5                       | Acordada; present-unverified parcial                       | Existe descarga XLSX en `components/teacher/grades/group-grades-table.tsx` basada en grupos y miembros actuales; falta verificar/completar salida por alumno con participación histórica y puntos individuales. No confundir importación de padrón con exportación. Sin consumo/modificación del saldo, bases o compañeros; iguales entradas, iguales resultados académicos. No acta oficial ni integración SUM. |
| Cálculo individual con puntos — §5–6                | Supuesto explícito del equipo; pendiente                   | Igual peso, +1 unidad por punto, distribución automática una sola vez, cap 20 por trabajo. Para `n` notas completas y saldo no negativo: `aplicados = min(saldo, suma(20 - base_i))`; `promedio = (suma(bases) + aplicados) / n`. No sumar saldo a cada trabajo ni otra vez al promedio; conservar excedente sin efecto.                                                                                         |
| Pendientes y precisión XLSX — §5–6                  | Acordada con decisiones abiertas                           | Pendiente en blanco; cero explícito; sin promedio final ajustado completo si falta nota del conjunto incluido; solo redondeo final a dos decimales. No inventar reparto visible por trabajo. Definir columnas, datos mínimos, saldo negativo, movimientos incluidos y precisión de notas base.                                                                                                                   |

También quedan abiertos orden temporal de actividad/cambio coincidentes, reconstrucción de
historia incierta con revisión docente y protocolo de evaluación (participantes, escenarios y
repeticiones). No inventar fechas, línea base histórica, metas numéricas ni eficacia comprobada.
La [arquitectura](../../02-diseno/arquitectura-tecnica.md) y el
[modelo de datos](../../02-diseno/modelo-datos.md) separan implementación y objetivo.

## Inventario inicial de requisitos funcionales

**Lectura histórica:** los estados siguientes corresponden a la especificación anterior, no a la
aceptación vigente. Se preservan FR-004, FR-032 y NFR-010 verificados y sus límites. En particular,
FR-032 verifica la antigua denegación de lectura, que contradice el objetivo actual: no es una
prueba de aceptación de acceso histórico autorizado. No se reejecutó ni reinterpretó.

| Requisito | Estado inicial     | Evidencia o brecha observada                                                                                 |
| --------- | ------------------ | ------------------------------------------------------------------------------------------------------------ |
| FR-001    | present-unverified | Google está configurado en `portfolio-coursse/supabase/config.toml`; falta ejecutar el flujo aislado.        |
| FR-002    | present-unverified | `lib/academic/authorize-current-user.ts` separa rol/autorización; falta batería integral.                    |
| FR-003    | present-unverified | Acciones de periodos y cursos existen; falta verificación completa.                                          |
| FR-004    | verified           | `group_grades_rls.sql` verificó localmente aislamiento docente para notas; otros recursos siguen pendientes. |
| FR-005    | present-unverified | Existen comprobaciones de servidor y políticas RLS; cobertura transversal pendiente.                         |
| FR-006    | present-unverified | Existe importación CSV/XLSX y RPC; vista previa por fila pendiente de confirmar.                             |
| FR-007    | missing            | La acción actual devuelve totales, no estados y razones por fila completos.                                  |
| FR-008    | present-unverified | RPC/importación usa conflictos documentados; falta prueba de repetición equivalente.                         |
| FR-009    | present-unverified | `sync_authorized_student` vincula por correo normalizado; falta caso negativo integral.                      |
| FR-010    | present-unverified | Matrícula y estado existen; falta verificación cruzada completa.                                             |
| FR-011    | present-unverified | Gestión/sincronización de grupos existe; falta aceptación aislada.                                           |
| FR-012    | present-unverified | `select_course_group` y ventana existen; faltan concurrencia y repetición.                                   |
| FR-013    | missing            | No se encontró traslado docente histórico con instante efectivo.                                             |
| FR-014    | missing            | No existe historial de intervalos de pertenencia.                                                            |
| FR-015    | missing            | El grupo actual no preserva por sí solo la historia.                                                         |
| FR-016    | missing            | No existe resolución por instante de actividad.                                                              |
| FR-017    | missing            | Evaluaciones actuales no tienen instante académico.                                                          |
| FR-018    | present-unverified | Evaluaciones y rango 0–20 existen; falta fecha/hora de actividad.                                            |
| FR-019    | missing            | No existe revisión de impacto al cambiar fecha de actividad.                                                 |
| FR-020    | present-unverified | `group_grades` tiene unicidad por grupo/evaluación; falta integridad completa.                               |
| FR-021    | present-unverified | Rango se valida en acción y restricción SQL; falta batería de límites.                                       |
| FR-022    | present-unverified | RLS 0029 valida mismo curso para escrituras autenticadas; falta restricción para otros caminos.              |
| FR-023    | present-unverified | Upsert evita fila duplicada, pero no identifica el intento ni su auditoría.                                  |
| FR-024    | missing            | No se distingue resultado incierto ni recuperación correlacionada.                                           |
| FR-025    | missing            | La nota se sobrescribe sin historial de corrección.                                                          |
| FR-026    | missing            | No hay población histórica por fecha de actividad.                                                           |
| FR-027    | out-of-scope       | La corrección individual está excluida explícitamente de Parte II.                                           |
| FR-028    | present-unverified | Puntos y notas usan entidades y vistas separadas.                                                            |
| FR-029    | present-unverified | Existe anulación no destructiva de puntos; falta reejecutar aceptación.                                      |
| FR-030    | present-unverified | Existen vistas docentes; faltan historia, correcciones y conciliación.                                       |
| FR-031    | present-unverified | Dashboard muestra cursos, grupo y puntos propios; falta prueba integral.                                     |
| FR-032    | verified           | La prueba RLS local documentada niega lectura de notas al alumno tras 0029.                                  |
| FR-033    | missing            | Los estados completos de operación/evaluación no están modelados.                                            |
| FR-034    | missing            | No existe contrato unificado de eventos relevantes.                                                          |
| FR-035    | missing            | Logs actuales no ofrecen correlación y categorías estructuradas completas.                                   |
| FR-036    | missing            | No existe auditoría académica de correcciones.                                                               |
| FR-037    | missing            | No existe conciliación explícita de grupos esperados y calificados.                                          |
| FR-038    | missing            | No existía registro versionado de evidencia antes de este documento.                                         |
| FR-039    | present-unverified | La documentación distingue propuestas y verificaciones; debe mantenerse al ejecutar.                         |

## Inventario inicial no funcional

| Requisito                 | Estado inicial     | Observación                                                                         |
| ------------------------- | ------------------ | ----------------------------------------------------------------------------------- |
| NFR-001 Seguridad         | present-unverified | RLS y servidor existen parcialmente; falta cobertura transversal.                   |
| NFR-002 Privacidad        | present-unverified | La política documental existe; fixtures/evidencia sintética deben comprobarse.      |
| NFR-003 Integridad        | missing            | Historia, corrección y reintento requieren operaciones atómicas nuevas.             |
| NFR-004 Accesibilidad     | present-unverified | No existe auditoría ejecutada de todos los flujos Must.                             |
| NFR-005 Rendimiento       | missing            | No existen mediciones registradas.                                                  |
| NFR-006 Recuperación      | missing            | No existe protocolo probado de resultado incierto/reintento.                        |
| NFR-007 Observabilidad    | missing            | No existen señales verificadas para el proceso completo.                            |
| NFR-008 Mantenibilidad    | present-unverified | Hay separación por módulos; faltan pruebas y contratos completos.                   |
| NFR-009 Entorno seguro    | present-unverified | Supabase local está configurado; debe verificarse antes de cada prueba destructiva. |
| NFR-010 Arquitectura base | verified           | El repositorio usa Next.js, Supabase y PostgreSQL sin servicio adicional.           |

## Evidencia inicial disponible

| Fecha                       | Versión/PR              | Entorno           | Comprobación                                                     | Resultado                                                                                                                          |
| --------------------------- | ----------------------- | ----------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Revisión previa documentada | Migraciones 0001–0029   | Supabase local    | `supabase/tests/group_grades_rls.sql` con identidades sintéticas | Aprobó aislamiento docente, modificación autorizada, rechazo entre cursos y ausencia de lectura estudiantil; no prueba producción. |
| 2026-10-11                  | Árbol de trabajo actual | Revisión estática | Inventario de acciones, migraciones, pruebas y documentación     | Identificó capacidades candidatas y brechas; no convierte `present-unverified` en `verified`.                                      |

## Inspección estática de herramientas disponible en esta actualización

[package.json](../../../portfolio-coursse/package.json) contiene `lint`, `build`, `typecheck`,
`test` (Vitest), `test:e2e` (Playwright) y `test:db` (Supabase). Existen
[configuración Vitest](../../../portfolio-coursse/vitest.config.ts),
[configuración Playwright](../../../portfolio-coursse/playwright.config.ts), una prueba unitaria
de infraestructura y soporte/fixtures. No se encontraron escenarios E2E de aceptación; la prueba
SQL histórica sí existe. La presencia de archivos no demuestra cobertura funcional ni ejecución.

[CI](../../../.github/workflows/ci.yml) declara lint, generación de tipos, TypeScript y build;
no ejecuta esos tres scripts de pruebas. [Release](../../../.github/workflows/release.yml)
declara semantic-release, no despliegue ni aceptación, y no declara dependencia del job CI.
No se consultaron resultados de GitHub Actions ni se ejecutaron scripts, base local o servicios.
Se conserva la evidencia inicial disponible sin elevar estados por inspección estática.

## Resultados de implementación y pruebas

Registro de QA (R4). Solo se anotan como resultados las pruebas **ejecutadas**; lo preparado y no
ejecutado figura como pendiente. Datos sintéticos (`@example.test`), sin secretos ni producción.
Estos resultados no elevan por sí solos los estados del inventario anterior.

### Cómo reproducir

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
pnpm test:node                         # cálculo puro de EXP-02 (Node 24, node:test; Vitest no lo incluye)
```

En Git Bash (Windows) anteponer `MSYS_NO_PATHCONV=1` para que `/tmp/qa` no se convierta en una
ruta de Windows.

Cada script SQL corre en una transacción que termina en `rollback`: no deja datos.

### Conjunto sintético (BASE-02, #11)

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

### Pruebas de capacidades existentes (deben pasar)

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

### Pruebas TDD de reglas pendientes (rojas hasta implementar)

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

### Escenarios preparados sin prueba automatizable aún

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

### Resultados ejecutados

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
| 2026-10-24 | `42a3fd7` | `pnpm test:node` | Rojo hasta EXP-02 | 1 fallo: módulo inexistente | Rojo esperado (EXP-02 #39) |

Defecto confirmado para GRP-02 (#19): `synchronize_course_groups` (migración `0021`) elimina grupos
sin miembros activos y `group_grades.group_id` usa `on delete cascade`; un grupo calificado que queda
vacío tras los traslados pierde sus notas al resincronizar. La corrección corresponde al responsable
de #19; esta prueba debe pasar antes de cerrarla.

### Estado por issue de R4

| Issue | Avance verificable | Bloqueo para cerrar |
| --- | --- | --- |
| BASE-02 (#11) | Datos sintéticos y comprobación inicial reproducibles en local | Revisión de R3 (@MathiMomos) |
| GRP-05 (#22) | Ventana sin configurar/vencida/reabierta, cupo y grupo ajeno: PASS | Historia por actividad (GRP-02 #19 con defecto, GRP-06 #23), GRP-04 #21; revisión R1 |
| EVA-06 (#29) | Registro 0/20, pendiente ≠ 0 y corrección de puntos: PASS | Consulta del alumno (EVA-04 #27, EVA-05 #28), EVA-03 #26, EVA-07 #30 |
| REC-07 (#37) | Escenarios preparados | No existe esquema de reclamos (#31–#36) |
| EXP-04 (#41) | Casos de cálculo preparados | EXP-02 #39, EXP-03 #40 y reglas de EXP-01 #38 |
| QA-04 (#45) | Protocolo propuesto abajo | QA-01–03 (#42–#44) y acuerdo del equipo |
| DOC-04 (#50) | Este registro | DOC-03 #49 y QA-05 #46 |

### Protocolo propuesto para QA-04 (#45) — pendiente de acuerdo

Propuesta, no medición. A acordar antes de medir: participantes (al menos dos personas que no
desarrollaron el módulo), conjunto sintético (curso A de `fixtures.sql` ampliado a la cantidad de
grupos acordada), repeticiones (tres por procedimiento, alternando el orden manual/sistema) y
condiciones (mismo equipo y red local). Se cronometra solo el registro de notas y puntos ya
decididos, no la evaluación del contenido. Consulta, reclamos, correo y exportación se revisan contra
sus criterios sin línea base histórica. Se registran todos los resultados, aunque no haya mejora.


## Comparación con línea base manual

Pendiente. No hay métricas ni resultados todavía.

## Limitaciones actuales

- Producción no fue inspeccionada ni modificada.
- No se ha verificado un proveedor de monitoreo, alertas, respaldos o restauración.
- No se usan datos personales reales ni secretos como evidencia.
- El inventario inicial es una decisión de alcance y no sustituye pruebas de comportamiento.

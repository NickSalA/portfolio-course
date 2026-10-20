# Evaluación de la automatización: gestión de evaluación grupal

**Estado del registro:** inventario histórico conservado y capa de alcance vigente pendiente.
Actualización documental por inspección estática; sin nuevas pruebas ejecutadas.

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

Sin resultados nuevos en esta actualización. Pendiente. Cada fase añadirá aquí comandos, fixture, resultado esperado/observado y referencias seguras.

## Comparación con línea base manual

Pendiente. No hay métricas ni resultados todavía.

## Limitaciones actuales

- Producción no fue inspeccionada ni modificada.
- No se ha verificado un proveedor de monitoreo, alertas, respaldos o restauración.
- No se usan datos personales reales ni secretos como evidencia.
- El inventario inicial es una decisión de alcance y no sustituye pruebas de comportamiento.

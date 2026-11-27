# Backlog del proyecto

Catálogo de **44 issues creadas en GitHub**, asignadas a los cinco usuarios acordados. Las fichas conservan su ID local y el enlace a la Issue real; su creación no significa que el trabajo esté ejecutado. Los nombres completos, estimaciones y fechas exactas siguen pendientes. El [registro de GitHub](github.md) reúne las cinco milestones, las asignaciones y la correspondencia completa.

**Fuentes vigentes:** [caso](../01-definicion/caso-evaluacion-grupal.md), [acuerdos consolidados](../../development/PLAN-REFINAMIENTO-PARTE-I.md) y [objetivos](../../development/02-objetivos.md). Las especificaciones históricas pueden consultarse, pero actualizarlas no es una dependencia del backlog.

## 1. Cómo leerlo

- [Por integrante](por-integrante.md): trabajo de R1–R5, usuario asignado y revisor propuesto de cada ficha.
- [Registro de GitHub](github.md): enlaces reales a milestones e issues.
- [Por milestone](milestones.md): asignación a M1–M4 y entrega posterior.
- [Calendario y contingencia](../04-gestion/calendario-y-contingencia.md): fuente única de periodos, puntos de control y ajustes.
- [Criterios de los hitos](../04-gestion/milestones.md): resultados que deben demostrarse.
- [Equipo y flujo](../04-gestion/equipo-y-flujo-de-trabajo.md): roles, suplencias y revisión cruzada.
- [Gestión del trabajo](../04-gestion/backlog-y-responsabilidades.md): estados, preparación y cierre de historias.

### Al comenzar y completar una issue

1. Si se recibe solo «issue #N», localizar su ID y ficha mediante [github.md](github.md).
2. Leer sus **Antecedentes BASE-01** y la sección enlazada del [inventario](../03-calidad-y-operacion/inventario-capacidades-base-01.md); contrastarlos con el código actual y el caso. Las fichas de documentación/entrega usan el inventario como referencia histórica y la evidencia posterior como fuente de resultados, no como prueba de funcionamiento.
3. Identificar qué se conserva, qué brecha pertenece a la issue y qué queda fuera de alcance. Los antecedentes no añaden dependencias ni amplían automáticamente la aceptación.
4. Al completar, registrar antecedentes resueltos o que ya no aplican, pruebas realmente ejecutadas y pendientes con issue/responsable. En interfaces, separar código existente, navegación identificada, funcionamiento probado y usabilidad comprobada.
5. Mantener pendientes explícitos los recorridos no ejecutados. No modificar el inventario histórico para atribuirle resultados posteriores; registrar nueva evidencia en la documentación de la tarea.

**Seguimiento:** los antecedentes se incorporaron a las fichas locales; no se sincronizan automáticamente con GitHub. Al actualizar una issue remota, trasladar su bloque pertinente y registrar dónde se actualizó el seguimiento. Esta edición documental no cambia estados, asignaciones ni dependencias de GitHub.

## 2. Catálogo por recorrido

| Archivo                                                        | IDs                          | Cantidad | Contenido                                                          |
| -------------------------------------------------------------- | ---------------------------- | -------- | ------------------------------------------------------------------ |
| [01-base-y-acceso.md](01-base-y-acceso.md)                     | BASE-01–BASE-08              | 8        | Verificación de base, acceso, curso, padrón y preparación de aviso |
| [02-grupos-y-participantes.md](02-grupos-y-participantes.md)   | GRP-01–GRP-06                | 6        | Configuración, selección, historia y participantes de actividades  |
| [03-registro-y-consulta.md](03-registro-y-consulta.md)         | EVA-01–EVA-07                | 7        | Notas, puntos, correcciones, consulta y recuperación               |
| [04-reclamos.md](04-reclamos.md)                               | REC-01–REC-07                | 7        | Privacidad, presentación, atención, interfaces y aviso             |
| [05-exportacion.md](05-exportacion.md)                         | EXP-01–EXP-04                | 4        | Decisiones pendientes, cálculo, XLSX y pruebas                     |
| [06-calidad-y-cierre.md](06-calidad-y-cierre.md)               | QA-01–QA-05                  | 5        | Accesibilidad, privacidad, operación, evaluación e integración     |
| [07-documentacion-y-entrega.md](07-documentacion-y-entrega.md) | DOC-01–DOC-04, ENT-01–ENT-03 | 7        | Documentación semanal y preparación posterior de entrega           |

**41 fichas corresponden al desarrollo y documentación de las cuatro semanas; 3 a la preparación posterior del informe y presentación.** Cada autor prueba y documenta su cambio; las fichas DOC consolidan ese trabajo, no lo sustituyen.

## 3. Convenciones de las fichas

Cada ficha contiene:

- **ID estable y título:** identificador local del trabajo, no número de GitHub.
- **Rol:** responsable principal R1–R5, vinculado al usuario asignado en GitHub.
- **Revisor:** persona de otro rol propuesta para revisar, siempre distinta de la autoría efectiva. Si colaboró escribiendo el cambio, se designa otro revisor.
- **Milestone:** hito de aceptación, no necesariamente momento de inicio. Preparación y pruebas de M3 pueden adelantarse desde M1–M2.
- **Prioridad:** las fichas cubren alcance comprometido y aparecen como Alta; el orden real se determina por dependencias y capacidad, no por esa etiqueta sola.
- **Estado:** inicialmente Backlog, incluso cuando exista código candidato.
- **Bloqueado por:** IDs de resultados necesarios para cerrar la ficha. El trabajo de representación o prueba con datos sintéticos puede adelantarse sin declarar completada la integración.
- **Antecedentes BASE-01:** referencia específica al contraste inicial y a las comprobaciones pertinentes, cuando corresponda; no es aceptación ni estado actual garantizado.
- **Tareas, aceptación y documentación:** acciones revisables, resultado verificable y material que debe actualizarse.

No se introducen sprints, fechas límite inventadas, porcentajes de cobertura, tecnologías nuevas ni requisitos del proyecto usado como referencia. Las issues usan etiquetas de rol, área, prioridad y tipo de trabajo; las milestones expresan el hito. El registro de GitHub conserva sus enlaces reales.

## 4. Regla sobre implementación existente

Antes de cambiar una capacidad, verificarla con los criterios del caso vigente:

1. Si cumple, conservarla y registrar la evidencia.
2. Si falla o está incompleta, corregir únicamente la brecha.
3. Si no existe, implementar el resultado descrito con las tecnologías y patrones del proyecto.
4. Ejecutar las pruebas pertinentes y actualizar la documentación antes de cerrar.

La presencia de una pantalla, un script o una migración no equivale a aceptación. Tampoco el estado de tareas antiguas demuestra cumplimiento de requisitos ampliados como notas estudiantiles, reclamos o exportación calculada.

## 5. Reparto inicial y capacidad

| Rol | Usuario asignado | Responsabilidad principal                      | Issues como responsable |
| --- | ---------------- | ---------------------------------------------- | ----------------------- |
| R1  | @NickSalA        | Tech Lead, facilitación, dominio e integración | 11                      |
| R2  | @RobertoPizarro  | Experiencia e interfaces                       | 9                       |
| R3  | @MathiMomos      | Datos, reglas y seguridad                      | 8                       |
| R4  | @fabrizio25504   | Calidad, pruebas y evaluación                  | 7                       |
| R5  | @Forex549        | Seguimiento, comunicaciones y operación        | 9                       |

El número de fichas **no representa horas ni equilibrio de esfuerzo**. R1 suma coordinación a sus tareas; R3 sostiene reglas compartidas y R5 integra dos recorridos en M3. Antes de comprometer la semana se estimará el trabajo restante según disponibilidad, se compartirán apoyos y se aplicará la contingencia cuando corresponda. R4 no es el único que prueba y R1 no es el único que revisa.

## 6. Seguimiento en GitHub

- Usuarios R1–R5 confirmados y issues asignadas; completar nombres personales si se requieren en el informe y confirmar disponibilidad y revisión efectiva.
- Comprobar fechas reales y tiempo reservado después del desarrollo para la entrega.
- Revisar tamaño de cada ficha: dividirla si no es revisable o supera la capacidad, conservando trazabilidad del ID original.
- Se crearon primero las cinco milestones y después las 44 issues (#10–#53); se registraron 80 dependencias nativas. Mantener los enlaces y asignaciones actualizados, sin crear duplicados.
- Usar los estados de planificación Backlog, Ready, In progress, In review y Done conforme a los criterios de gestión. Las issues están abiertas y parten de Backlog; no se creó ni configuró un Project con esas columnas.
- Mantener los criterios y estados en las fichas o su Issue vinculada, con enlaces desde estos índices; no crear listas divergentes por persona.

Las dependencias académicas pendientes se resuelven como decisiones explícitas del equipo, no mediante fórmulas inventadas. El supuesto de puntos y su condición revisable deben permanecer identificados.

## 7. Correspondencia con el listado BK anterior

La lista anterior BK-01–BK-24 queda reemplazada como planificación activa. No se mantienen dos backlogs en paralelo. Los estados históricos no se trasladan a estas fichas como Done.

| Referencia anterior | Fichas actuales                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------- |
| BK-01               | Retirada de la ejecución: actualizar especificaciones antiguas no es condición para comenzar |
| BK-02               | EXP-01 y GRP-06                                                                              |
| BK-03               | BASE-01–BASE-03                                                                              |
| BK-04               | BASE-07, GRP-01, GRP-04, EVA-03, EVA-05 y REC-04–REC-05                                      |
| BK-05               | BASE-03 y EVA-04                                                                             |
| BK-06               | BASE-04–BASE-06                                                                              |
| BK-07–BK-08         | GRP-01, GRP-03–GRP-05                                                                        |
| BK-09               | GRP-02 y GRP-06                                                                              |
| BK-10               | EVA-01 y EVA-03                                                                              |
| BK-11               | EVA-02                                                                                       |
| BK-12               | EVA-07 y QA-02                                                                               |
| BK-13               | EVA-04–EVA-06                                                                                |
| BK-14–BK-15         | REC-01–REC-02 y REC-04                                                                       |
| BK-16               | REC-03 y REC-05                                                                              |
| BK-17               | REC-01 y REC-07                                                                              |
| BK-18               | BASE-08 y REC-06–REC-07                                                                      |
| BK-19–BK-20         | EXP-01–EXP-04                                                                                |
| BK-21               | QA-01–QA-02                                                                                  |
| BK-22               | QA-02–QA-03                                                                                  |
| BK-23               | QA-04                                                                                        |
| BK-24               | QA-05, DOC-01–DOC-04 y ENT-01–ENT-03                                                         |

## 8. Límites del compromiso

El alcance es registro y seguimiento de evaluaciones, con funciones de apoyo acordadas. No se agregan recepción de tareas, actas oficiales, integración SUM, mensajería general, apelaciones, correos al alumno o un LMS completo. La exportación no consume puntos ni cambia notas base y la visibilidad del alumno se limita a los resultados que le corresponden.

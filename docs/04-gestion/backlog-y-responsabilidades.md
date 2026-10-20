# Gestión del backlog y responsabilidades

## 1. Fuente del trabajo

El catálogo activo está en **[docs/backlog/](../backlog/README.md)**. Allí se mantienen las fichas, el [índice por integrante](../backlog/por-integrante.md), la [asignación por milestone](../backlog/milestones.md) y la correspondencia con los BK anteriores. Este documento conserva las reglas de preparación, seguimiento y cierre; no duplica el listado de issues.

Las 44 fichas están [creadas y asignadas en GitHub](../backlog/github.md) con sus URLs reales. Estado de ejecución y asignación se actualizan en la Issue vinculada, conservando el ID local y sin mantener listas divergentes. La creación no declara completados sus criterios.

El alcance procede del [caso vigente](../01-definicion/caso-evaluacion-grupal.md) y de los acuerdos en [development/](../../development/PLAN-REFINAMIENTO-PARTE-I.md). Las especificaciones históricas son antecedente, no un paso obligatorio antes de desarrollar. BK-01 queda fuera de la ejecución activa.

## 2. Equipo y asignación

La fuente de organización es [Equipo y flujo de trabajo](equipo-y-flujo-de-trabajo.md): cinco roles, suplencias y revisión cruzada. R1 ejerce liderazgo técnico y facilitación; no se impone Scrum como metodología ni se concentra en esa persona toda la implementación o aprobación.

- Cada issue tiene responsable y revisor distinto de su autoría efectiva.
- El responsable implementa o verifica el resultado, prueba su cambio y actualiza documentación; puede recibir apoyo de otros roles.
- Si el revisor propuesto también escribió el cambio, debe designarse otro integrante.
- No se aprueba un PR propio. La integración respeta la constitución y los checks aplicables.
- Las responsabilidades pueden ajustarse al planificar la semana, dejando constancia en la ficha y el índice por integrante.
- Los usuarios de R1–R5 ya están confirmados y asignados; los nombres personales y las horas disponibles deben completarse antes de comprometer la carga. Igualar cantidades de issues no demuestra equilibrio de esfuerzo.

## 3. Planificación por hitos

El [calendario](calendario-y-contingencia.md) establece cuatro semanas con pruebas y documentación en cada una y preparación final de entrega después, dentro del plazo del curso. Los [criterios M1–M4](milestones.md) definen los resultados; [backlog/milestones.md](../backlog/milestones.md) asigna las fichas a cada hito.

El milestone indica cuándo se acepta la integración, no que toda preparación comience esa semana. Se adelantan configuración del aviso, decisiones de exportación, representaciones y casos de prueba para evitar concentrar todo M3 al final. La evaluación integrada no sustituye las pruebas de cada función.

Si una función existe, se comprueba primero y se conserva lo que cumpla. Si falta o falla, se completa la brecha. No se reinicia todo el proyecto ni se cierran fichas por equivalencia con una tarea antigua.

## 4. Campos de seguimiento

| Campo                   | Uso                                                          |
| ----------------------- | ------------------------------------------------------------ |
| ID local y URL de Issue | Trazabilidad; URL solo después de crear la Issue real        |
| Estado                  | Backlog, Ready, In progress, In review o Done                |
| Responsable y revisor   | Rol y, cuando se acuerde, integrante concreto                |
| Milestone               | M1–M4 o Entrega posterior                                    |
| Prioridad               | Alta, media o baja; secuencia según dependencias y capacidad |
| Dependencias            | IDs de resultados necesarios para aceptar la ficha           |
| Estimación              | Esfuerzo pendiente por acordar, sin cifras ficticias         |
| Evidencia               | Referencia a cambios, casos ejecutados y documentación       |
| Bloqueo                 | Causa, impacto, responsable de resolverlo y siguiente acción |

Estos campos describen el seguimiento propuesto; no acreditan un GitHub Project configurado. Si la tarea se divide, las nuevas fichas deben conservar la relación con su origen y actualizar índices y dependencias.

## 5. Estados y preparación

- **Backlog:** necesidad identificada; puede requerir definición, verificación o desarrollo.
- **Ready:** resultado, criterios, dependencias, responsable/revisor y decisiones necesarias suficientemente definidos para empezar.
- **In progress:** trabajo activo con una rama cuando corresponde y estado actualizado.
- **In review:** cambio o resultado disponible con pruebas y documentación para una revisión independiente.
- **Done:** criterios comprobados, revisión resuelta, cambios integrados cuando corresponde y evidencia/documentación actualizadas.

Una ficha pasa a Ready cuando se puede ejecutar sin inventar reglas académicas ni depender de información inaccesible. Si una decisión sigue abierta, se registra y resuelve, o se acuerda explícitamente la exclusión del caso; no se oculta como detalle de programación.

## 6. Definición de cierre

- [ ] Se verificaron los criterios de aceptación de la ficha y los casos de error pertinentes.
- [ ] Se conservó la capacidad existente que cumplía y se modificó solo lo necesario.
- [ ] Una persona distinta de la autoría revisó y se resolvieron sus observaciones.
- [ ] Los PR y checks aplicables cumplen el flujo del repositorio; los resultados no se suponen por existir scripts.
- [ ] Los cambios de datos, si los hay, se agregaron mediante migraciones nuevas y sin ejecutar pruebas destructivas en producción.
- [ ] Se registraron fecha, versión, datos sintéticos, esperado, observado y limitaciones de las comprobaciones pertinentes.
- [ ] Documentación e índices reflejan cambios de reglas o asignaciones.
- [ ] No se incluyen secretos, datos académicos reales ni reclamos privados en evidencia pública.
- [ ] Los pendientes que impiden el criterio de aceptación no se presentan como completados.

Las tareas exclusivamente documentales requieren comprobación de contenido, enlaces y coherencia; no se les atribuyen pruebas funcionales no ejecutadas. Los defectos hallados se corrigen con el responsable de la función y se vuelven a probar antes de cerrar lo que bloqueen.

## 7. Coordinación semanal

La planificación, el seguimiento de bloqueos, la demostración y la documentación siguen [Equipo y flujo](equipo-y-flujo-de-trabajo.md) y el calendario. Las fichas DOC-01–DOC-04 consolidan los aportes semanales; no trasladan toda la responsabilidad documental a una sola persona.

El informe y el PowerPoint finales se preparan en ENT-01–ENT-03 después del desarrollo. Su duración debe reservarse antes de la entrega oficial. Si no cabe el alcance, se activa la contingencia con un acuerdo explícito; no se eliminan privacidad, pruebas o documentación para declarar un hito terminado.

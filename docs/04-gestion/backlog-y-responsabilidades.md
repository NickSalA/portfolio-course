# Backlog y responsabilidades del equipo

## Propósito

Este documento define cómo un equipo de cinco personas convierte necesidades en Issues, distribuye el trabajo y verifica su cierre. Los nombres y asignaciones concretas deben acordarse con el grupo y registrarse aquí; hasta entonces, los identificadores `Integrante 1`–`Integrante 5` son vacantes, no asignaciones reales.

La [constitución](../../.specify/memory/constitution.md) y [`CONTRIBUTING.md`](../../CONTRIBUTING.md) gobiernan ramas, PR, commits y releases. GitHub Issues es la fuente de verdad del trabajo ejecutable y GitHub Projects ofrece su vista operativa.

## Responsabilidades para cinco integrantes

Cada integrante mantiene una responsabilidad primaria, pero puede implementar tareas de otra área. La responsabilidad indica quién cuida la coherencia y verifica que el trabajo no quede sin atender; no crea silos ni reemplaza la revisión cruzada.

| Integrante | Responsabilidad primaria | Responsabilidades principales | Revisión cruzada recomendada |
| --- | --- | --- | --- |
| Integrante 1 | Coordinación y dominio | Priorizar backlog, aclarar alcance y criterios, validar reglas académicas, coordinar entregas y mantener trazabilidad con el trabajo final. | Revisa funcionalidad y documentación; no aprueba su propio PR. |
| Integrante 2 | Aplicación y experiencia | Implementar UI y flujos Next.js, accesibilidad, estados de carga/error y validación manual de la experiencia docente/alumno. | Revisado por dominio y calidad. |
| Integrante 3 | Datos y seguridad | Mantener migraciones, funciones/RPC, integridad, autenticación, autorización y políticas RLS. | Revisado por arquitectura o calidad; cambios sensibles requieren atención del aprobador. |
| Integrante 4 | Calidad y automatización | Mantener pruebas, fixtures sintéticos, CI, criterios de aceptación, evidencia reproducible y prevención de regresiones. | Revisa cambios de aplicación y datos desde la perspectiva de prueba. |
| Integrante 5 | Operación y documentación | Mantener releases, observabilidad, recuperación, documentación técnica, evaluación e insumos del informe/presentación. | Revisado por dominio y por la persona técnicamente responsable del cambio. |

### Reglas compartidas

- Cada Issue tiene una persona responsable y, antes de pasar a `In review`, una persona revisora distinta.
- La persona responsable implementa, actualiza documentación y aporta evidencia; no significa que deba realizar todo sin colaboración.
- El aprobador definido por el equipo integra los PR después de la revisión y de CI. GitHub no permite aprobar el PR propio, por lo que debe existir revisión cruzada.
- Los roles pueden rotar por iteración para repartir aprendizaje y carga. Todo cambio de responsables se actualiza en este documento y en GitHub.
- Ningún integrante comparte secretos, datos personales o evidencias académicas identificables en Issues, PR, logs o documentos públicos.

## División del backlog

El backlog se divide por resultados verificables, no por archivos o capas técnicas aisladas:

1. **Gestión y gobernanza:** acuerdos, ramas, revisiones y trazabilidad.
2. **Proceso académico:** reglas y automatización de cursos, grupos, evaluaciones y notas.
3. **Aplicación y experiencia:** interacción docente/alumno, accesibilidad y manejo de estados.
4. **Datos y seguridad:** modelo, migraciones, integridad, RLS y autorización.
5. **Calidad:** pruebas, CI, casos válidos, inválidos y excepcionales.
6. **Operación:** monitoreo, alertas, despliegue, respaldo y recuperación.
7. **Evidencia y entregables:** métricas, evaluación, informe, presentación y anexos.

Una Issue puede involucrar varias áreas, pero debe tener un único resultado principal. Si requiere varios PR independientes o más de una iteración, se divide en Issues relacionadas.

## Campos del GitHub Project

| Campo | Valores o uso |
| --- | --- |
| Status | `Backlog`, `Ready`, `In progress`, `In review`, `Done` |
| Priority | `High`, `Medium`, `Low` |
| Area | Una de las siete áreas anteriores |
| Owner | Persona responsable de conducir la Issue |
| Reviewer | Persona distinta que revisará el resultado |
| Delivery | `Parte I`, `Parte II`, `Operación` o `No aplica` |
| Target date | Fecha comprometida solo cuando exista acuerdo |

### Criterios de estado

- **Backlog:** necesidad identificada, todavía no preparada o priorizada.
- **Ready:** alcance, criterios de aceptación, dependencias y responsable están definidos.
- **In progress:** existe trabajo activo y una rama vinculada.
- **In review:** hay PR abierto, evidencia disponible y revisor asignado.
- **Done:** PR integrado, CI aprobado, criterios verificados y documentación/evidencia actualizadas.

## Priorización

- **High:** bloquea la entrega, protege datos/autorización o habilita otras tareas.
- **Medium:** necesaria para completar operación o evaluación, pero no bloquea el siguiente trabajo inmediato.
- **Low:** mejora útil sin compromiso de entrega actual.

Ante prioridades iguales, se atienden primero seguridad e integridad, luego dependencias, valor del proceso académico y reducción de riesgo. La prioridad no sustituye una fecha acordada.

## Definition of Ready

Una Issue pasa a `Ready` cuando:

- [ ] Explica el problema, el resultado esperado y el valor para el proceso.
- [ ] Tiene alcance y fuera de alcance suficientemente claros.
- [ ] Incluye criterios de aceptación observables.
- [ ] Declara dependencias, riesgos y restricciones conocidas.
- [ ] Tiene prioridad, área, responsable y revisor propuesto.
- [ ] Enlaza especificaciones o documentación relevante.
- [ ] Puede completarse sin asumir datos, secretos o decisiones no disponibles.

## Definition of Done

Una Issue pasa a `Done` cuando:

- [ ] Sus criterios de aceptación fueron comprobados.
- [ ] El PR está aprobado e integrado y las conversaciones están resueltas.
- [ ] Los checks relevantes de CI pasan.
- [ ] Se probaron casos válidos, inválidos y excepcionales aplicables.
- [ ] Los cambios de base de datos están en migraciones nuevas y versionadas.
- [ ] La documentación y la evaluación se actualizaron si cambió el comportamiento o su evidencia.
- [ ] La evidencia indica fecha, versión/PR, entorno y resultado, usando datos sintéticos o anonimizados.
- [ ] No se presentan funcionalidades, métricas o controles pendientes como implementados.

## Ceremonia mínima

- **Refinamiento semanal:** revisar nuevas Issues, dividir trabajo grande y mover a `Ready` solo lo preparado.
- **Seguimiento breve:** cada responsable actualiza estado, bloqueos y siguiente paso en GitHub Project.
- **Revisión:** comprobar PR contra criterios de aceptación, seguridad, integridad, pruebas y documentación.
- **Cierre de iteración:** revisar trabajo terminado, evidencia obtenida y cambios necesarios en prioridad o alcance.

No es obligatorio realizar reuniones adicionales si el equipo mantiene estas decisiones y evidencias actualizadas de forma asíncrona.

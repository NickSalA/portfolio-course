# Documentación del proyecto

Esta carpeta reúne la documentación del proyecto y del trabajo final. El código de la aplicación está en [`../portfolio-coursse/`](../portfolio-coursse/), y las reglas de gobernanza e ingeniería se encuentran en [`../.specify/memory/constitution.md`](../.specify/memory/constitution.md). Los documentos describen decisiones y evidencia disponible; no certifican por sí solos que una migración, un control operativo o un despliegue se haya ejecutado en producción.

## Alcance vigente y cómo empezar

El proyecto se centra en **registro y seguimiento de evaluaciones grupales**. El [caso vigente](01-definicion/caso-evaluacion-grupal.md) incluye consulta inmediata de notas propias y puntos, reclamos con respuesta docente, aviso por correo y exportación XLSX. La aplicación individual de puntos al exportar es un supuesto del equipo.

El [backlog funcional](04-gestion/backlog-y-responsabilidades.md#backlog-funcional-vigente) contiene 24 historias BK con prioridad, criterios, dependencias y área propuesta. Todas parten de Backlog; primero se verifica la implementación candidata y se sincronizan las especificaciones anteriores. No representa Issues ya creadas ni resultados ejecutados.

Las especificaciones de `specs/001-manage-group-evaluation/` todavía conservan exclusiones anteriores. BK-01 registra su sincronización antes de implementar: no se debe confundir el alcance acordado con el código o la evidencia histórica. El [estado actual](03-calidad-y-operacion/estado-actual.md) y la [evaluación](automatizaciones/gestion-evaluacion-grupal/evaluacion.md) mantienen esa distinción.

El material académico está en [development/](../development/README.md); allí se explica la propuesta sin detalles técnicos. `docs/` conserva contexto de producto, diseño, gestión y evidencia de ingeniería.

## Índice

| Área                     | Referencias                                                                                                                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01 · Definición          | [Proyecto](01-definicion/documento-proyecto.md) · [Caso: evaluación grupal](01-definicion/caso-evaluacion-grupal.md) · [Glosario](01-definicion/glosario.md)                                             |
| 02 · Diseño              | [Arquitectura técnica](02-diseno/arquitectura-tecnica.md) · [Modelo de datos](02-diseno/modelo-datos.md)                                                                                                 |
| 03 · Calidad y operación | [Estado actual](03-calidad-y-operacion/estado-actual.md) · [Indicadores y CI/CD](03-calidad-y-operacion/indicadores-y-ci-cd.md) · [Controles operativos](03-calidad-y-operacion/controles-operativos.md) |
| 04 · Gestión             | [Equipo y flujo de trabajo](04-gestion/equipo-y-flujo-de-trabajo.md) · [Backlog y responsabilidades](04-gestion/backlog-y-responsabilidades.md)                                                          |
| 05 · Entregables         | [Trabajo final del curso](05-entregables/trabajo-final.md)                                                                                                                                               |

Para contribuir, consulta [`../CONTRIBUTING.md`](../CONTRIBUTING.md), la [plantilla de Issue](../.github/ISSUE_TEMPLATE/tarea.yml) y la [plantilla de PR](../.github/pull_request_template.md). Los workflows de CI y semantic-release están en [`../.github/workflows/`](../.github/workflows/).

Las especificaciones previas de funcionalidades siguen en [`../portfolio-coursse/docs/`](../portfolio-coursse/docs/). La evaluación de una automatización completada se documenta en `docs/automatizaciones/<nombre-del-proceso>/evaluacion.md`, distinguiendo lo planeado de lo implementado y probado.

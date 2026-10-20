# Documentación del proyecto

Esta carpeta reúne la documentación del proyecto y del trabajo final. El código de la aplicación está en [`../portfolio-coursse/`](../portfolio-coursse/), y las reglas de gobernanza e ingeniería se encuentran en [`../.specify/memory/constitution.md`](../.specify/memory/constitution.md). Los documentos describen decisiones y evidencia disponible; no certifican por sí solos que una migración, un control operativo o un despliegue se haya ejecutado en producción.

## Alcance vigente y cómo empezar

El proyecto se centra en **registro y seguimiento de evaluaciones grupales**. El [caso vigente](01-definicion/caso-evaluacion-grupal.md) incluye consulta inmediata de notas propias y puntos, reclamos con respuesta docente, aviso por correo y exportación XLSX. La aplicación individual de puntos al exportar es un supuesto del equipo.

La planificación parte de los [hitos M1–M4](04-gestion/milestones.md) y del [calendario y contingencia](04-gestion/calendario-y-contingencia.md): cuatro semanas de desarrollo y evaluación con documentación semanal, y preparación final de entrega después, dentro del plazo del curso. Las fechas exactas y la capacidad del equipo siguen por acordar.

El [backlog](backlog/README.md) contiene 44 fichas de issues con responsable, revisor, milestone, dependencias y aceptación: 41 para desarrollo/documentación de las cuatro semanas y 3 para entrega posterior. Se pueden consultar [por integrante](backlog/por-integrante.md) y [por milestone](backlog/milestones.md). Las 44 issues están [creadas y asignadas en GitHub](backlog/github.md), con cinco milestones y dependencias nativas; quedan pendientes estimaciones y fechas exactas. El listado BK anterior queda reemplazado con correspondencia histórica, sin exigir actualizar especificaciones antiguas.

Las especificaciones antiguas pueden consultarse como referencia, pero los acuerdos consolidados y el caso vigente orientan el alcance actual. No se debe confundir ese alcance con el código o la evidencia histórica. El [estado actual](03-calidad-y-operacion/estado-actual.md) y la [evaluación](automatizaciones/gestion-evaluacion-grupal/evaluacion.md) mantienen esa distinción.

El material académico está en [development/](../development/README.md); allí se explica la propuesta sin detalles técnicos. `docs/` conserva contexto de producto, diseño, gestión y evidencia de ingeniería.

## Primer arranque del equipo

Seguir la [guía de aplicación y Supabase local](03-calidad-y-operacion/entorno-de-pruebas-supabase.md): cada integrante usa su propia base y `.env.local`; el cliente OAuth de desarrollo se configura de forma privada. La guía explica también cómo habilitar cuentas docentes/alumnos y aplicar migraciones sin usar producción.

## Índice

| Área                     | Referencias                                                                                                                                                                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01 · Definición          | [Proyecto](01-definicion/documento-proyecto.md) · [Caso: evaluación grupal](01-definicion/caso-evaluacion-grupal.md) · [Glosario](01-definicion/glosario.md)                                                                                                                             |
| 02 · Diseño              | [Arquitectura técnica](02-diseno/arquitectura-tecnica.md) · [Modelo de datos](02-diseno/modelo-datos.md)                                                                                                                                                                                 |
| 03 · Calidad y operación | [Guía de inicio local](03-calidad-y-operacion/entorno-de-pruebas-supabase.md) · [Estado actual](03-calidad-y-operacion/estado-actual.md) · [Indicadores y CI/CD](03-calidad-y-operacion/indicadores-y-ci-cd.md) · [Controles operativos](03-calidad-y-operacion/controles-operativos.md) |
| 04 · Gestión             | [Equipo y flujo de trabajo](04-gestion/equipo-y-flujo-de-trabajo.md) · [Hitos](04-gestion/milestones.md) · [Calendario y contingencia](04-gestion/calendario-y-contingencia.md) · [Backlog y responsabilidades](04-gestion/backlog-y-responsabilidades.md)                               |
| Backlog                  | [Catálogo](backlog/README.md) · [Por integrante](backlog/por-integrante.md) · [Por milestone](backlog/milestones.md)                                                                                                                                                                     |
| 05 · Entregables         | [Trabajo final del curso](05-entregables/trabajo-final.md)                                                                                                                                                                                                                               |

Para contribuir, consulta [`../CONTRIBUTING.md`](../CONTRIBUTING.md), la [plantilla de Issue](../.github/ISSUE_TEMPLATE/tarea.yml) y la [plantilla de PR](../.github/pull_request_template.md). Los workflows de CI y semantic-release están en [`../.github/workflows/`](../.github/workflows/).

La evaluación de una automatización completada se documenta en `docs/automatizaciones/<nombre-del-proceso>/evaluacion.md`, distinguiendo lo planeado de lo implementado y probado.

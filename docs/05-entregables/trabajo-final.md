# Trabajo final: Automatización y Control de Software

Esta guía de entregables se basa en el PDF proporcionado para el curso 2026-2. No sustituye el texto oficial ni constituye por sí sola una especificación de funcionalidad. La documentación de `docs` puede conservar detalle técnico para apoyar implementación, pruebas y operación; el informe académico desarrolla el caso y sus resultados sin convertirse en un inventario del repositorio.

## Proyecto y objetivos

El proyecto completo es una plataforma de gestión académica para el **registro y seguimiento de evaluaciones grupales** en los cursos del docente del caso de estudio. Según el relato del solicitante, el docente recibía del SUM un XLSX de alumnos, preparaba su registro de notas y llevaba grupos y puntos por separado. La carga del padrón es una entrada de apoyo, no una importación de calificaciones.

Los [objetivos completos](../../development/02-objetivos.md) son:

- **General:** desarrollar una plataforma de gestión académica para el registro y seguimiento de las evaluaciones grupales en los cursos del docente del caso de estudio.
- **OE1:** analizar el proceso actual de registro y seguimiento de las evaluaciones grupales para identificar las necesidades de los docentes y estudiantes.
- **OE2:** diseñar el funcionamiento de la plataforma a partir de los requisitos y las reglas del proceso de evaluación.
- **OE3:** implementar las funciones de registro y seguimiento de las evaluaciones grupales y las funciones de apoyo necesarias para su operación.
- **OE4:** evaluar la contribución de la plataforma al registro y seguimiento de las evaluaciones grupales mediante pruebas de funcionamiento e indicadores acordados.

La consulta de resultados propios y los reclamos integran el seguimiento; no se propone seguimiento integral del aprendizaje. Padrón, acceso, matrícula y selección de grupos son funciones de apoyo, no objetivos independientes. CI/CD es un control complementario de calidad, no el proceso principal a evaluar.

## Alcance que debe reflejarse en la entrega

Los [acuerdos del plan de refinamiento](../../development/PLAN-REFINAMIENTO-PARTE-I.md) se reflejan en el [caso vigente](../01-definicion/caso-evaluacion-grupal.md) y en el [backlog BK-01–BK-24](../04-gestion/backlog-y-responsabilidades.md). La sincronización de las especificaciones externas anteriores sigue pendiente mediante BK-01; la actualización documental no certifica implementación. No presentar esos artefactos antiguos como validación de exclusiones reemplazadas ni los acuerdos nuevos como funciones ya operativas.

La entrega debe mantener coherencia con estas reglas:

- El docente registra notas de 0 a 20 por grupo/evaluación y puntos individuales. Tras confirmar el registro, cada alumno consulta inmediatamente sus puntos y las notas de las actividades en las que participó, sin publicación posterior. Cambiar de grupo conserva la atribución histórica y no habilita acceso a resultados o reclamos ajenos. Vacío significa pendiente; cero es una nota expresa.
- Cualquier participante histórico puede presentar el único reclamo de su grupo para una evaluación; lo consultan los participantes de esa actividad y el docente. El reclamo sobre un movimiento propio de puntos es único y privado entre alumno y docente. Estados: **Pendiente → En revisión → Respondido**, con decisión docente final motivada, sin duplicado, réplica ni reapertura. Una respuesta favorable no corrige automáticamente el registro: el docente realiza el cambio expresamente.
- Cada reclamo nuevo genera un correo al docente con aviso breve y enlace, sin notas, puntos ni texto del reclamo. La atención permanece en la plataforma; no se añaden avisos al alumno, recordatorios ni escalamiento. El reclamo se conserva si falla el correo; la recuperación detallada requiere definición.
- La exportación XLSX es por curso, con notas históricamente atribuibles a cada alumno, puntos y resultados calculados. No integra el sistema con el SUM ni equivale a un acta oficial.
- La aplicación de puntos es un **supuesto de trabajo del equipo, no confirmado por el profesor**: distribución automática, trabajos de igual peso, una unidad de nota por punto donde haya margen hasta 20 por trabajo, sin repetir puntos ni alterar notas base o resultados de compañeros. El excedente se conserva sin efecto adicional. Exportar no consume ni modifica el saldo y mantiene resultados académicos con iguales entradas. Las notas pendientes quedan vacías y no se presenta un promedio final ajustado completo si faltan notas; el promedio se redondea solo al final a dos decimales. Saldo negativo, movimientos incluidos, precisión de notas y columnas definitivas siguen pendientes.

La consulta de notas y los reclamos son ampliaciones acordadas con el solicitante, no peticiones iniciales literales atribuidas al profesor. La plataforma no recibe tareas ni gestiona sus plazos de entrega.

## Qué debe poder demostrarse

- Un proceso real susceptible de automatización y necesidades de docentes y estudiantes identificadas.
- Automatización de actividades repetitivas, condiciones de control y validaciones de registro y seguimiento.
- Autorización por curso y participación histórica: permitir consulta propia y negar acceso ajeno, con privacidad de reclamos de puntos.
- Gestión de eventos y excepciones, estados, correcciones expresas y reintentos sin duplicación.
- Exactitud de la exportación y separación entre notas base, puntos y resultados calculados.
- Evidencias reproducibles de pruebas, errores, señales y evaluación, distinguiendo diseño, configuración inspeccionada, implementación y ejecución verificada.
- Buenas prácticas y justificación de arquitectura aplicada al caso, sin asumir que hace falta un servidor independiente.

## Entregas

| Momento              | Propósito                                                            | Material indicado en la guía                     |
| -------------------- | -------------------------------------------------------------------- | ------------------------------------------------ |
| Semana 8 · Parte I   | Análisis, diseño y prototipo.                                        | Avance, informe y presentación PowerPoint.       |
| Semana 16 · Parte II | Continuar la primera parte con implementación, pruebas y evaluación. | Avance final, informe y presentación PowerPoint. |

Son hitos del mismo proyecto, no objetivos distintos ni una repetición de la primera entrega. El informe final contiene carátula, índice, introducción, objetivos, marco teórico (definición del componente, problemas que resuelve, ventajas/desventajas, cuándo usarlo y conceptos relacionados), caso de aplicación, resultados, conclusiones y recomendaciones, bibliografía APA 7 y anexos. La guía valora redacción, ortografía, presentación y aplicación de la tendencia arquitectónica al caso, y no acepta entregas fuera de plazo.

## Evaluación y relación con la documentación técnica

Los [indicadores y CI/CD](../03-calidad-y-operacion/indicadores-y-ci-cd.md) separan evaluación académica de checks técnicos, y los [controles operativos](../03-calidad-y-operacion/controles-operativos.md) orientan permisos, pruebas, señales y recuperación. La inspección estática confirma workflows de CI y release y scripts de pruebas, pero no acredita checks aprobados ni despliegues. La constitución y los artefactos técnicos guían la ingeniería; deben sincronizarse con las reglas vigentes antes de usarlos como criterios definitivos.

La evaluación del tiempo comparará tareas equivalentes mediante un procedimiento manual **simulado** y la plataforma, con participantes, repeticiones y condiciones previamente definidos. No existe una línea base histórica de tiempos del docente; una posible reducción es hipótesis del equipo. La consulta, los reclamos, el correo y la exportación se revisan contra resultados funcionales esperados, sin inventar una línea base de seguimiento o reducciones de reclamos. No hay metas acordadas del 50 % ni de dos segundos.

La [evaluación del proceso](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md) debe reunir implementación, pruebas y resultados realmente observados, con versión, fecha, entorno, esperado/observado y limitaciones, usando datos sintéticos o anonimizados. Servirá de insumo al informe y la presentación; no presentar indicadores propuestos, supuestos o configuraciones como eficacia demostrada.

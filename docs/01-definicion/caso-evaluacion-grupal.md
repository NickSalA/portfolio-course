# Caso: registro y seguimiento de evaluaciones grupales

**Estado:** alcance funcional acordado con el responsable del proyecto. Describe el producto objetivo, no su grado de implementación. El [backlog vigente](../04-gestion/backlog-y-responsabilidades.md) organiza su desarrollo y verificación.

## Origen y problema

En el caso de un docente de la UNMSM, el SUM proporciona un XLSX con alumnos. El profesor prepara su propia plantilla de notas. Para calificar un trabajo identifica a los integrantes en el entregable, los busca individualmente y anota la misma nota uno por uno. Los alumnos no disponían de un registro consultable de puntos durante el ciclo salvo sus propias anotaciones.

Esta descripción procede del relato del responsable del proyecto, no de una entrevista formal o medición nueva. El tiempo de registro es una dimensión de evaluación propuesta por este responsable; el profesor no confirmó una demora cuantificada como problema principal.

El proceso seleccionado reúne **registro** de notas y **seguimiento** mediante consulta de resultados y reclamos. La incorporación de alumnos, el acceso y la selección de grupos son funciones de apoyo. La validación de información y la atención de solicitudes también son automatizaciones, pero no proyectos independientes ni objetivos adicionales por defecto.

## Objetivo y pregunta

**Objetivo general:** desarrollar una plataforma de gestión académica para el registro y seguimiento de las evaluaciones grupales en los cursos del docente del caso de estudio.

**Pregunta:** ¿en qué medida el uso de una plataforma de gestión académica contribuye a mejorar el registro y seguimiento de las evaluaciones grupales en los cursos del docente del caso de estudio?

Los [objetivos académicos](../../development/02-objetivos.md) comprenden analizar, diseñar, implementar y evaluar. El [informe académico](../../development/README.md) desarrolla el caso en lenguaje funcional; `docs/` conserva además contexto de ingeniería y evidencia.

## Entradas y frontera

- **Preparación:** periodo, curso bajo responsabilidad de un docente, alumnado autorizado y matrícula vinculada a la identidad correcta. El archivo SUM incorpora alumnos, nunca notas.
- **Registro:** actividad identificada y fechada, participantes correspondientes, una nota de 0 a 20 por grupo y evaluación y correcciones explicables.
- **Seguimiento:** consulta de resultados propios al registrarse, presentación de reclamos, estados, aviso al docente y respuesta final.
- **Salida docente:** XLSX por curso con notas por alumno, puntos y cálculo individual acordado; no integración con el SUM ni acta oficial.

No se reciben entregables ni se gestionan sus plazos. El docente evalúa el contenido fuera de la plataforma y decide la nota.

## Organización de grupos y atribución

El docente define número, capacidad y ventana de selección. Los alumnos eligen y cambian de grupo con ventana abierta y cupo disponible. Ante una necesidad posterior, el docente puede ampliar o reabrir la ventana para **todo el curso**. No se exige un permiso individual de selección ni se incorpora un traslado directo docente como obligación de este alcance. El canal de petición de reapertura no forma parte del módulo de reclamos académicos por defecto.

La nota corresponde al grupo de la **fecha de realización de la actividad**, no al grupo actual ni a la fecha de guardado. La misma regla gobierna consultas, correcciones, reclamos y exportación. Si el alumno realizó T1 con A y luego pasó a B, conserva T1 de A y el acceso al reclamo de aquella actividad. No se inventa historia desde el grupo vigente. El orden de eventos coincidentes y las reparaciones históricas requieren una regla explícita antes de desarrollar.

## Visibilidad de resultados

- Notas grupales y puntos quedan visibles a sus destinatarios al confirmar su registro, sin publicación posterior.
- Cada alumno consulta sus puntos y las notas que le correspondan por participación histórica; no resultados de otros grupos o alumnos.
- Una nota vacía es pendiente, también en XLSX. Cero es una calificación registrada expresamente.
- Una corrección grupal conserva el cambio y alcanza a sus participantes originales.

La prohibición estudiantil de leer notas de versiones anteriores **ha sido reemplazada como requisito de producto**, pero sigue existiendo en la migración `0029` y en especificaciones anteriores. No debe retirarse esa protección sin diseñar y probar acceso limitado por participación histórica. Véanse [diseño](../02-diseno/modelo-datos.md) y [estado](../03-calidad-y-operacion/estado-actual.md).

## Reclamos y correo

| Regla          | Nota grupal                                                     | Puntos                               |
| -------------- | --------------------------------------------------------------- | ------------------------------------ |
| Quién presenta | Cualquier participante de aquella actividad en nombre del grupo | El alumno titular del movimiento     |
| Visibilidad    | Participantes históricos de la actividad y docente responsable  | Alumno titular y docente responsable |
| Unicidad       | Un reclamo por grupo y evaluación                               | Un reclamo por movimiento            |

El recorrido es **Pendiente → En revisión → Respondido**. La respuesta motivada del docente es final, sin réplica, reapertura ni nueva solicitud sobre el mismo registro. Responder no corrige automáticamente: la modificación académica debe realizarla expresamente el docente. Se conserva quién presentó el reclamo.

Cada nuevo reclamo genera un aviso por correo al docente con mensaje breve y enlace, sin notas, puntos ni texto de la solicitud. El reclamo permanece en la plataforma aunque falle el aviso. El tratamiento de reintentos y la visibilidad de ese fallo deben definirse; no se supone entrega o lectura por haber enviado. No se acuerdan correos al alumno, recordatorios ni escalamiento.

## Exportación y puntos: supuesto del equipo

El responsable no pudo confirmar con el profesor la aplicación de puntos y acuerda como **supuesto de trabajo revisable**:

1. Trabajos de igual peso y notas grupales base preservadas.
2. Un punto aumenta una unidad de nota individual en un trabajo, máximo 20 por trabajo; aplicación automática, sin reutilizar el punto en otros trabajos del mismo cálculo.
3. Los puntos que exceden el margen total se conservan como excedente sin efecto académico adicional.
4. La exportación solo calcula: no descuenta, consume ni modifica puntos. Repetirla con iguales entradas conserva los resultados.
5. Con notas pendientes no se presenta un promedio final ajustado completo. Con notas completas, se muestra con dos decimales, redondeando solo el resultado final.

Para un alumno, con n trabajos completos y saldo no negativo: margen = suma de (20 − nota base); aplicados = mínimo entre saldo y margen; promedio ajustado = (suma de notas base + aplicados) / n; excedente = saldo − aplicados. Esta equivalencia no fija una distribución por trabajo para mostrar en columnas. El promedio es del componente de trabajos grupales, no necesariamente del curso completo.

La salida inicial distingue notas base, promedio base, saldo, puntos aplicados, excedente y promedio ajustado. Precisión de notas, saldos negativos, movimientos anulados y columnas definitivas deben concretarse antes de implementar el cálculo. No se añade un ajuste individual manual ni una fórmula no acordada.

## Exclusiones y evaluación

Fuera del alcance: importación de notas, integración SUM, actas oficiales, entregas y plazos de tareas, contenidos, asistencia, foros, mensajería general, corrección individual excepcional de la nota grupal, apelaciones y notificaciones distintas del aviso acordado. El ajuste individual calculado por puntos es diferente de una corrección individual excepcional.

Se evaluarán registro y seguimiento con casos sintéticos. El tiempo se contrastará con un procedimiento manual **simulado equivalente**, no con una línea base histórica inexistente. Consulta, privacidad, reclamos y exportación se comprobarán contra criterios funcionales. No hay metas de ahorro ni resultados medidos aprobados. Véanse [indicadores](../03-calidad-y-operacion/indicadores-y-ci-cd.md) y [registro de evaluación](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md).

## Relación con especificaciones anteriores

`specs/001-manage-group-evaluation/` sigue representando la planificación anterior. Deben sincronizarse requisitos, contratos, pruebas y tareas antes de implementar los cambios: consulta estudiantil, reclamos, correo, exportación con puntos y reapertura general. Esa sincronización es una tarea explícita del backlog; no se renumeran FR ni se reinterpreta evidencia anterior para declarar cumplido el nuevo alcance.

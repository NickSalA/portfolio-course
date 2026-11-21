# Glosario del dominio académico

Vocabulario del [alcance vigente](caso-evaluacion-grupal.md). Define conceptos del producto objetivo, no afirma su implementación. El estado del código y las decisiones técnicas pertenecen a [diseño](../02-diseno/modelo-datos.md) y [evaluación](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md).

| Término                           | Significado                                                                                                                                                      |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identidad autenticada             | Persona cuya identidad se ha comprobado; no concede por sí misma acceso a un curso                                                                               |
| Docente responsable               | Persona autorizada para administrar los registros académicos de sus cursos y decidir la resolución de reclamos                                                   |
| Alumno autorizado                 | Persona habilitada previamente para acceder a un curso, aun antes de vincular su cuenta                                                                          |
| Matrícula                         | Vínculo de un alumno con un curso en la plataforma; no representa una matrícula oficial realizada en el SUM                                                      |
| Periodo académico                 | Año y término bajo los que se organizan cursos                                                                                                                   |
| Curso                             | Unidad académica de un periodo bajo responsabilidad docente                                                                                                      |
| Padrón                            | Relación inicial de alumnos; el XLSX recibido del SUM no incluye notas para importar                                                                             |
| Grupo                             | Organización de alumnos de un curso con capacidad definida por el docente                                                                                        |
| Ventana de selección              | Periodo durante el que los alumnos pueden elegir o cambiar de grupo con cupo; puede reabrirse para todo el curso                                                 |
| Participante de una actividad     | Alumno que pertenecía al grupo cuando se realizó la actividad, aunque haya cambiado después                                                                      |
| Pertenencia histórica             | Relación del alumno con un grupo en el momento de una actividad; determina notas, correcciones y acceso al reclamo grupal                                        |
| Evaluación grupal                 | Actividad de un curso para la que el docente registra una calificación por grupo; la plataforma no recibe el entregable ni lo evalúa automáticamente             |
| Nota grupal base                  | Calificación de 0 a 20 asociada a grupo y evaluación, que corresponde a sus participantes históricos                                                             |
| Nota pendiente                    | Ausencia de calificación registrada; se mantiene vacía y no equivale a cero                                                                                      |
| Registro confirmado               | Resultado guardado que queda visible de inmediato a sus destinatarios, sin publicación posterior separada                                                        |
| Corrección grupal                 | Cambio docente de una nota base, conservando explicación del cambio y participantes de la actividad                                                              |
| Movimiento de puntos              | Asignación individual de puntos, distinta de una nota grupal, sobre la que su titular puede reclamar                                                             |
| Anulación de puntos               | Corrección que conserva el movimiento original y lo excluye del saldo, sin borrarlo                                                                              |
| Saldo de puntos                   | Total derivado de movimientos aplicables; el tratamiento de saldos negativos requiere definición para el cálculo de exportación                                  |
| Reclamo grupal                    | Solicitud única por grupo y evaluación, que cualquier participante presenta en nombre del grupo de aquella actividad y consultan esos participantes y el docente |
| Reclamo individual de puntos      | Solicitud única por movimiento propio, privada entre el alumno titular y el docente                                                                              |
| Seguimiento de evaluaciones       | Consulta de resultados propios y del estado y respuesta de reclamos; no implica seguimiento integral del aprendizaje                                             |
| Estado de reclamo                 | Momento del recorrido Pendiente → En revisión → Respondido; la respuesta docente es final y no admite réplica, reapertura ni otro caso sobre el mismo registro   |
| Aviso de reclamo                  | Correo breve al docente responsable ante una nueva solicitud, con enlace y sin nota, puntos o texto del reclamo; no equivale a su respuesta ni prueba lectura    |
| Exportación del curso             | Descarga XLSX por alumno y curso para uso docente, sin integración con el SUM ni carácter de acta oficial                                                        |
| Puntos aplicados                  | Parte del saldo aprovechable en el cálculo individual de exportación, hasta el margen de las notas base; no es un descuento del saldo                            |
| Excedente no aplicado             | Puntos que no producen aumento porque los trabajos ya alcanzaron el máximo; permanecen registrados sin otro beneficio                                            |
| Promedio ajustado                 | Promedio individual de trabajos de igual peso tras aplicar puntos hasta un máximo de 20 por trabajo; se muestra a dos decimales con redondeo solo al final       |
| Corrección individual excepcional | Sustitución justificada de la nota grupal para un alumno; fuera del alcance y diferente del cálculo automático por puntos                                        |

## Distinciones que deben mantenerse

- Autorizar un alumno no es lo mismo que autenticar su cuenta o vincular su matrícula.
- El grupo actual no determina retrospectivamente quién realizó una actividad.
- Una nota pendiente y una nota cero no son equivalentes.
- Puntos y notas base son registros diferentes. Su aplicación académica en la exportación es un **supuesto del equipo**, no una regla confirmada por el profesor.
- Exportar calcula; no consume puntos ni modifica las notas grupales originales.
- Responder un reclamo no modifica automáticamente el resultado cuestionado; la corrección exige actuación docente expresa.
- Reabrir la selección de grupos no equivale a reabrir un reclamo.

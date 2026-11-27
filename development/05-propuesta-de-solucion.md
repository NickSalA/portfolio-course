# 5. Propuesta de solución

## 5.1 Descripción general

Se propone una plataforma en la que el docente registre una nota por grupo y evaluación y la información quede relacionada con los alumnos que participaron en la actividad. Así se busca reemplazar la búsqueda y anotación individual de una misma nota. Los alumnos consultarían sus resultados y podrían presentar reclamos con seguimiento dentro del mismo entorno.

El funcionamiento se organiza en registro y seguimiento, con apoyo de la incorporación del padrón, el acceso autorizado y la selección de grupos. La exportación permite obtener la información del curso para uso posterior del docente.

## 5.2 Preparación del curso

El docente seleccionaría periodo y curso e incorporaría el padrón de alumnos recibido del SUM. La revisión distinguiría datos aceptados, incompletos y repetidos antes de confirmar su incorporación. Esta carga habilita el acceso al curso; no importa calificaciones.

El docente definiría cuántos grupos habrá, su capacidad y la ventana de selección. Durante esa ventana, los alumnos elegirían y podrían cambiar de grupo si existe cupo. Si se necesita otra oportunidad, el docente puede ampliar o reabrir la selección para todo el curso. Esta reapertura no cambia la relación de los alumnos con actividades ya realizadas.

## 5.3 Registro de evaluaciones

1. El docente identifica curso, actividad y fecha de realización.
2. La plataforma muestra los grupos y participantes correspondientes a esa actividad.
3. El docente registra una nota grupal entre 0 y 20.
4. Se comprueban el curso, los permisos y la validez del dato.
5. Al confirmarse, la nota queda disponible para los participantes de la actividad.
6. El docente revisa las notas registradas y los campos pendientes. Si corrige un resultado, se conserva la información del cambio.

La actividad se evalúa fuera de la plataforma. Una nota pendiente no se interpreta como incumplimiento ni se sustituye por cero. Los puntos individuales se registran por separado y son visibles para el alumno correspondiente al confirmarse.

## 5.4 Consulta y reclamos

Cada alumno consultaría sus puntos y las notas grupales que le corresponden. Para una nota grupal, cualquier participante puede presentar el reclamo en nombre del grupo de aquella actividad; los demás participantes históricos y el docente pueden consultar el mismo caso. Para puntos, únicamente el alumno afectado y el docente acceden al reclamo y su respuesta.

El recorrido acordado es **Pendiente → En revisión → Respondido**. Al recibirse un reclamo se envía un correo al docente con aviso breve y enlace, sin notas, puntos ni texto del reclamo. El docente revisa, decide si corresponde mantener o corregir el registro y explica su decisión dentro de la plataforma.

Se admite un solo reclamo por grupo y evaluación y uno por movimiento de puntos. La respuesta es final: no se incluye réplica del alumno, reapertura ni una nueva solicitud sobre el mismo registro. La corrección, cuando proceda, es una actuación expresa del docente, no un efecto automático de responder.

## 5.5 Correspondencia ante cambios de grupo

Si un alumno realizó una actividad con el grupo A y después pasó al B, conserva la nota que le corresponda por aquella actividad de A. También puede reclamarla en nombre de A y consultar su respuesta. Los integrantes de B no adquieren acceso a ese reclamo por compartir ahora grupo con él.

Esta regla preserva la relación entre trabajo, nota y participantes. Es una condición de coherencia del proceso, no su problema central. Si no se conoce la participación en una actividad, se requiere revisión docente en lugar de asumirla a partir del grupo actual.

## 5.6 Exportación XLSX y aplicación de puntos

El docente podría descargar por curso las notas base de cada evaluación por alumno, sus puntos y el resultado individual calculado. Las notas se atribuyen según los participantes de cada actividad. Una nota sin registrar permanece vacía también en el archivo; mientras falten notas del conjunto de trabajos incluido, el promedio de cierre se mantiene pendiente.

**Supuesto de trabajo del equipo:** como no se pudo confirmar con el profesor una regla de aplicación de puntos, se adopta una bonificación individual automática sobre los trabajos grupales al preparar la exportación. Esta regla es revisable y no se atribuye como una instrucción del docente.

- Los trabajos tienen igual peso.
- Un punto aumenta una unidad de nota de un trabajo, sin que cada nota ajustada supere 20.
- Los puntos se aplican una sola vez dentro del cálculo, donde exista margen. No se añade el saldo completo a cada trabajo ni directamente al promedio.
- Se conservan las notas grupales originales y los resultados de los compañeros.
- Si todos los trabajos alcanzan 20, el saldo restante es excedente sin efecto sobre la calificación; no se elimina del registro ni se convierte en otro beneficio.
- Descargar solo calcula: no consume, descuenta ni modifica puntos. Con iguales datos y reglas, las exportaciones repetidas mantienen los mismos resultados académicos.
- El promedio se muestra con dos decimales, redondeando únicamente el resultado final.

Para un alumno con todas las notas del conjunto de trabajos registradas y saldo no negativo, el cálculo equivalente es:

1. **Margen disponible:** sumar cuánto le falta a cada nota base para alcanzar 20.
2. **Puntos aplicados:** tomar el menor valor entre el saldo de puntos y ese margen.
3. **Promedio ajustado:** dividir la suma de notas base más los puntos aplicados entre el número de trabajos.
4. **Excedente:** restar los puntos aplicados al saldo disponible.

Ejemplo ilustrativo: notas base 20, 18 y 17, con dos puntos. El margen total es cinco; se aplican los dos puntos y el promedio ajustado es (20 + 18 + 17 + 2) / 3 = **19,00**. No hace falta elegir manualmente a qué trabajo asignarlos para obtener ese promedio, porque todos tienen el mismo peso.

La salida propuesta distingue notas grupales base, promedio base, saldo, puntos aplicados, excedente y promedio ajustado. No se presentan notas individuales ajustadas por trabajo como definitivas hasta acordar cómo se mostraría su distribución. El archivo no constituye un acta oficial ni se envía al SUM.

## 5.7 Validaciones y tratamiento de situaciones excepcionales

| Situación                                     | Respuesta funcional esperada                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Datos del padrón incompletos o repetidos      | Explicar los registros que requieren revisión y evitar duplicados                                 |
| Acceso a otro curso o resultado ajeno         | Denegar la consulta o modificación                                                                |
| Grupo lleno o ventana cerrada                 | Explicar por qué no se permite el cambio y mantener el grupo anterior                             |
| Nota fuera de rango o dato no numérico        | Solicitar corrección sin confirmar una nota inválida                                              |
| Nota vacía                                    | Mostrar pendiente, sin asignar cero                                                               |
| Cambio de grupo posterior a la actividad      | Conservar los participantes originales para nota y reclamo                                        |
| Segundo reclamo del mismo registro            | Mostrar el caso existente a sus destinatarios autorizados                                         |
| Respuesta favorable a un reclamo              | Permitir corrección expresa por el docente y conservar su explicación                             |
| Fallo al registrar o confirmar una acción     | Informar el estado y permitir comprobarlo sin repetir registros                                   |
| Fallo del aviso por correo                    | Mantener el reclamo registrado; definir antes del desarrollo cómo se informa y reintenta el aviso |
| Exportación con notas pendientes              | Conservar campos vacíos y no presentar el promedio como completo                                  |
| Saldo negativo o regla de puntos no aplicable | Requerir definición de la regla antes de producir un ajuste no acordado                           |

## 5.8 Beneficios esperados y límites

Se espera reducir la repetición de búsquedas y anotaciones, facilitar la consulta privada de resultados y ofrecer un recorrido visible para los reclamos. Estos beneficios dependen de que alumnado, actividades y grupos estén correctamente relacionados y de que el docente mantenga los registros actualizados.

La automatización no decide la calificación de un trabajo, no resuelve por sí sola un reclamo ni reemplaza el criterio académico. Las dimensiones para evaluar su contribución se plantean en el plan de desarrollo.

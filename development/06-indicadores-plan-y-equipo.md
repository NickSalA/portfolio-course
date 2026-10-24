# 6. Plan de desarrollo, indicadores y equipo

## 6.1 Orientación del desarrollo

El proyecto tiene como objetivo desarrollar una plataforma de gestión académica para el registro y seguimiento de las evaluaciones grupales en los cursos del docente del caso de estudio. El plan articula los cuatro objetivos específicos: analizar el proceso y sus necesidades, diseñar el funcionamiento, implementar las funciones previstas y evaluar su contribución mediante pruebas e indicadores acordados.

El desarrollo se organizará en torno a los siguientes recorridos funcionales:

1. **Organización del curso y los grupos.** El docente define la cantidad de grupos, su capacidad y la ventana de selección. Los alumnos eligen y pueden cambiar de grupo mientras la ventana esté abierta y exista cupo. Una ampliación o reapertura habilita la selección para todo el curso. Se conserva la participación en cada actividad para atribuir correctamente sus notas y reclamos posteriores.
2. **Registro y consulta de resultados.** El docente registra y corrige las notas grupales y los puntos individuales. Al confirmar el registro, cada alumno puede consultar inmediatamente sus propios puntos y las notas de las actividades en las que participó, sin una publicación adicional. Las notas sin registrar permanecen vacías o pendientes, no se convierten en cero.
3. **Seguimiento de reclamos.** Cualquier participante de una actividad puede presentar el único reclamo de su grupo para esa evaluación; los participantes de esa actividad y el docente consultan el caso. Cada alumno puede reclamar sobre sus propios movimientos de puntos, de forma privada con el docente y con un único reclamo por movimiento. El recorrido es **Pendiente → En revisión → Respondido**. El docente fundamenta su decisión y realiza expresamente la corrección cuando corresponda. No se contempla réplica, reapertura ni otro reclamo sobre el mismo registro.
4. **Aviso al docente.** Un nuevo reclamo genera un correo breve al docente responsable con un enlace para revisarlo en la plataforma, sin notas, puntos ni texto del reclamo. El seguimiento y la respuesta se mantienen en la plataforma.
5. **Exportación por curso.** El docente obtiene un archivo XLSX con las notas correspondientes a cada alumno según su participación en las actividades y los datos de puntos. La descarga sirve de apoyo al docente y no supone una integración con el SUM.

Para la exportación se adopta como **supuesto de trabajo del equipo, no confirmado por el profesor**, la aplicación automática de puntos a los trabajos grupales antes de obtener el promedio individual. Los trabajos tienen igual peso; cada punto aumenta una unidad de nota individual hasta un máximo de 20 por trabajo, aprovechando el margen disponible sin repetir puntos ni alterar las notas grupales base. Los puntos que excedan ese margen se conservan como excedente no aplicado.

Exportar solo calcula: no consume ni modifica los puntos. Con los mismos datos y reglas, las descargas sucesivas deben conservar los mismos resultados académicos. Si faltan notas, permanecen vacías y no se presenta un promedio final ajustado como completo. El promedio de cierre se muestra con dos decimales y se redondea únicamente al final, conservando la precisión de los cálculos intermedios. El detalle definitivo de las columnas del archivo queda por precisar.

## 6.2 Cronograma tentativo

La guía establece un hito de análisis, diseño y prototipo en la semana 8 y otro de implementación, pruebas y evaluación en la semana 16. Ambos forman parte del mismo proyecto de desarrollo; la distribución intermedia siguiente es una propuesta de organización, sujeta a las fechas y disponibilidad del equipo.

| Periodo       | Actividades previstas                                                                                                                                          | Producto esperado                                                     |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Semanas 1–4   | Analizar el proceso de evaluación grupal, identificar necesidades y delimitar objetivos, actores y alcance.                                                    | Diagnóstico y requisitos.                                             |
| Semanas 5–7   | Diseñar la organización de grupos, el registro y consulta de resultados, los reclamos y la exportación; representar los recorridos en el prototipo documental. | Diseño funcional y prototipo documental.                              |
| Semana 8      | Integrar el análisis y el diseño, revisar el prototipo y preparar el informe y la presentación de avance.                                                      | Entrega de análisis, diseño y prototipo prevista por la guía.         |
| Semanas 9–10  | Desarrollar la organización de cursos y grupos, y el registro de notas y puntos con su consulta restringida.                                                   | Recorrido de registro y consulta.                                     |
| Semanas 11–12 | Desarrollar el seguimiento de reclamos, el aviso por correo y la exportación con las reglas de cálculo acordadas.                                              | Recorridos de seguimiento y exportación.                              |
| Semanas 13–14 | Probar los recorridos completos, revisar la correspondencia de resultados y corregir las dificultades encontradas.                                             | Registro de pruebas y ajustes.                                        |
| Semana 15     | Realizar la evaluación con escenarios simulados comparables y analizar los indicadores y sus limitaciones.                                                     | Resultados de evaluación.                                             |
| Semana 16     | Consolidar la plataforma, las pruebas, la evaluación y la presentación final.                                                                                  | Entrega de implementación, pruebas y evaluación prevista por la guía. |

## 6.3 Evaluación e indicadores propuestos

La evaluación buscará determinar la contribución de la plataforma al registro y seguimiento de las evaluaciones grupales. Los indicadores siguientes son propuestas para acordar antes de la evaluación; no representan resultados obtenidos ni metas numéricas aprobadas.

| Indicador propuesto                      | Qué se observará                                                                                                                               | Criterio de revisión                                                                                                                                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tiempo de registro                       | Tiempo necesario para registrar un mismo conjunto de evaluaciones grupales mediante un procedimiento manual simulado y mediante la plataforma. | Comparar las condiciones y los tiempos observados para explorar una posible reducción. Esta es una hipótesis del equipo, no una dificultad temporal cuantificada ni confirmada por el profesor. |
| Correspondencia entre nota e integrantes | Coincidencia entre la nota de una actividad y los alumnos que participaron en ella, incluidos quienes después cambian de grupo.                | Contrastar los resultados con la relación de participantes prevista para cada actividad del escenario.                                                                                          |
| Consulta restringida e inmediata         | Disponibilidad de notas y puntos tras confirmar su registro y delimitación de lo que puede consultar cada alumno.                              | Comprobar que no se requiere otra publicación y que cada alumno accede solo a sus puntos y a las notas que le corresponden.                                                                     |
| Seguimiento de reclamos                  | Presentación, consulta, estados y respuesta de los reclamos grupales e individuales.                                                           | Revisar el recorrido Pendiente → En revisión → Respondido, la privacidad, la participación histórica, la restricción de duplicados y la decisión fundamentada del docente.                      |
| Aviso por correo al docente              | Generación del aviso ante un nuevo reclamo y contenido del mensaje.                                                                            | Verificar destinatario, enlace y ausencia de datos académicos y del texto del reclamo; distinguir el envío de la entrega o lectura del correo.                                                  |
| Exactitud de la exportación              | Correspondencia de las notas por alumno y de los resultados calculados con los casos preparados.                                               | Revisar aplicación automática de puntos, igual peso, máximo de 20 por trabajo, excedentes, ausencia de consumo, notas pendientes vacías y promedio con redondeo final a dos decimales.          |

Se prepararán escenarios simulados con grupos, actividades, cambios de integrantes, notas, puntos y reclamos. Para cada caso se definirá previamente el resultado esperado y luego se registrarán lo observado y las diferencias. Se incluirán tanto recorridos habituales como situaciones con notas pendientes, trabajos en el máximo de calificación y puntos excedentes.

La comparación del tiempo de registro utilizará las mismas entradas, cantidad de grupos y tareas en ambos procedimientos, con preparación equivalente para los participantes. Antes de realizarla se acordarán participantes, repeticiones, condiciones y forma de resumir los tiempos. No se dispone de una línea base histórica de tiempos ni de solicitudes o reclamos; por ello, la simulación no se presentará como una medición del desempeño anterior del docente. Los demás indicadores se revisarán contra los criterios funcionales de los escenarios, sin inventar reducciones de reclamos ni porcentajes de mejora.

## 6.4 Organización del equipo

Se prevé un equipo de cinco integrantes. Los nombres y la asignación personal de responsabilidades están pendientes; se proponen los siguientes roles funcionales:

| Rol                                 | Responsabilidad principal                                                                                     | Integrante        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------- |
| Coordinación y análisis del proceso | Organizar el trabajo, mantener el alcance y reunir las necesidades y acuerdos del caso.                       | Nombre pendiente. |
| Diseño funcional y prototipo        | Representar los recorridos del docente y del alumno y revisar su claridad y facilidad de uso.                 | Nombre pendiente. |
| Registro y organización académica   | Desarrollar las funciones de cursos, grupos, participación, notas y puntos.                                   | Nombre pendiente. |
| Seguimiento y comunicación          | Desarrollar la consulta de resultados, los reclamos y el aviso al docente.                                    | Nombre pendiente. |
| Evaluación y documentación          | Coordinar las pruebas y los indicadores, revisar la exportación y consolidar el informe y las presentaciones. | Nombre pendiente. |

Los roles organizan la responsabilidad principal, no el trabajo exclusivo de cada integrante. Se propone revisar en conjunto los recorridos completos y los resultados de evaluación, y ajustar la distribución de tareas según el avance.

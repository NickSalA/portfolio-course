# 3. Marco teórico

El proyecto tiene como objetivo desarrollar una plataforma de gestión académica para el registro y seguimiento de las evaluaciones grupales en los cursos del docente del caso de estudio. Este capítulo explica los conceptos que orientan su funcionamiento: automatización de tareas repetitivas, organización de la información académica, control de registros, seguimiento estudiantil, privacidad, accesibilidad y evaluación de la solución.

Se distinguen los fundamentos bibliográficos de las reglas particulares del proyecto. La descripción del proceso actual procede del relato del solicitante; las decisiones funcionales corresponden a los acuerdos registrados en el plan de refinamiento. Estas fuentes del caso no se presentan como entrevistas ni como resultados de observación directa.

## 3.1 Automatización de tareas repetitivas y gestión por procesos

La automatización consiste en ejecutar actividades recurrentes conforme a reglas definidas, sin exigir que una persona repita cada operación. La gestión por procesos permite examinar esas actividades como un conjunto relacionado de entradas, responsables, decisiones y resultados. La presentación editorial de Dumas et al. (2018) sitúa la identificación, el análisis, el rediseño, la automatización y el seguimiento dentro de un mismo ciclo de gestión.

Según el relato del solicitante, el registro anterior exige identificar a los integrantes de cada grupo y trasladar la misma nota, alumno por alumno, a Excel. La tarea repetitiva no es emitir el juicio académico, sino localizar a sus destinatarios y reproducir el resultado. La plataforma busca que el docente registre una calificación grupal y que esta se relacione con quienes participaron en la actividad, conservando su presentación individual al preparar el archivo del curso.

La ventaja esperada es reducir la repetición y las oportunidades de omisión o transcripción incorrecta. Su límite es que una regla equivocada o una composición de grupo mal registrada también puede reproducir errores. Por ello, se recomienda automatizar actividades con reglas claras y conservar la revisión docente sobre los resultados y sus correcciones. Automatizar el registro no equivale a calificar automáticamente los trabajos.

## 3.2 Gestión académica y organización de la información

En este proyecto, la gestión académica comprende la organización de cursos, grupos, evaluaciones, notas y puntos, junto con las responsabilidades de docentes y estudiantes. Digitalizar estos registros significa disponer de información ordenada para trabajar y consultar; mejorar la gestión requiere, además, definir quién registra, quién consulta y cómo se atienden las discrepancias.

UNESCO (s. f.), en la presentación del Informe GEM 2023, reconoce la gestión del sistema educativo entre los ámbitos en que puede contribuir la tecnología, pero también señala la importancia del acceso, la regulación y la preparación docente. Este enfoque permite situar la plataforma como apoyo a una necesidad académica concreta, no como una mejora educativa garantizada por el solo uso de medios digitales.

La organización común de la información puede facilitar su consulta y disminuir la necesidad de reunir registros separados. Como contrapartida, exige mantenerlos actualizados y que los usuarios comprendan el procedimiento. Se recomienda delimitar la plataforma al registro y seguimiento de evaluaciones, sin confundirla con un sistema que recibe trabajos, controla entregas o administra todos los procesos de la institución.

## 3.3 Evaluación grupal y pertenencia histórica

La evaluación grupal produce una calificación asociada a una actividad colectiva. Para el registro académico, es necesario distinguir la nota del grupo de la identificación de los estudiantes a quienes corresponde. La pertenencia histórica representa quiénes integraban el grupo cuando se realizó la actividad, aunque después se hayan trasladado a otro.

Esta distinción evita atribuir una nota anterior a los integrantes actuales que no participaron en el trabajo. También permite reconocer a quienes sí participaron cuando consultan el resultado o presentan un reclamo. Su ventaja es conservar una relación explicable entre actividad, grupo y estudiante; su dificultad reside en disponer de información confiable sobre esa participación. No permite deducir cuánto aportó cada integrante ni demostrar por sí sola la equidad de la calificación.

En el caso acordado, el docente define el número de grupos y su capacidad. Los alumnos eligen o cambian de grupo durante una ventana habilitada y sujetos a cupo. Una reapertura permite la selección a todo el curso, pero no modifica la participación registrada en actividades anteriores. Mantener esta separación es recomendable cuando los grupos pueden cambiar durante el periodo académico.

## 3.4 Registro y control académico

El registro conserva un resultado y su contexto: curso, evaluación, grupo o alumno correspondiente. El control académico comprende la revisión de que esa información sea completa, coherente y susceptible de corrección por el responsable. La trazabilidad, en este contexto, es la posibilidad de explicar a qué actividad corresponde una nota y reconocer las modificaciones pertinentes.

Un control esencial es distinguir una nota pendiente de una calificación de cero. La primera indica que todavía no se ha registrado un resultado; la segunda expresa una decisión académica del docente. Confundirlas alteraría la interpretación del avance y de los promedios. Del mismo modo, una corrección debe quedar vinculada al registro que modifica, en lugar de generar resultados contradictorios.

Los puntos individuales se conservan como un registro distinto de la nota grupal. Como supuesto de trabajo acordado con el solicitante, no como regla confirmada por el profesor, se contempla aplicarlos automáticamente al preparar la exportación del curso: cada punto aumenta una unidad de nota individual en los trabajos con margen, sin superar 20 por trabajo ni modificar las notas grupales base. Los trabajos tienen igual peso y los puntos no se repiten entre ellos; el excedente queda identificado sin aplicación.

La exportación solo calcula: no consume ni modifica los puntos. El promedio de cierre requiere las notas de los trabajos incluidos y se muestra con dos decimales, redondeando únicamente el resultado final. Estas reglas ilustran la importancia de separar los registros originales de los resultados calculados. El detalle definitivo de las columnas del archivo permanece por precisar.

El beneficio esperado del control es facilitar la revisión y evitar interpretaciones ambiguas. Su costo es la necesidad de acordar y mantener reglas comprensibles; ninguna validación sustituye la responsabilidad docente sobre la calificación.

## 3.5 Seguimiento, consulta y atención de reclamos

El seguimiento académico es la posibilidad de consultar los resultados y conocer la atención de las discrepancias a lo largo del curso. Se diferencia del registro porque considera lo que ocurre después de guardar una nota: acceso del estudiante, identificación de posibles errores y respuesta del docente.

En la plataforma, las notas grupales y los puntos quedan disponibles para sus destinatarios cuando el docente confirma su registro, sin una publicación posterior. Cada alumno consulta sus puntos y las notas de las actividades en las que participó. Esta disponibilidad puede favorecer una revisión oportuna, aunque no garantiza que el alumno consulte o comprenda el resultado.

El reclamo es una solicitud de revisión vinculada a un registro específico. Su recorrido es **Pendiente → En revisión → Respondido**. El docente emite la decisión final y explica por qué mantiene o corrige el resultado. Responder no cambia automáticamente una nota o un movimiento de puntos: la corrección, cuando corresponda, es una acción expresa del docente.

Cualquier participante de una actividad puede presentar el único reclamo del grupo sobre esa evaluación. Los participantes históricos y el docente pueden consultar su estado y respuesta. Para puntos individuales, solo el alumno titular puede reclamar sobre un movimiento propio y consultar la respuesta con el docente. No se admiten solicitudes duplicadas sobre el mismo registro ni reapertura después de la respuesta.

Al presentar un reclamo se avisa por correo al docente responsable mediante un mensaje breve y un enlace, sin incluir calificaciones, puntos o el texto del reclamo. El aviso facilita advertir una solicitud nueva, pero no reemplaza su atención dentro de la plataforma ni acredita que el mensaje haya sido leído. Este procedimiento aporta orden y un estado consultable, a cambio de requerir atención docente; no constituye una conversación ni una instancia adicional de apelación.

## 3.6 Privacidad y confidencialidad académica

La privacidad implica limitar el uso y la divulgación de información personal; la confidencialidad exige que los registros sean conocidos únicamente por sus destinatarios autorizados. En una plataforma académica, disponer de información centralizada no justifica hacerla visible a todo el curso.

Las reglas del caso aplican esta distinción: los puntos y sus reclamos son individuales; las notas y los reclamos grupales se consultan según la participación en la actividad. Un traslado de grupo no concede acceso a resultados anteriores de otros estudiantes. Los avisos por correo remiten a la plataforma sin exponer el contenido académico, y los ejemplos de demostración deben utilizar datos ficticios.

Estas medidas buscan evitar la exposición innecesaria y permitir consultas propias sin divulgar resultados ajenos. Exigen, como contrapartida, revisar cuidadosamente los destinatarios de cada información. Son criterios funcionales de protección; la normativa aplicable requiere una revisión específica antes de afirmar cumplimiento legal.

## 3.7 Accesibilidad y facilidad de uso

La accesibilidad busca que personas con diferentes capacidades puedan percibir, comprender y utilizar la información. WCAG 2.2 organiza este propósito en cuatro principios: perceptible, operable, comprensible y robusto (World Wide Web Consortium, 2024). La facilidad de uso se refiere aquí a que docentes y estudiantes puedan completar sus tareas y entender sus resultados sin confusión innecesaria.

Para el proyecto, estos conceptos orientan etiquetas claras, navegación consistente, texto legible, uso del teclado, indicación visible de la posición de navegación y mensajes que expliquen cómo corregir errores. Los estados de los reclamos deben reconocerse mediante palabras, no solo colores. También debe ser evidente la diferencia entre una nota pendiente y un cero registrado.

Estas medidas pueden reducir barreras en el registro y la consulta. Su límite es que requieren evaluación con los recorridos completos y no cubren todas las necesidades de todas las personas. Se recomienda considerarlas desde el diseño; una representación de pantallas no basta para declarar conformidad con WCAG.

## 3.8 Prototipo y evaluación de la solución

Un prototipo representa la organización de la información y los recorridos de uso para revisar si el diseño comunica lo necesario. Permite discutir cómo registrar una nota grupal, consultar resultados propios y atender un reclamo antes de cerrar las decisiones de funcionamiento. Su utilidad es detectar omisiones y ambigüedades; su límite es que mostrar una pantalla no demuestra la corrección de los registros ni la mejora del proceso.

Las pruebas de funcionamiento contrastan acciones y reglas con resultados esperados. La evaluación del proyecto examina su contribución al registro y seguimiento mediante indicadores acordados. Conviene distinguir ambas: cumplir una regla no demuestra, por sí solo, que el procedimiento sea más rápido o comprensible.

Como dimensiones candidatas se consideran el tiempo necesario para registrar notas, la correspondencia entre participantes y resultados, la posibilidad de completar una consulta propia y la comprensión del estado y respuesta de un reclamo. El método, los participantes y los valores de comparación deben acordarse antes de medir. Una comparación con el procedimiento anterior requerirá tareas equivalentes y condiciones descritas; no se atribuyen mejoras sin evidencia.

En conjunto, estos conceptos orientan una plataforma que disminuya operaciones repetitivas, conserve registros interpretables y facilite el seguimiento por sus destinatarios, manteniendo el juicio académico y la resolución de reclamos bajo responsabilidad docente.

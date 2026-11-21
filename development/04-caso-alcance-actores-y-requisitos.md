# 4. Caso de aplicación, alcance y requisitos

## 4.1 Visión general de la plataforma

La plataforma organiza los cursos del docente por periodo académico. A partir del padrón institucional se habilita el acceso de los alumnos y su vinculación al curso. Estos pueden elegir grupo durante la ventana establecida y consultar sus resultados. El docente registra notas grupales y puntos individuales, revisa reclamos y descarga la información del curso en XLSX.

| Componente                          | Relación con el proyecto                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Periodos y cursos                   | Contexto de organización y responsabilidad docente                                                     |
| Padrón, acceso y matrícula          | Incorporación y vinculación de alumnos autorizados; no equivale a matricularlos oficialmente en el SUM |
| Configuración y selección de grupos | Apoyo para identificar participantes de las evaluaciones                                               |
| Registro de notas grupales          | Primera etapa principal: una calificación por grupo y actividad                                        |
| Consulta de resultados y reclamos   | Segunda etapa principal: seguimiento de evaluaciones                                                   |
| Puntos individuales                 | Registro y consulta relacionados; reclamos privados y cálculo individual al exportar                   |
| Exportación XLSX                    | Salida por curso para uso del docente, sin integración con el SUM                                      |

## 4.2 Actores y responsabilidades

**Docente responsable:** prepara sus cursos, incorpora alumnos, define número y capacidad de grupos y habilita su selección. Evalúa los trabajos fuera de la plataforma, registra y corrige notas y puntos, atiende reclamos y exporta la información. Decide sobre la procedencia de cada reclamo.

**Alumno autorizado:** accede a sus cursos, elige o cambia de grupo cuando está permitido, consulta sus resultados y presenta reclamos sobre los registros que le corresponden. No modifica calificaciones ni consulta información académica ajena.

La plataforma relaciona registros, verifica condiciones, muestra resultados y estados y avisa al docente de nuevos reclamos. No sustituye su juicio académico.

## 4.3 Frontera del proceso

- **Entradas:** curso, alumnado autorizado, grupos y participantes identificados, actividades evaluadas y calificaciones decididas por el docente.
- **Registro:** selección de curso y actividad, ingreso de la nota grupal, asociación con participantes, revisión de pendientes y correcciones.
- **Seguimiento:** consulta de resultados propios, presentación de reclamos, revisión y respuesta final del docente.
- **Salidas:** registros consultables, reclamos con estado y respuesta y archivo XLSX del curso.

La selección de grupos y la carga del padrón habilitan el recorrido principal. La consulta y atención de reclamos de puntos se incluyen como funciones relacionadas, no como calificaciones grupales adicionales.

## 4.4 Requisitos funcionales

| ID  | Función requerida                                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| R01 | Organizar periodos y cursos bajo responsabilidad docente y limitar el acceso a sus usuarios autorizados                                     |
| R02 | Incorporar alumnos desde el padrón, revisar los datos y evitar duplicados o asociaciones al curso incorrecto                                |
| R03 | Permitir al docente definir número y capacidad de grupos y abrir, ampliar o reabrir la ventana para todo el curso                           |
| R04 | Permitir elegir y cambiar de grupo únicamente con ventana abierta y cupo disponible                                                         |
| R05 | Relacionar cada actividad con el grupo y sus integrantes al momento de realizarla                                                           |
| R06 | Registrar y corregir una nota de 0 a 20 por grupo y evaluación, conservando la información del cambio                                       |
| R07 | Registrar puntos individuales y permitir corregir asignaciones sin perder el registro original                                              |
| R08 | Mostrar a cada alumno sus puntos y notas grupales correspondientes al quedar registrados                                                    |
| R09 | Recibir un reclamo por grupo y evaluación de cualquier participante de aquella actividad, y compartirlo con esos participantes y el docente |
| R10 | Recibir un reclamo por movimiento de puntos, privado entre el alumno correspondiente y el docente                                           |
| R11 | Mostrar el recorrido Pendiente → En revisión → Respondido, con decisión final y respuesta motivada del docente                              |
| R12 | Avisar por correo al docente de cada nuevo reclamo mediante mensaje breve y enlace, sin resultados académicos ni texto del reclamo          |
| R13 | Evitar un segundo reclamo sobre el mismo registro, incluso después de su respuesta; no admitir réplica ni reapertura del alumno             |
| R14 | Exportar información por curso, con notas por alumno, puntos y cálculo individual según la regla de trabajo descrita en 5                   |

Estos requisitos expresan el alcance académico acordado. La validación de información y la atención de solicitudes forman parte de la solución sin desplazar el eje de registro y seguimiento de evaluaciones.

## 4.5 Reglas de funcionamiento

- Una nota o un movimiento de puntos confirmado queda visible para sus destinatarios, sin publicación adicional.
- Una nota no registrada permanece vacía o pendiente; cero es una calificación que el docente registra expresamente.
- La nota y el reclamo grupal corresponden a los participantes de la actividad, aunque después cambien de grupo.
- Los estudiantes eligen entre grupos configurados por el docente; no crean grupos ni son asignados automáticamente.
- La reapertura habilita cambios para todo el curso, sujetos a cupo; no concede una excepción individual de selección.
- Responder favorablemente un reclamo no cambia automáticamente una nota o un movimiento: el docente realiza la corrección que proceda.
- El aviso por correo no sustituye la consulta del reclamo y su respuesta en la plataforma.

## 4.6 Condiciones de calidad

La información debe ser comprensible, permitir identificar pendientes y errores y conservar la privacidad de cada actor. Los recorridos deben poder realizarse con teclado, contar con etiquetas y mensajes claros y no comunicar estados solo por color. El registro repetido de una misma acción no debe producir duplicados. Ante un fallo se debe explicar si el registro fue confirmado o necesita revisión.

## 4.7 Exclusiones

No se incluye recepción de trabajos, plazos de entrega, contenidos de clase, asistencia, foros, mensajería general, evaluación automática del contenido, integración con el SUM, actas oficiales, apelaciones, correos al alumno o recordatorios automáticos. La petición de reabrir la ventana de grupos no se incorpora como una categoría adicional de reclamo en la plataforma.

La corrección individual excepcional de una nota grupal se mantiene fuera del alcance. El ajuste individual por puntos en el archivo exportado es una regla distinta, expresamente declarada como supuesto del equipo.

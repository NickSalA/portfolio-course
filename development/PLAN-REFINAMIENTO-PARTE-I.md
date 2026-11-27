# Plan de refinamiento académico y acuerdos vigentes

**Uso:** instrumento interno de edición, no capítulo del informe. **Estado:** revisión de secciones realizada; preparación de la entrega y evaluación posterior pendientes.

Este documento consolida las decisiones de la conversación y reemplaza las formulaciones intermedias que fueron corregidas. No atribuye acuerdos del equipo a una confirmación del profesor.

## 1. Criterio editorial

- El problema y los objetivos corresponden al proyecto completo: desarrollar el sistema de registro y seguimiento de evaluaciones grupales.
- El avance presenta análisis, diseño y prototipo. La distinción de hitos se explica en el plan de desarrollo, no mediante advertencias repetidas en cada sección.
- El informe utiliza lenguaje académico y funcional. No incluye código, herramientas de desarrollo ni inventarios del repositorio.
- Los cambios de grupo son una regla del caso, no el problema principal.
- Se distingue entre relato del profesor transmitido por el solicitante, decisiones del alcance y supuestos del equipo.
- El material del proyecto se utiliza para comprender el caso; no como prueba de eficacia del sistema propuesto.

## 2. Plan aplicado y organización de archivos

| Archivo | Trabajo realizado                                                             |
| ------- | ----------------------------------------------------------------------------- |
| 01      | Realidad problemática, tarea repetitiva, problema, pregunta y justificación   |
| 02      | Objetivo general y cuatro específicos aprobados para el proyecto completo     |
| 03      | Fundamento conceptual de registro, seguimiento, automatización y privacidad   |
| 04      | Contexto, actores, funciones, reglas y exclusiones                            |
| 05      | Propuesta funcional en lugar de arquitectura técnica                          |
| 06      | Desarrollo, cronograma, indicadores propuestos y equipo                       |
| 07      | Conclusiones del análisis y recomendaciones, sin inventario de implementación |
| 08      | Referencias pertinentes, fichas y fuentes pendientes                          |
| 09      | Procesos, prototipo documental actualizado e instrumentos de evaluación       |
| 10      | Compilación de las secciones fuente para maquetar el informe                  |
| README  | Orientación de lectura, criterios y preparación de entrega                    |

Se ajustaron los nombres de 05 y 07 para que correspondan a su contenido: `05-propuesta-de-solucion.md` y `07-conclusiones-y-recomendaciones.md`.

## 3. Problema y objetivos acordados

### Antecedentes

Según el relato del solicitante, el docente recibía del SUM un XLSX de alumnos y preparaba su propia plantilla de notas. Revisaba los entregables para identificar grupos e integrantes, buscaba a cada alumno en el archivo y anotaba la misma calificación uno por uno. Los estudiantes no tenían un medio individual de consulta de puntos durante el ciclo, salvo sus propias anotaciones. El solicitante identifica el tiempo como una probable dificultad; el profesor no confirmó esa prioridad y no existen mediciones aportadas.

### Eje y pregunta

Registro y seguimiento son dos etapas de la gestión de evaluaciones. El seguimiento comprende consulta de resultados propios y atención de reclamos, no seguimiento integral del aprendizaje.

> ¿En qué medida el uso de una plataforma de gestión académica contribuye a mejorar el registro y seguimiento de las evaluaciones grupales en los cursos del docente del caso de estudio?

### Objetivo general

> Desarrollar una plataforma de gestión académica para el registro y seguimiento de las evaluaciones grupales en los cursos del docente del caso de estudio.

### Objetivos específicos

1. Analizar el proceso actual de registro y seguimiento de las evaluaciones grupales para identificar las necesidades de los docentes y estudiantes.
2. Diseñar el funcionamiento de la plataforma a partir de los requisitos y las reglas del proceso de evaluación.
3. Implementar las funciones de registro y seguimiento de las evaluaciones grupales y las funciones de apoyo necesarias para su operación.
4. Evaluar la contribución de la plataforma al registro y seguimiento de las evaluaciones grupales mediante pruebas de funcionamiento e indicadores acordados.

## 4. Acuerdos funcionales vigentes

### Contexto y grupos

- La incorporación del padrón, su validación, el acceso, la matrícula y la selección de grupos apoyan el proceso; no son objetivos independientes.
- El docente define número y capacidad de grupos y la ventana de selección.
- El alumno puede elegir o cambiar de grupo durante la ventana si hay cupo.
- El docente puede ampliar o reabrir la ventana para todo el curso, no solo para un alumno.
- Una petición de reapertura no crea automáticamente una categoría de solicitud en la plataforma. No se acordó un traslado directo docente como función adicional.
- La plataforma no recibe tareas ni gestiona sus plazos de entrega.

### Registro y consulta

- El docente determina la nota y registra una calificación de 0 a 20 por grupo y evaluación.
- Notas y puntos quedan visibles a sus destinatarios al confirmarse su registro. No hay publicación posterior separada.
- Cada alumno consulta sus puntos y las notas grupales correspondientes a su participación en cada actividad.
- La pertenencia actual no altera la atribución de resultados pasados ni concede acceso a otros reclamos.
- Vacío significa pendiente; cero es una nota registrada expresamente. La regla se conserva en el archivo exportado.

### Reclamos

- Cualquier participante de una actividad puede presentar el único reclamo de su grupo para esa evaluación. Los participantes históricos y el docente pueden consultarlo y ver la respuesta.
- Los reclamos sobre puntos corresponden a un movimiento propio y son privados entre el alumno y el docente.
- Estados: **Pendiente → En revisión → Respondido**.
- El docente toma la decisión final y explica el motivo. No hay réplica, reapertura ni otro reclamo sobre el mismo registro.
- Una respuesta favorable no modifica automáticamente notas o puntos; el docente realiza la corrección expresamente.
- Cada reclamo nuevo genera un correo al docente con aviso breve y enlace, sin notas, puntos ni texto del reclamo.
- No se añaden avisos al alumno, recordatorios, apelaciones ni escalamiento.

La consulta de notas grupales y los reclamos dentro de la plataforma son ampliaciones acordadas con el solicitante. Reemplazan las exclusiones iniciales y no se atribuyen como peticiones iniciales literales del profesor.

## 5. Exportación y supuesto de aplicación de puntos

La exportación es por curso, con notas por alumno, puntos y resultados calculados; no se integra con el SUM ni equivale a un acta oficial. El detalle de columnas sigue siendo revisable.

La aplicación de puntos fue definida con el solicitante al no poder consultar de nuevo al profesor. Su condición de **supuesto de trabajo del equipo** debe permanecer explícita.

- Los puntos son individuales y distintos de las notas grupales base, pero se contempla su aplicación académica al exportar.
- Cada punto aumenta una unidad de nota individual en los trabajos con margen, con máximo de 20 por trabajo.
- La distribución es automática; todos los trabajos tienen igual peso.
- Los puntos se aplican una sola vez dentro del cálculo y no se añade el saldo completo a cada trabajo ni al promedio.
- Las notas grupales base y los resultados de los compañeros no cambian.
- El excedente cuando todos los trabajos llegan a 20 no tiene efecto adicional y no se borra.
- La exportación no consume ni modifica el saldo. Con iguales entradas, repetirla mantiene los resultados académicos.
- Una nota pendiente permanece vacía y no se presenta un promedio final ajustado completo si faltan notas del conjunto de trabajos incluido.
- El promedio tiene dos decimales; solo se redondea al final.

Para notas completas y saldo no negativo, puntos aplicados = menor entre saldo y suma de márgenes hasta 20; promedio ajustado = suma de notas base más puntos aplicados, dividida entre número de trabajos. La distribución por trabajo no necesita mostrarse para obtener ese promedio.

## 6. Pendientes reales y preguntas de cierre

Estos asuntos no impiden presentar la propuesta, pero deben resolverse antes de cerrar su funcionamiento o evaluación.

| Tema              | Pregunta pendiente                                                                                         | Tratamiento en el informe                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Cálculo de puntos | ¿Cómo se trata un saldo negativo y qué movimientos entran en el cálculo?                                   | No inventar penalizaciones o bonificaciones; precisar antes del desarrollo                              |
| Archivo XLSX      | ¿Qué columnas definitivas y datos identificativos mínimos se requieren?                                    | Mostrar propuesta revisable, sin notas ajustadas por trabajo que impliquen una distribución no acordada |
| Registro de notas | ¿Qué precisión decimal se admite en cada nota?                                                             | Mantener rango acordado; no deducir precisión del promedio                                              |
| Temporalidad      | ¿Cómo se ordenan actividad y cambio de grupo si coinciden y cómo se revisa información histórica incierta? | Mantener regla de participantes de la actividad y revisión docente de ambigüedades                      |
| Aviso al docente  | ¿Qué se informa y cómo se procede si falla el correo?                                                      | Reclamo permanece registrado; detalle de recuperación por definir                                       |
| Prototipo         | ¿La representación textual se convertirá en maqueta visual o interactiva para exponer?                     | P-01 identifica honestamente el artefacto documental disponible                                         |
| Evaluación        | ¿Qué participantes, escenarios y repeticiones se utilizarán?                                               | Indicadores propuestos; sin metas numéricas ni línea base histórica inventada                           |
| Equipo y entrega  | ¿Cuáles son nombres, responsables, fechas y datos de carátula?                                             | Mantener campos por completar                                                                           |

No se exige una nueva consulta al profesor como condición para avanzar: cuando no sea posible obtenerla, el equipo debe declarar y revisar sus supuestos, no atribuirlos a él.

## 7. Comprobación editorial y próximos pasos

La revisión debe comprobar correspondencia entre problema, objetivos, alcance, propuesta, prototipo y plan; retirar reglas reemplazadas; conservar fuentes y supuestos identificados; y reproducir las secciones fuente en el integrado.

La documentación externa a esta carpeta conserva su propio alcance anterior y puede diferir de las decisiones aquí consolidadas. No se modifica desde este refinamiento. El informe utiliza los acuerdos vigentes del caso y no afirma que esas ampliaciones ya estén operativas.

**Próximos pasos:** revisar el texto con el equipo, completar los pendientes de entrega, decidir la representación visual del prototipo y preparar informe y presentación. Los indicadores y pruebas orientarán después la evaluación del proyecto.

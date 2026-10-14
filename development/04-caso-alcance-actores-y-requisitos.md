# 4. Caso de aplicación, alcance, actores y requisitos

## 4.1 Visión de plataforma y frontera de automatización

| Elemento                      | Relación con el caso                                                              | Frontera académica                                              |
| ----------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Acceso docente y estudiantil  | Identifica a la persona                                                           | Dependencia; autenticación no equivale a autorización           |
| Autorización                  | Determina rol y acceso al curso                                                   | Regla transversal del diseño                                    |
| Periodos y cursos             | Un periodo organiza cursos; cada curso tiene un responsable                       | Contexto organizativo, no gestión institucional completa        |
| Incorporación y matrícula     | El XLSX del SUM prepara autorizaciones; la cuenta coincidente se vincula al curso | Entrada; no importa notas ni supone matrícula oficial en el SUM |
| Grupos y selección            | Organización por curso, cupo y ventana; traslado por docente                      | Dependencia temporal indispensable para atribuir notas          |
| Puntos individuales           | Movimientos asociados al alumno autorizado                                        | Contexto separado; no son notas ni intervienen en su cálculo    |
| Evaluaciones y notas grupales | Actividad fechada y nota por grupo                                                | Núcleo del proceso a automatizar y evaluar                      |
| Conciliación                  | Revisión docente de grupos esperados, notas y excepciones                         | Cierre controlado propuesto                                     |

Los cursos pueden organizarse sin grupos dentro de la visión general, pero el experimento propuesto se limita a un curso con evaluación grupal. La ruta pública de portafolio no pertenece al caso.

## 4.2 Actores y permisos previstos

- **Docente responsable:** prepara las entradas de sus cursos, organiza grupos, autoriza traslados, define actividades, registra y corrige notas grupales y revisa la conciliación. No opera sobre cursos ajenos.
- **Alumno autorizado:** accede a sus cursos y matrícula, consulta grupo vigente y puntos propios y selecciona grupo dentro de la ventana y cupo. No consulta ni modifica notas grupales en el alcance propuesto.
- **Servicios de identidad y datos:** apoyan autenticación, persistencia y controles; no sustituyen la responsabilidad académica del docente.
- **Equipo del trabajo:** analiza y diseña en Parte I; implementaría y evaluaría en Parte II. No es un rol de usuario de la plataforma.

## 4.3 Flujo propuesto

**Preparación dependiente:** seleccionar periodo y curso → incorporar alumnos desde el padrón → vincular cuentas autorizadas y matrículas → organizar grupos y registrar sus pertenencias.

**Proceso central:** docente identifica curso y actividad → define fecha de realización → consulta grupos aplicables históricamente → introduce nota → se comprueban permisos, curso y rango → se propone confirmar el registro y conservar evidencia → si procede, corrige sin borrar el historial → revisa grupos calificados, faltantes y excepciones → concilia o mantiene pendiente la evaluación.

El flujo describe el comportamiento esperado. No representa una ejecución. Los diagramas y el recorrido de baja fidelidad están en 09.

## 4.4 Requisitos de la propuesta

Los identificadores R se usan en esta carpeta para distinguir los requisitos del núcleo de las especificaciones técnicas más amplias. No sustituyen ni modifican los FR externos.

| ID  | Requisito esperado                                                                         | Relación con fuentes técnicas        |
| --- | ------------------------------------------------------------------------------------------ | ------------------------------------ |
| R1  | Restringir acceso por identidad, rol y responsabilidad sobre el curso                      | FR-001–005                           |
| R2  | Recibir autorizaciones, matrículas y grupos coherentes del curso, sin importar notas       | FR-006–013, como dependencias        |
| R3  | Determinar pertenencia por fecha de actividad y conservar traslados sin solapamientos      | FR-014–017                           |
| R4  | Definir una actividad identificable y fechada; revisar el impacto de cambiar su fecha      | FR-018–019                           |
| R5  | Registrar una nota vigente de 0 a 20 por grupo y evaluación del mismo curso                | FR-020–022                           |
| R6  | Distinguir éxito, rechazo, fallo e incertidumbre; permitir reintentos sin duplicar efectos | FR-023–024                           |
| R7  | Conservar valores anterior/nuevo, responsable e instante de una corrección grupal          | FR-025–026, FR-036                   |
| R8  | Conciliar grupos esperados, calificados, faltantes y excepciones, sin ocultar pendientes   | FR-033–037                           |
| R9  | Separar puntos y notas; limitar la vista estudiantil a datos propios permitidos            | FR-028–032                           |
| R10 | Diseñar evidencias e indicadores seguros y reproducibles para la evaluación futura         | FR-038–039 y protocolo de evaluación |

Se priorizan como obligatorios del **diseño** R1–R10. Los filtros avanzados y resúmenes visuales son mejoras opcionales. Esta prioridad no significa que esas funciones se implementen en semana 8. En Parte II, las dependencias deberán estar disponibles y verificadas para ensayar el núcleo, sin convertir cada módulo en un experimento independiente.

## 4.5 Reglas y excepciones

1. Un curso tiene un docente responsable para este caso; no se diseña codocencia.
2. El archivo institucional incorpora alumnos, nunca calificaciones.
3. Autorización previa y matrícula de una cuenta autenticada son conceptos distintos; el dominio institucional por sí solo no otorga acceso al curso.
4. La nota es grupal, de 0 a 20. La precisión decimal debe confirmarse; un campo vacío será pendiente, no cero ni nota válida.
5. Una corrección de nota grupal alcanza a la población histórica de la actividad, aunque después existan traslados.
6. La selección estudiantil requiere ventana abierta y cupo; el docente puede autorizar un traslado fuera de ella.
7. No se inventan fechas ni pertenencias desconocidas. Se identifica la incertidumbre para revisión.
8. Una excepción grupal documenta una incidencia; no crea una nota individual ni convierte puntos en calificaciones.

Casos previstos: límites 0/20; nota inválida; cruce de cursos; acceso estudiantil a notas; docente ajeno; actividad antes/después de traslado; actividad y traslado del mismo día; competencia por último cupo; corrección concurrente; respuesta perdida y reintento; cambio de fecha; historia insuficiente. Sus pruebas se planifican para Parte II.

## 4.6 Condiciones no funcionales y exclusiones

El diseño considera mínimo privilegio, privacidad, consistencia transaccional, accesibilidad de teclado, errores comprensibles, recuperación ante incertidumbre y señales correlacionables. No garantiza disponibilidad, rendimiento o recuperación productiva sin comprobación futura.

Quedan excluidos exportación oficial de actas o notas, corrección individual excepcional, importación de notas, conversión de puntos en notas, panel institucional adicional, contenidos, entregas, asistencia, foros, notificaciones y nuevos tipos de evaluación. Una descarga técnica XLSX hallada en el código de referencia no demuestra exportación oficial ni cambia este alcance (véase 07).

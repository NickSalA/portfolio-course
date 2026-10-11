# Feature Specification: Gestión integral de evaluación grupal

**Feature Branch**: `no creada; no se ejecutó hook de rama`

**Created**: 2026-10-11

**Status**: Draft — alcance funcional final de Parte II; ninguna capacidad se considera terminada hasta verificarse con evidencia

**Input**: Definir el producto mínimo final para automatizar y controlar la preparación de cursos, incorporación de alumnos, organización de grupos, definición de evaluaciones y registro de calificaciones grupales.

## Process Scope

### Inicio y fin

El proceso evaluado comienza cuando un docente autenticado prepara un periodo y un curso bajo su responsabilidad para incorporar alumnado autorizado. Continúa con la importación, matrícula, organización de grupos, definición de actividades y registro o corrección de calificaciones grupales. Finaliza cuando el docente concilia una evaluación: todos los grupos esperados tienen una calificación válida o una excepción explícitamente identificada, el resultado es visible para el docente y existe evidencia anonimizada suficiente para explicar éxitos, rechazos, errores, reintentos y correcciones.

La recepción del archivo institucional precede al proceso; su importación de alumnos sí está incluida. No se importan calificaciones desde archivos. La elaboración del informe y la presentación usa la evidencia del proceso, pero no forma parte de su ejecución.

### Actores y responsabilidades

- **Docente**: administra únicamente sus periodos y cursos; revisa la importación; autoriza y matricula alumnos; crea grupos; gestiona traslados; define evaluaciones y su fecha de actividad; registra, corrige y concilia notas grupales; atiende excepciones; y valida la evidencia.
- **Alumno**: inicia sesión con una identidad autorizada, completa su vinculación al curso, consulta sus cursos y su grupo vigente, selecciona grupo cuando la ventana está habilitada y consulta sus puntos individuales. No administra cursos, grupos ajenos, evaluaciones ni calificaciones, y no consulta calificaciones grupales en esta entrega.
- **Sistema**: autentica; aplica permisos; valida reglas académicas; preserva historia; evita duplicados; comunica resultados y errores; permite recuperación segura; y produce señales y evidencia sin exponer datos personales innecesarios.

### Clasificación MoSCoW

#### Must — obligatorias para la entrega

1. Autenticación con Google y autorización académica por rol, docente responsable y alumno autorizado.
2. Gestión docente de periodos y cursos necesaria para preparar el proceso.
3. Importación validada de alumnos, autorización previa y vinculación de la cuenta correcta.
4. Matrícula controlada y visible en el curso correspondiente.
5. Creación de grupos, selección estudiantil dentro de ventana y traslado docente controlado.
6. Historia de pertenencia a grupos suficiente para resolver el grupo aplicable en la fecha de cada actividad.
7. Definición docente de evaluaciones grupales, incluyendo fecha de actividad y rango permitido.
8. Registro y corrección de una nota por grupo y evaluación, con trazabilidad y reintentos sin duplicación.
9. Vista docente para preparar, registrar, corregir y conciliar el proceso; vista estudiantil de curso, grupo vigente y puntos, sin notas grupales.
10. Puntos individuales separados semántica y funcionalmente de las calificaciones.
11. Validaciones de rango, pertenencia y permisos en límites confiables del sistema y políticas de acceso a datos.
12. Casos válidos, inválidos y excepcionales probados con datos sintéticos o anonimizados en un entorno no productivo.
13. Evidencia del resultado de operaciones, correcciones, errores, reintentos, conciliación y señales operativas.
14. Comparación reproducible con la línea base manual mediante los indicadores definidos en esta especificación.

#### Should — importantes si el tiempo lo permite

1. Importación con vista previa detallada de filas válidas, duplicadas y rechazadas antes de confirmar.
2. Filtros y resumen de faltantes para acelerar la conciliación por evaluación.
3. Señal activa dirigida al responsable cuando se produzcan fallos repetidos de guardado o autorización en el entorno evaluado.
4. Verificación documentada de recuperación operativa en un entorno aislado usando mecanismos disponibles, sin exigir respaldos automáticos nuevos.

#### Could — mejoras opcionales

1. Búsqueda y ordenamiento avanzado de alumnos, grupos y evaluaciones.
2. Resumen visual de avance por curso y evaluación.
3. Descarga de evidencia anonimizada del experimento, distinta de una exportación oficial de calificaciones.
4. Ayudas contextuales para explicar reglas de grupo, puntos y notas.

#### Won't — fuera de esta entrega

1. Exportación oficial de calificaciones o actas.
2. Correcciones individuales excepcionales de una calificación y su revocación.
3. Notificaciones por correo, mensajería o push.
4. Panel administrativo separado.
5. Nuevos tipos de calificación distintos de la nota grupal de 0 a 20.
6. Implementación de respaldos automáticos o promesa de recuperación productiva no verificada.
7. Funcionalidades generales de LMS como contenidos, tareas, entregas, asistencia, foros o mensajería.
8. Importación de notas desde XLSX/CSV.
9. Pruebas destructivas en producción o certificación de controles de un entorno no verificado.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Preparar curso y alumnado (Priority: P1)

Como docente responsable, quiero preparar el periodo y curso e incorporar alumnos desde el archivo institucional para trabajar con una lista autorizada y consistente.

**Why this priority**: Es la entrada controlada de todo el flujo y evita operar con identidades o cursos incorrectos.

**Independent Test**: Con datos sintéticos, crear un curso, importar un archivo con filas válidas, repetidas e inválidas, confirmar las válidas y comprobar autorizaciones, matrículas y rechazos sin afectar otro curso.

**Acceptance Scenarios**:

1. **Given** un docente responsable y un archivo válido, **When** confirma la importación, **Then** se crean o actualizan las autorizaciones esperadas una sola vez y se informa el resultado por fila y el resumen.
2. **Given** filas inválidas o repetidas, **When** se procesa el archivo, **Then** se rechazan o consolidan según la regla declarada, no se crean duplicados y se explica cada resultado.
3. **Given** una identidad no autorizada, **When** intenta vincularse al curso, **Then** se rechaza la matrícula sin revelar información académica del curso.
4. **Given** un docente ajeno, **When** intenta consultar o modificar el curso, **Then** se deniega la operación tanto por el servicio como por el acceso a datos.

---

### User Story 2 - Organizar grupos con historia (Priority: P1)

Como docente y alumno autorizado, quiero organizar la matrícula en grupos y conservar la historia de traslados para atribuir cada actividad al grupo correcto.

**Why this priority**: La pertenencia histórica es imprescindible para que los cambios posteriores no alteren retroactivamente calificaciones.

**Independent Test**: Crear dos grupos, seleccionar uno dentro de la ventana, ejecutar un traslado docente y comprobar el grupo vigente y los intervalos históricos antes, durante y después de fechas de actividad conocidas.

**Acceptance Scenarios**:

1. **Given** un alumno matriculado y una ventana abierta, **When** selecciona un grupo válido con cupo, **Then** queda como miembro vigente una sola vez y se preserva el historial.
2. **Given** una ventana cerrada, **When** el alumno intenta cambiar de grupo, **Then** se rechaza sin alterar su pertenencia.
3. **Given** un traslado aprobado por el docente, **When** se completa, **Then** se cierra la pertenencia anterior, se inicia la nueva sin solapamiento y las actividades pasadas conservan el grupo aplicable en su fecha.
4. **Given** una actividad y un traslado en el mismo día, **When** se determina la pertenencia, **Then** se aplica la hora institucional registrada para ambos eventos y no una inferencia por fecha de guardado.

---

### User Story 3 - Registrar y corregir notas grupales (Priority: P1)

Como docente responsable, quiero definir una evaluación y registrar o corregir una calificación por grupo para completar la evaluación de forma controlada y explicable.

**Why this priority**: Es la operación central que reemplaza el registro disperso en archivos.

**Independent Test**: Definir una actividad, registrar notas para sus grupos, provocar una entrada fuera de rango y un fallo de guardado, reintentar y corregir una nota anterior verificando estado final, ausencia de duplicados e historial.

**Acceptance Scenarios**:

1. **Given** una evaluación y grupo del mismo curso, **When** el docente responsable guarda una nota de 0 a 20 inclusive, **Then** queda una sola calificación vigente para la pareja y se confirma el resultado.
2. **Given** una nota fuera de rango o entidades de cursos distintos, **When** se intenta guardar, **Then** se rechaza sin cambios parciales y se muestra un error accionable.
3. **Given** un fallo cuyo resultado no es confirmable, **When** el docente reintenta la misma operación, **Then** el estado converge a una sola calificación y el sistema informa el resultado definitivo.
4. **Given** una nota existente, **When** el docente la corrige, **Then** se preservan valor anterior, valor nuevo, momento y responsable; la nota vigente cambia una sola vez.
5. **Given** alumnos que pertenecían al grupo en la fecha de actividad pero luego fueron trasladados, **When** se corrige la nota de aquel grupo, **Then** la corrección aplica a esos participantes históricos y no a la composición actual.

---

### User Story 4 - Consultar y conciliar resultados (Priority: P2)

Como docente, quiero visualizar el avance por evaluación y distinguir registros completos, faltantes y errores para cerrar el proceso con evidencia.

**Why this priority**: Convierte el registro en un proceso controlable y medible, no solo en captura de datos.

**Independent Test**: Preparar una evaluación con grupos calificados, faltantes y trasladados; comprobar el conteo esperado, el detalle docente y la evidencia anonimizada de conciliación.

**Acceptance Scenarios**:

1. **Given** una evaluación con grupos esperados, **When** el docente la consulta, **Then** ve cada grupo aplicable, su estado de calificación y los faltantes sin mezclar cursos.
2. **Given** todos los grupos atendidos o una excepción explícita, **When** se concilia, **Then** se registra el resultado, conteos, momento y responsable.
3. **Given** un alumno autenticado, **When** consulta su área, **Then** ve solo cursos autorizados, grupo vigente y puntos propios; no ve calificaciones grupales ni información de otros alumnos.

---

### User Story 5 - Evaluar frente al proceso manual (Priority: P2)

Como equipo del curso, quiero ejecutar un protocolo comparable contra la línea base manual para demostrar resultados reales sin inventar métricas.

**Why this priority**: La Parte II exige implementar, probar y evaluar el proceso con evidencia reproducible.

**Independent Test**: Ejecutar la misma actividad y volumen conocido de grupos en el método manual y en la plataforma, repetir las mediciones y calcular todos los indicadores definidos.

**Acceptance Scenarios**:

1. **Given** un conjunto sintético equivalente, **When** se ejecutan ambos métodos, **Then** se registran condiciones, volumen, tiempos, resultados y discrepancias de cada repetición.
2. **Given** casos inválidos y fallos planificados, **When** se ejecuta la batería, **Then** se conserva evidencia de detección, mensajes, reintentos y ausencia o presencia de duplicados.
3. **Given** resultados observados, **When** se prepara la evaluación final, **Then** se distinguen claramente metas, resultados medidos, limitaciones y capacidades pendientes.

### Edge Cases

- Una fila importada repite a un alumno en el mismo archivo o ya autorizado en el curso.
- El correo autenticado no coincide con ninguna autorización o pertenece a otro curso.
- Dos solicitudes intentan ocupar el último cupo o cambiar al mismo alumno simultáneamente.
- Un grupo se intenta eliminar cuando es necesario para explicar una actividad histórica.
- La fecha de una actividad se modifica después de registrar notas o traslados; el sistema identifica las atribuciones afectadas y exige revisión docente antes de confirmar.
- Una actividad y un traslado ocurren el mismo día; se resuelven por instante y zona horaria institucionales.
- El grupo o la evaluación pertenecen a cursos distintos, fueron desactivados o dejaron de estar disponibles durante la operación.
- La nota es vacía, no numérica, menor que 0 o mayor que 20.
- El guardado falla antes o después de recibir confirmación y el docente reintenta.
- Se envía dos veces la misma operación o dos correcciones compiten; solo un estado vigente resulta y cada cambio confirmado es trazable.
- Un docente intenta operar sobre un curso ajeno o un alumno intenta leer o escribir notas.
- Una pertenencia histórica previa no puede reconstruirse con evidencia; se marca para revisión y no se inventa.
- La señal operativa no está disponible; la operación académica informa el resultado y la carencia se documenta sin afirmar monitoreo inexistente.

## Requirements _(mandatory)_

### Functional Requirements

#### Identidad, autorización y preparación

- **FR-001**: El sistema DEBE autenticar a docentes y alumnos mediante Google y asociar cada sesión con una identidad única.
- **FR-002**: El sistema DEBE separar autenticación de autorización académica y denegar por defecto toda operación sin rol, responsabilidad de curso o autorización estudiantil suficiente.
- **FR-003**: El docente DEBE poder crear, consultar y actualizar los periodos y cursos bajo su responsabilidad requeridos para iniciar el proceso.
- **FR-004**: Ningún docente DEBE consultar o modificar información académica de un curso del que no sea responsable.
- **FR-005**: Toda autorización académica DEBE comprobarse en el servidor y mediante políticas RLS; los controles de interfaz no DEBEN ser el único mecanismo.

#### Incorporación y matrícula

- **FR-006**: El docente DEBE poder importar una lista de alumnos con formato y campos obligatorios definidos, antes de confirmar cambios.
- **FR-007**: El sistema DEBE informar por fila y en resumen cuáles entradas son válidas, inválidas, duplicadas o ya existentes, con razones accionables.
- **FR-008**: Repetir una importación equivalente NO DEBE crear autorizaciones ni matrículas duplicadas.
- **FR-009**: Solo una cuenta cuyo identificador autenticado coincida con una autorización vigente DEBE poder vincularse como alumno del curso correspondiente.
- **FR-010**: La matrícula DEBE pertenecer a un único curso y alumno, tener un estado explícito y no conceder acceso a otros cursos.

#### Grupos e historia

- **FR-011**: El docente DEBE poder crear y gestionar grupos pertenecientes exclusivamente a sus cursos.
- **FR-012**: Un alumno matriculado DEBE poder seleccionar un grupo del propio curso únicamente dentro de la ventana habilitada y sujeto a disponibilidad.
- **FR-013**: El docente responsable DEBE poder efectuar un traslado administrativo fuera de la ventana, con un resultado explícito y trazable.
- **FR-014**: Toda selección o traslado DEBE cerrar la pertenencia anterior y abrir la nueva como una operación indivisible, sin intervalos solapados.
- **FR-015**: El sistema DEBE conservar pertenencias históricas y evitar eliminar información de grupo necesaria para explicar evaluaciones previas.
- **FR-016**: Para cada alumno y actividad, el grupo aplicable DEBE ser el grupo al que pertenecía en el instante de realización de la actividad, no el grupo vigente al guardar o corregir la nota.
- **FR-017**: Actividades y traslados del mismo día DEBEN resolverse usando fecha, hora y zona horaria institucionales explícitas.

#### Evaluaciones y calificaciones

- **FR-018**: El docente responsable DEBE poder definir una evaluación grupal asociada a uno de sus cursos, con nombre identificable, fecha y hora de actividad, y calificación mínima 0 y máxima 20.
- **FR-019**: Cambiar la fecha de una evaluación con notas o traslados relacionados DEBE identificar las atribuciones afectadas y requerir confirmación docente de su revisión.
- **FR-020**: El docente responsable DEBE poder registrar una única nota vigente por pareja grupo-evaluación cuando ambos pertenecen al mismo curso.
- **FR-021**: La nota DEBE aceptar únicamente valores numéricos entre 0 y 20 inclusive y rechazar cualquier otro valor sin cambios parciales.
- **FR-022**: El sistema DEBE validar que evaluación, grupo, docente y curso sean coherentes antes de registrar o corregir una nota, y DEBE reforzar esa coherencia con integridad de datos además de permisos.
- **FR-023**: Repetir una solicitud de guardado equivalente DEBE producir el mismo estado final sin crear notas duplicadas.
- **FR-024**: Ante un fallo, el sistema DEBE informar si la operación fue rechazada, falló o tiene resultado incierto, y permitir una recuperación o reintento seguro.
- **FR-025**: El docente responsable DEBE poder corregir una nota grupal preservando valor anterior, valor nuevo, momento y responsable de cada corrección confirmada.
- **FR-026**: Corregir una nota anterior DEBE afectar a quienes pertenecían a ese grupo en la fecha de la actividad, aunque hoy estén en otro grupo; NO DEBE reasignar pertenencias.
- **FR-027**: La corrección individual excepcional NO DEBE estar disponible en Parte II; los casos que la requieran DEBEN quedar identificados como excepción pendiente sin alterar la nota grupal ni usar puntos como sustituto.

#### Puntos y vistas

- **FR-028**: El sistema DEBE presentar y almacenar los puntos como movimientos individuales separados de las evaluaciones y calificaciones; un punto NO DEBE convertirse ni interpretarse como nota.
- **FR-029**: La corrección de puntos DEBE preservar el movimiento original mediante anulación o ajuste, sin borrado destructivo de historia.
- **FR-030**: El docente DEBE visualizar, por sus cursos, alumnado autorizado, matrículas, grupos vigentes e históricos relevantes, evaluaciones, notas vigentes, correcciones y estado de conciliación.
- **FR-031**: El alumno DEBE visualizar únicamente sus cursos autorizados, matrícula, grupo vigente y movimientos o saldo de puntos propios.
- **FR-032**: El alumno NO DEBE consultar directa ni indirectamente notas grupales en esta entrega, ni modificar periodos, cursos, matrículas, grupos ajenos, evaluaciones, notas o puntos.

#### Estados, eventos y evidencia

- **FR-033**: El proceso DEBE distinguir al menos estos estados: curso en preparación/listo; importación pendiente/validada/confirmada/fallida; matrícula pendiente/activa/inactiva; ventana de grupos cerrada/abierta; pertenencia vigente/cerrada; evaluación definida/con registro parcial/conciliada; operación pendiente/exitosa/rechazada/fallida/resultado incierto.
- **FR-034**: El sistema DEBE reconocer como eventos relevantes: autenticación, importación validada o confirmada, vinculación de matrícula, apertura o cierre de ventana, selección o traslado de grupo, creación o cambio de fecha de evaluación, guardado o corrección de nota, fallo, reintento y conciliación.
- **FR-035**: Cada intento de registrar o corregir una nota DEBE dejar evidencia correlacionable con curso y evaluación, tipo de operación, instante, resultado y categoría de error, sin incluir nombres, correos, secretos ni calificaciones en señales expuestas.
- **FR-036**: La trazabilidad académica de una corrección DEBE conservar sus valores y responsable con acceso restringido al docente correspondiente; no debe depender de logs públicos.
- **FR-037**: El docente DEBE poder conciliar grupos esperados contra notas registradas y distinguir completos, faltantes, rechazados y excepciones pendientes.
- **FR-038**: La evidencia de prueba DEBE registrar fecha, versión o PR evaluado, entorno, conjunto sintético o anonimizado, pasos, resultado esperado, resultado observado y referencia a señales pertinentes.
- **FR-039**: Las capacidades, métricas y controles DEBEN etiquetarse como pendientes, verificados o evaluados según evidencia; la documentación o el código por sí solos no prueban operación.

### Requirement Verification Map

| Área                 | Verificación mínima observable                                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Identidad y acceso   | Inicio de sesión válido; alumno no autorizado rechazado; acceso cruzado entre docentes/cursos rechazado por servicio y RLS. |
| Importación          | Archivo mixto produce conteos y motivos correctos; repetirlo no duplica datos.                                              |
| Matrícula y grupos   | Vinculación autorizada; selección dentro de ventana; rechazo fuera de ventana; traslado conserva intervalos no solapados.   |
| Historia             | Actividades antes y después de un traslado resuelven grupos diferentes y correctos; caso del mismo día respeta el instante. |
| Evaluaciones y notas | Rango 0–20; pertenencia al mismo curso; una nota vigente por grupo/evaluación; corrección trazable.                         |
| Fallo y reintento    | Fallo provocado queda visible; reintento converge sin duplicar; resultado final se puede conciliar.                         |
| Vistas               | Docente ve solo sus cursos; alumno ve sus datos permitidos y no obtiene notas grupales.                                     |
| Puntos               | Movimiento individual separado; anulación conserva historia; ninguna vista lo presenta como calificación.                   |
| Evidencia            | Casos válidos, inválidos y excepcionales reproducibles sin datos reales ni secretos.                                        |

### Non-Functional Requirements

- **NFR-001 Security**: Se DEBE aplicar mínimo privilegio, denegación por defecto, sesiones protegidas y controles redundantes de servidor y RLS para toda información académica.
- **NFR-002 Privacy**: Pruebas, capturas, logs, informes y PR DEBEN usar datos sintéticos o anonimizados y excluir secretos e información personal innecesaria.
- **NFR-003 Integrity**: Operaciones que cambian matrícula, grupo o nota DEBEN ser indivisibles o recuperables, preservar invariantes y no dejar estados parciales aceptados como éxito.
- **NFR-004 Accessibility**: Los flujos Must DEBEN ser operables por teclado, conservar foco visible, usar etiquetas y mensajes asociables a campos, y no depender solo del color para comunicar estado o error.
- **NFR-005 Performance**: Con el volumen sintético acordado para un curso, el 95 % de confirmaciones de acciones interactivas Must DEBE mostrarse en 2 segundos o menos, excluyendo carga y procesamiento de archivos; una operación más larga DEBE mostrar progreso y evitar doble envío.
- **NFR-006 Recovery**: Los fallos y resultados inciertos DEBEN admitir reintento seguro y conciliación; ninguna promesa de respaldo o restauración productiva se considerará cumplida sin verificación independiente.
- **NFR-007 Observability**: Éxitos, rechazos y errores críticos del proceso DEBEN emitir señales correlacionables, clasificadas y restringidas; su disponibilidad y prueba DEBEN documentarse sin inventar tasas ni cobertura.
- **NFR-008 Maintainability**: Cada incremento DEBE poder revisarse en un PR acotado con criterios, pruebas y documentación; reglas académicas compartidas DEBEN tener una fuente inequívoca y pruebas de regresión.
- **NFR-009 Environment Safety**: Pruebas destructivas, fallos provocados y reinicios DEBEN ejecutarse solo en un entorno aislado, nunca en producción.
- **NFR-010 Base Architecture**: El producto DEBE conservar Next.js, Supabase y PostgreSQL como arquitectura base; cualquier complejidad adicional requiere justificación separada durante planificación.

### Key Entities

- **Identidad/Perfil**: persona autenticada y su rol general; no concede por sí sola autorización académica.
- **Periodo académico**: año y término que agrupan cursos.
- **Curso**: unidad académica bajo responsabilidad de un docente y dentro de un periodo.
- **Alumno autorizado**: invitación o autorización previa para que una identidad concreta acceda a un curso.
- **Matrícula**: vínculo entre alumno y curso, con estado y pertenencias asociadas.
- **Grupo**: agrupación dentro de un curso, con identidad preservable cuando participa en actividades históricas.
- **Pertenencia a grupo**: intervalo temporal de una matrícula en un grupo o sin grupo, sin solapamientos.
- **Evaluación grupal**: actividad de un curso con fecha/hora académica y rango de nota.
- **Calificación grupal**: valor vigente de 0 a 20 para una pareja grupo-evaluación.
- **Corrección de calificación**: cambio trazable entre valores grupales, con instante y docente responsable.
- **Movimiento de puntos**: asignación o anulación individual no equivalente a una calificación.
- **Evidencia de operación**: registro no sensible del intento, resultado, error, reintento o conciliación.

## Evaluation Against Manual Baseline

El equipo comparará el método anterior y la plataforma usando la misma actividad, igual número de grupos, el mismo conjunto sintético o anonimizado y condiciones registradas. Se realizarán al menos tres repeticiones completas por método, salvo que el informe justifique una limitación. No se declararán mejoras antes de medir.

| Indicador                  | Definición                                                                                                             | Evidencia requerida                                         |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Tiempo por evaluación      | Mediana de minutos desde que el docente dispone de grupos y notas fuente hasta que termina el registro y conciliación. | Cronometraje por repetición, volumen y condiciones.         |
| Cobertura/completitud      | Grupos esperados con nota válida o excepción explícita / total de grupos esperados.                                    | Conteo conciliado y detalle de faltantes.                   |
| Correcciones o duplicados  | Registros que exigieron corrección y duplicados observados / operaciones confirmadas.                                  | Historia de correcciones y reporte de duplicados.           |
| Tiempo de conciliación     | Minutos para confirmar correspondencia entre curso, actividad, grupos, notas y puntos separados.                       | Inicio/fin y discrepancias encontradas.                     |
| Reintentos sin duplicación | Reintentos cuyo estado final correcto contiene un único registro / reintentos ejecutados.                              | Correlación entre intento, fallo, reintento y estado final. |
| Detección de excepciones   | Casos inválidos correctamente rechazados y comunicados / casos inválidos planificados.                                 | Matriz de casos y resultado observado.                      |

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: En la batería definida, el 100 % de intentos no autorizados de alumno, docente ajeno y acceso entre cursos es rechazado sin exposición de información académica.
- **SC-002**: El 100 % de notas aceptadas está entre 0 y 20 y relaciona evaluación y grupo del mismo curso.
- **SC-003**: El 100 % de escenarios de traslado evaluados conserva las notas anteriores con el grupo de la fecha de actividad y usa el grupo nuevo solo para actividades posteriores.
- **SC-004**: El 100 % de correcciones grupales probadas conserva valor anterior, valor nuevo, instante y responsable, y actualiza a la población histórica correcta.
- **SC-005**: El 100 % de reintentos planificados tras fallos produce un único estado final correcto, sin calificaciones, matrículas o pertenencias duplicadas.
- **SC-006**: Cada evaluación de demostración alcanza 100 % de grupos con nota válida o excepción explícitamente identificada antes de declararse conciliada.
- **SC-007**: El 100 % de casos inválidos y excepcionales enumerados en la batería se detecta y comunica con un resultado verificable.
- **SC-008**: En al menos tres ejecuciones comparables, se mide el tiempo manual y automatizado; la meta, aún no resultado, es reducir al menos 50 % la mediana del tiempo total de registro y conciliación.
- **SC-009**: Al menos el 95 % de acciones interactivas Must del protocolo responde visiblemente en 2 segundos o menos con el volumen de prueba acordado.
- **SC-010**: Una revisión de accesibilidad de los flujos Must no encuentra bloqueos de teclado, campos sin nombre accesible ni estados comunicados únicamente por color.
- **SC-011**: Toda evidencia compartida del experimento identifica fecha, versión/PR, entorno y resultado, y contiene cero secretos y cero datos personales reales.
- **SC-012**: Los cinco ámbitos principales —dominio, experiencia, datos/seguridad, calidad y operación/evidencia— pueden demostrarse y revisarse mediante PR independientes con responsable y revisor distintos.

## Assumptions

- Un curso tiene un docente responsable a efectos de esta entrega.
- La escala institucional de notas es numérica de 0 a 20 inclusive; no se añaden otros tipos ni escalas.
- La zona horaria institucional será acordada antes de cargar datos de prueba y se usará uniformemente para actividades y traslados.
- La importación institucional contiene alumnos, no calificaciones; su formato exacto y campos obligatorios se documentarán con el conjunto de prueba sin ampliar el alcance.
- Si datos históricos existentes no permiten reconstruir pertenencias o fechas, el docente los revisará y marcará como inciertos; el sistema no los inferirá silenciosamente.
- El volumen de prueba representará un curso realista y se fijará antes de medir para asegurar comparabilidad, sin afirmar capacidad productiva no comprobada.
- La arquitectura base se mantiene, pero esta especificación define resultados y controles, no el diseño técnico detallado.
- Capacidades existentes en código o documentación se consideran candidatas hasta pasar sus criterios en el entorno evaluado.

## Dependencies and Delivery Slices

### Dependencies

- Identidades de prueba y configuración de autenticación en un entorno aislado.
- Definición y validación con el docente del archivo institucional sintético y de la zona horaria.
- Entorno de datos no productivo capaz de aplicar y probar reglas de acceso.
- Acuerdo previo del protocolo de línea base, volumen y casos excepcionales.

### Independent, reviewable outcomes for five team members

1. **Dominio y preparación**: periodos, cursos, importación, autorización y matrícula con aceptación reproducible.
2. **Experiencia**: flujos docente/alumno, grupos, estados, errores y accesibilidad.
3. **Datos y seguridad**: historia de pertenencia, integridad de evaluaciones/notas y controles de acceso.
4. **Calidad**: batería de casos válidos, inválidos, excepcionales, fallos y reintentos con datos sintéticos.
5. **Operación y evidencia**: señales, conciliación, protocolo de medición y registro final de resultados.

Cada resultado puede dividirse en PR pequeños; ninguno se considera terminado por integración aislada si depende de criterios end-to-end aún no verificados.

## Traceability and Verified Baseline

| Fuente                                                | Decisión o restricción trazada                                                                              |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `docs/01-definicion/caso-evaluacion-grupal.md`        | Proceso central, límite, puntos distintos de notas, cambio histórico y métricas pendientes.                 |
| `docs/02-diseno/modelo-datos.md`                      | Entidades conocidas, rango 0–20, limitación actual de historia y corrección individual posterior.           |
| `docs/03-calidad-y-operacion/estado-actual.md`        | Migraciones y prueba RLS local verificadas; producción, CI, monitoreo, respaldos y métricas no verificados. |
| `docs/03-calidad-y-operacion/controles-operativos.md` | Evidencia, señales, entorno aislado, recuperación y prohibición de asumir controles.                        |
| `docs/03-calidad-y-operacion/indicadores-y-ci-cd.md`  | Definiciones candidatas de indicadores y meta tentativa del 50 %, todavía sin resultados.                   |
| `docs/04-gestion/backlog-y-responsabilidades.md`      | Cinco responsabilidades, PR revisables, datos seguros y Definition of Done.                                 |
| `docs/05-entregables/trabajo-final.md`                | Exigencia de implementar, probar, evaluar y derivar entregables de evidencia real.                          |
| `.specify/memory/constitution.md`                     | Seguridad por servidor/RLS, integridad, trazabilidad, reintentos, observabilidad y evidencia versionada.    |

### Baseline status at specification time

- **Verified locally**: las migraciones documentadas se aplicaron en una instancia local y una prueba reproducible de RLS para notas grupales pasó con identidades sintéticas.
- **Present but not sufficient as completion evidence**: interfaces y acciones de notas, entidades académicas y reglas versionadas en el repositorio.
- **Pending verification or implementation**: historia de grupos, atribución por fecha de actividad, correcciones grupales trazables, protocolo completo de reintento, vistas finales, batería integral, CI, señales/alertas, métricas comparativas y recuperación.
- **Not claimed**: aplicación en producción de las reglas recientes, monitoreo operativo, alertas, respaldos, restauración, resultados de rendimiento o mejora frente al proceso manual.

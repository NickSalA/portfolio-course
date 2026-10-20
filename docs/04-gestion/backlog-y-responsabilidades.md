# Backlog y responsabilidades del equipo

## Propósito

Este documento define cómo un equipo de cinco personas convierte necesidades en Issues, distribuye el trabajo y verifica su cierre. Los nombres y asignaciones concretas deben acordarse con el grupo y registrarse aquí; hasta entonces, los identificadores `Integrante 1`–`Integrante 5` son vacantes, no asignaciones reales.

La [constitución](../../.specify/memory/constitution.md) y [`CONTRIBUTING.md`](../../CONTRIBUTING.md) gobiernan ramas, PR, commits y releases. GitHub Issues es la fuente de verdad del trabajo ejecutable y GitHub Projects ofrece su vista operativa.

## Backlog funcional vigente

**Planificación en revisión:** primero se acordarán los [hitos M1–M4](milestones.md) y el [calendario y contingencia](calendario-y-contingencia.md); después se reorganizarán las historias. La lista siguiente es provisional y no asigna todavía trabajo a semanas. Los acuerdos actuales y `development/` orientan el alcance: actualizar las especificaciones históricas no es condición para comenzar.

Este backlog traduce los acuerdos del [caso](../01-definicion/caso-evaluacion-grupal.md) en resultados verificables. Los IDs **BK-01–BK-24** identifican historias locales de esta revisión; no son IDs de GitHub ni reemplazan los T001–T074 anteriores. No se crearon Issues ni un Project remoto.

**Estado inicial de todas las historias: Backlog.** Esto significa trabajo por refinar, verificar o completar; no que toda capacidad deba construirse de cero. Si existe código candidato, primero se verifica y se conserva lo que cumpla. No se trasladan checks de tareas antiguas como aceptación de este alcance.

Las prioridades y la secuencia son propuestas de planificación. Los responsables nominales, revisores, estimaciones y fechas se asignarán antes de pasar a Ready. Los objetivos son del proyecto completo: analizar, diseñar, implementar y evaluar; los hitos académicos se organizan en [entregables](../05-entregables/trabajo-final.md).

### Preparación y decisiones

| ID    | Historia o resultado                                                                              | Prioridad | Criterio de aceptación mínimo                                                                                                                                                                 | Dependencias | Área propuesta           |
| ----- | ------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------ |
| BK-01 | Referencia histórica: posible actualización de especificaciones, fuera de la planificación activa | High      | ID conservado como antecedente; no bloquea historias ni exige reescribir `specs/`. Si se retoma, requerirá acuerdo independiente y preservará evidencia                                       | Ninguna      | Coordinación y dominio   |
| BK-02 | Cerrar reglas pendientes de cálculo, temporalidad y salida                                        | High      | Registrar decisión o exclusión explícita para saldos negativos, movimientos anulados, precisión de notas, eventos coincidentes y columnas XLSX; no atribuir el supuesto de puntos al profesor | Ninguna      | Coordinación y dominio   |
| BK-03 | Verificar capacidades heredadas y preparar pruebas aisladas                                       | High      | Inventario por historia, datos sintéticos y comandos con fecha/versión; constatar qué ya funciona y qué falta, sin usar producción; no confundir configuración de tests con cobertura         | Ninguna      | Calidad                  |
| BK-04 | Consolidar recorrido y prototipo docente/alumno                                                   | High      | Representar registro, consulta inmediata, reclamo grupal/individual, respuesta y exportación; distinguir pendiente de cero y evitar publicación separada                                      | Ninguna      | Aplicación y experiencia |

### Entradas, grupos y registro

| ID    | Historia o resultado                                  | Prioridad | Criterio de aceptación mínimo                                                                                                                                                                      | Dependencias        | Área propuesta           |
| ----- | ----------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------ |
| BK-05 | Acceder solo a cursos y recursos autorizados          | High      | Sesión no basta como permiso; docente no opera cursos ajenos; alumno solo accede a sus recursos; denegación directa y por interfaz sin filtrar datos                                               | BK-03               | Datos y seguridad        |
| BK-06 | Preparar periodo/curso e incorporar el padrón         | High      | Importación de alumnos válidos, explicación de incompletos/repetidos y vinculación correcta; repetir no duplica alumnos o matrículas; no importar notas                                            | BK-05               | Coordinación y dominio   |
| BK-07 | Configurar grupos, capacidad y ventana por curso      | High      | Docente define número/cupo; alumno elige o cambia con ventana abierta y cupo; rechazar fuera de ventana o último cupo concurrente sin exceder capacidad                                            | BK-05, BK-06        | Aplicación y experiencia |
| BK-08 | Reabrir selección para todo el curso                  | Medium    | Docente amplía/reabre; cualquier alumno del curso puede cambiar con cupo; no permisos individuales ni solicitudes de traslado añadidas al módulo de reclamos                                       | BK-07               | Aplicación y experiencia |
| BK-09 | Conservar participantes históricos de las actividades | High      | Actividad fechada y cambios de grupo sin pérdida de historia; actividades anteriores y posteriores resuelven grupos correctos; ambiguos requieren revisión; cambiar fecha requiere revisar impacto | BK-02, BK-07        | Datos y seguridad        |
| BK-10 | Registrar y corregir una nota grupal por evaluación   | High      | Rango 0–20, mismo curso, una nota vigente, vacío pendiente, corrección trazable por responsable y población histórica; no repetir búsqueda/anotación por alumno                                    | BK-05, BK-09        | Datos y seguridad        |
| BK-11 | Registrar puntos y conservar sus correcciones         | High      | Movimientos individuales separados de notas base; saldo desde movimientos aplicables; corrección conserva original; no producir una nota por registrar puntos                                      | BK-05, BK-06        | Coordinación y dominio   |
| BK-12 | Recuperar guardados y reintentos sin duplicar         | High      | Fallo o confirmación perdida permite comprobar el estado y reintentar sin duplicar notas, correcciones o cambios de grupo; error accionable y sin éxito ficticio                                   | BK-09, BK-10, BK-11 | Datos y seguridad        |

### Consulta y atención de reclamos

| ID    | Historia o resultado                                    | Prioridad | Criterio de aceptación mínimo                                                                                                                                                                                                      | Dependencias               | Área propuesta            |
| ----- | ------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------- |
| BK-13 | Consultar notas y puntos propios desde su registro      | High      | Visibilidad inmediata tras confirmar, sin publicar después; notas según participación histórica y puntos propios; denegar otros cursos/grupos; sustituir la antigua prohibición solo con controles probados                        | BK-05, BK-09, BK-10, BK-11 | Aplicación y experiencia  |
| BK-14 | Presentar reclamo grupal en nombre de los participantes | High      | Cualquier participante de la actividad abre un caso por grupo/evaluación; conservar autor; participantes originales y docente pueden consultar, no nuevos integrantes                                                              | BK-13                      | Aplicación y experiencia  |
| BK-15 | Reclamar un movimiento de puntos de forma privada       | High      | Titular presenta un caso por movimiento propio; solo él y docente consultan texto/estado/respuesta; no compartir con el grupo                                                                                                      | BK-11, BK-13               | Aplicación y experiencia  |
| BK-16 | Atender reclamos con respuesta final docente            | High      | Pendiente → En revisión → Respondido, motivo de decisión, sin réplica/reapertura; corrección expresa separada de responder; denegar atención por docente ajeno                                                                     | BK-14, BK-15               | Aplicación y experiencia  |
| BK-17 | Impedir duplicados de reclamos incluso tras responder   | High      | Un caso por grupo/evaluación o movimiento; otro participante y envíos simultáneos no generan otro; destinatarios autorizados consultan el existente; nunca revelar un caso ajeno                                                   | BK-14, BK-15, BK-16        | Datos y seguridad         |
| BK-18 | Avisar al docente por correo de un reclamo nuevo        | High      | Nuevo caso genera aviso al responsable con enlace sin notas/puntos/texto; probar entrega en entorno autorizado; definir fallo/reintento sin perder reclamo ni enviar por un intento duplicado; configuración fuera del repositorio | BK-14, BK-15, BK-17        | Operación y documentación |

### Exportación y calidad del proceso completo

| ID    | Historia o resultado                                       | Prioridad | Criterio de aceptación mínimo                                                                                                                                                                                                                              | Dependencias                             | Área propuesta            |
| ----- | ---------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------- |
| BK-19 | Calcular ajuste individual por puntos al exportar          | High      | Igual peso, +1 unidad por punto con margen máximo20 por trabajo, base preservada, excedente sin beneficio, sin consumo; notas pendientes dejan promedio pendiente; dos decimales solo al final; probar ejemplos de 20/18/17 +2 =19,00 y 18/16/17 +1 =17,33 | BK-02, BK-09, BK-10, BK-11               | Datos y seguridad         |
| BK-20 | Descargar XLSX por curso y alumno                          | High      | Notas históricas, promedio base, saldo, aplicados, excedente y promedio ajustado según columnas acordadas; pendientes vacíos; repetir no altera saldo ni resultados; docente ajeno denegado; no integración SUM ni actas                                   | BK-19                                    | Aplicación y experiencia  |
| BK-21 | Verificar privacidad y accesibilidad transversal           | High      | Recorridos docente/alumno y correo sin exposición ajena, teclado y errores claros; notas cero/pending distintas; casos históricos de reclamo y consulta; evidencia sintética sin secretos                                                                  | BK-12, BK-13, BK-16, BK-17, BK-18, BK-20 | Calidad                   |
| BK-22 | Comprobar señales, errores y recuperación del proceso      | High      | Correlación segura de registro/reclamo/aviso/exportación, prueba de fallos y reintentos, responsable de incidentes; distinguir fallo de correo de pérdida del caso; revisar controles operativos sin prometer respaldo no verificado                       | BK-12, BK-18, BK-20                      | Operación y documentación |
| BK-23 | Evaluar registro y seguimiento con escenarios equivalentes | High      | Acordar participantes/repeticiones/volumen y registrar observaciones; tiempo frente a manual simulado, consulta/reclamos contra criterios; no inventar baseline histórica ni atribuir ahorro no medido                                                     | BK-21, BK-22                             | Calidad                   |
| BK-24 | Cerrar trazabilidad, evidencia e insumos de entrega        | High      | Historias y requisitos vinculados a resultados reales, limitaciones y pendientes; informe y presentación coherentes; no marcar completadas funciones por existir código o checks                                                                           | BK-23                                    | Operación y documentación |

### Secuencia y paralelismo

1. BK-02 concreta reglas pendientes conforme al caso y los acuerdos; BK-01 queda como antecedente, no una dependencia. La secuencia se ajustará a M1–M4 antes de comprometer tareas.
2. BK-03 y BK-04 preparan pruebas y recorrido. BK-05–BK-11 verifican o completan las entradas y el registro. La historia temporal precede a la consulta de notas, reclamos y exportación.
3. BK-12 protege mutaciones. BK-13 habilita consulta; BK-14 y BK-15 pueden desarrollarse en paralelo contra permisos comunes. BK-16–BK-18 completan atención y aviso.
4. BK-19–BK-20 pueden avanzar en paralelo al flujo de reclamos una vez disponibles las reglas y notas históricas.
5. BK-21–BK-24 integran seguridad, recuperación, evaluación y cierre. Las pruebas se diseñan con cada historia, no se posponen todas al final.

### Cambios frente a `specs/001-manage-group-evaluation/`

| Planificación anterior                                 | Acuerdo vigente y trabajo de transición                                                                                                      |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-032 niega consulta de notas al alumno               | BK-13: permitir solo notas históricamente correspondientes; la prueba antigua de denegación es evidencia histórica, no aceptación nueva      |
| FR-028 separa puntos sin cálculo académico             | BK-02/BK-19: mantener registros distintos y aplicar el supuesto individual solo al exportar                                                  |
| Notificaciones y exportación fuera del alcance         | BK-18/BK-20: incluir el aviso específico al docente y descarga XLSX, no notificación general ni actas oficiales                              |
| Traslado directo docente fuera de ventana              | BK-08: reapertura general acordada, sin obligar a un traslado directo adicional                                                              |
| Sin reclamos                                           | BK-14–BK-17: tipos, destinatarios, unicidad, estados y decisión final                                                                        |
| T001–T006 marcadas completas y otras tareas pendientes | BK-03: preservar estados históricos y verificar qué evidencia sigue siendo aplicable; no reiniciar ni cerrar tareas por equivalencia nominal |

El antiguo `tasks.md` es un antecedente y no cubre automáticamente los acuerdos nuevos. Su actualización no bloquea el trabajo: el caso vigente, los acuerdos consolidados y la planificación por hitos guían la reorganización del backlog. Se mantienen las normas de la constitución.

## Responsabilidades para cinco integrantes

Cada integrante mantiene una responsabilidad primaria, pero puede implementar tareas de otra área. La responsabilidad indica quién cuida la coherencia y verifica que el trabajo no quede sin atender; no crea silos ni reemplaza la revisión cruzada.

| Integrante   | Responsabilidad primaria  | Responsabilidades principales                                                                                                               | Revisión cruzada recomendada                                                             |
| ------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Integrante 1 | Coordinación y dominio    | Priorizar backlog, aclarar alcance y criterios, validar reglas académicas, coordinar entregas y mantener trazabilidad con el trabajo final. | Revisa funcionalidad y documentación; no aprueba su propio PR.                           |
| Integrante 2 | Aplicación y experiencia  | Implementar UI y flujos Next.js, accesibilidad, estados de carga/error y validación manual de la experiencia docente/alumno.                | Revisado por dominio y calidad.                                                          |
| Integrante 3 | Datos y seguridad         | Mantener migraciones, funciones/RPC, integridad, autenticación, autorización y políticas RLS.                                               | Revisado por arquitectura o calidad; cambios sensibles requieren atención del aprobador. |
| Integrante 4 | Calidad y automatización  | Mantener pruebas, fixtures sintéticos, CI, criterios de aceptación, evidencia reproducible y prevención de regresiones.                     | Revisa cambios de aplicación y datos desde la perspectiva de prueba.                     |
| Integrante 5 | Operación y documentación | Mantener releases, observabilidad, recuperación, documentación técnica, evaluación e insumos del informe/presentación.                      | Revisado por dominio y por la persona técnicamente responsable del cambio.               |

### Reglas compartidas

- Cada Issue tiene una persona responsable y, antes de pasar a `In review`, una persona revisora distinta.
- La persona responsable implementa, actualiza documentación y aporta evidencia; no significa que deba realizar todo sin colaboración.
- El aprobador definido por el equipo integra los PR después de la revisión y de CI. GitHub no permite aprobar el PR propio, por lo que debe existir revisión cruzada.
- Los roles pueden rotar por iteración para repartir aprendizaje y carga. Todo cambio de responsables se actualiza en este documento y en GitHub.
- Ningún integrante comparte secretos, datos personales o evidencias académicas identificables en Issues, PR, logs o documentos públicos.

## División del backlog

El backlog se divide por resultados verificables, no por archivos o capas técnicas aisladas:

1. **Gestión y gobernanza:** acuerdos, ramas, revisiones y trazabilidad.
2. **Proceso académico:** reglas y automatización de cursos, grupos, evaluaciones y notas.
3. **Aplicación y experiencia:** interacción docente/alumno, accesibilidad y manejo de estados.
4. **Datos y seguridad:** modelo, migraciones, integridad, RLS y autorización.
5. **Calidad:** pruebas, CI, casos válidos, inválidos y excepcionales.
6. **Operación:** monitoreo, alertas, despliegue, respaldo y recuperación.
7. **Evidencia y entregables:** métricas, evaluación, informe, presentación y anexos.

Una Issue puede involucrar varias áreas, pero debe tener un único resultado principal. Si requiere varios PR independientes o más de una iteración, se divide en Issues relacionadas.

## Campos del GitHub Project

| Campo       | Valores o uso                                          |
| ----------- | ------------------------------------------------------ |
| Status      | `Backlog`, `Ready`, `In progress`, `In review`, `Done` |
| Priority    | `High`, `Medium`, `Low`                                |
| Area        | Una de las siete áreas anteriores                      |
| Owner       | Persona responsable de conducir la Issue               |
| Reviewer    | Persona distinta que revisará el resultado             |
| Delivery    | `Parte I`, `Parte II`, `Operación` o `No aplica`       |
| Target date | Fecha comprometida solo cuando exista acuerdo          |

### Criterios de estado

- **Backlog:** necesidad identificada, todavía no preparada o priorizada.
- **Ready:** alcance, criterios de aceptación, dependencias y responsable están definidos.
- **In progress:** existe trabajo activo y una rama vinculada.
- **In review:** hay PR abierto, evidencia disponible y revisor asignado.
- **Done:** PR integrado, CI aprobado, criterios verificados y documentación/evidencia actualizadas.

## Priorización

- **High:** bloquea la entrega, protege datos/autorización o habilita otras tareas.
- **Medium:** necesaria para completar operación o evaluación, pero no bloquea el siguiente trabajo inmediato.
- **Low:** mejora útil sin compromiso de entrega actual.

Ante prioridades iguales, se atienden primero seguridad e integridad, luego dependencias, valor del proceso académico y reducción de riesgo. La prioridad no sustituye una fecha acordada.

## Definition of Ready

Una Issue pasa a `Ready` cuando:

- [ ] Explica el problema, el resultado esperado y el valor para el proceso.
- [ ] Tiene alcance y fuera de alcance suficientemente claros.
- [ ] Incluye criterios de aceptación observables.
- [ ] Declara dependencias, riesgos y restricciones conocidas.
- [ ] Tiene prioridad, área, responsable y revisor propuesto.
- [ ] Enlaza especificaciones o documentación relevante.
- [ ] Puede completarse sin asumir datos, secretos o decisiones no disponibles.

## Definition of Done

Una Issue pasa a `Done` cuando:

- [ ] Sus criterios de aceptación fueron comprobados.
- [ ] El PR está aprobado e integrado y las conversaciones están resueltas.
- [ ] Los checks relevantes de CI pasan.
- [ ] Se probaron casos válidos, inválidos y excepcionales aplicables.
- [ ] Los cambios de base de datos están en migraciones nuevas y versionadas.
- [ ] La documentación y la evaluación se actualizaron si cambió el comportamiento o su evidencia.
- [ ] La evidencia indica fecha, versión/PR, entorno y resultado, usando datos sintéticos o anonimizados.
- [ ] No se presentan funcionalidades, métricas o controles pendientes como implementados.

## Ceremonia mínima

- **Refinamiento semanal:** revisar nuevas Issues, dividir trabajo grande y mover a `Ready` solo lo preparado.
- **Seguimiento breve:** cada responsable actualiza estado, bloqueos y siguiente paso en GitHub Project.
- **Revisión:** comprobar PR contra criterios de aceptación, seguridad, integridad, pruebas y documentación.
- **Cierre de iteración:** revisar trabajo terminado, evidencia obtenida y cambios necesarios en prioridad o alcance.

No es obligatorio realizar reuniones adicionales si el equipo mantiene estas decisiones y evidencias actualizadas de forma asíncrona.

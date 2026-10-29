# Modelo de datos: panorama

La fuente ejecutable del esquema es la secuencia de
[migraciones](../../portfolio-coursse/supabase/migrations/), no este resumen. Las migraciones se
han versionado desde `0001` hasta `0029`. La evidencia histórica registra su aplicación local
con `db reset --local`; esta actualización solo inspeccionó archivos y no repitió esa ejecución.
Las pruebas de RLS con identidades sintéticas están en
[`supabase/qa/group_grades_rls.sql`](../../portfolio-coursse/supabase/qa/group_grades_rls.sql);
esto **no** certifica la aplicación en un entorno remoto.

| Entidad               | Relación principal                                                                                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`            | Identidad local vinculada a Supabase Auth; incluye rol docente cuando corresponde.                                                                   |
| `academic_periods`    | Agrupan cursos por año y semestre.                                                                                                                   |
| `courses`             | Pertenecen a un periodo y a un docente.                                                                                                              |
| `groups`              | Pertenecen a un curso; son opcionales para la organización del alumnado.                                                                             |
| `authorized_students` | Autorización previa por correo para un curso, aun sin cuenta autenticada.                                                                            |
| `course_students`     | Matrícula que vincula cuenta autenticada y curso, con estado y grupo opcional.                                                                       |
| `point_transactions`  | Variaciones de puntos asociadas a la autorización; `is_voided` permite anular un movimiento erróneo sin eliminarlo y excluye los anulados del saldo. |
| `course_evaluations`  | Evaluaciones asociadas a un curso.                                                                                                                   |
| `group_grades`        | Notas para la pareja grupo/evaluación, con valor permitido de 0 a 20.                                                                                |

La vinculación académica se realiza mediante sincronización explícita; el trigger de creación de
usuario se redujo a la gestión del perfil en
[`0004_narrow_auth_trigger.sql`](../../portfolio-coursse/supabase/migrations/0004_narrow_auth_trigger.sql).
La asociación de puntos a la autorización se introdujo en
[`0018_points_belong_to_authorizations.sql`](../../portfolio-coursse/supabase/migrations/0018_points_belong_to_authorizations.sql).
La anulación de movimientos está en
[`0026_void_point_transactions.sql`](../../portfolio-coursse/supabase/migrations/0026_void_point_transactions.sql)
y su RPC en
[`0027_void_point_transaction_rpc.sql`](../../portfolio-coursse/supabase/migrations/0027_void_point_transaction_rpc.sql).
Las tablas de evaluaciones y notas grupales se definen en
[`0028_group_evaluations_and_grades.sql`](../../portfolio-coursse/supabase/migrations/0028_group_evaluations_and_grades.sql).
La migración
[`0029_restrict_group_grades_to_teachers.sql`](../../portfolio-coursse/supabase/migrations/0029_restrict_group_grades_to_teachers.sql)
retira la política de lectura de notas grupales por alumnos y exige que grupo y evaluación
sean del mismo curso en las escrituras docentes vía RLS; está versionada, **no se ha comprobado
su aplicación en producción**.

La anulación de puntos conserva el movimiento por decisión del responsable del proyecto: evita
borrar permanentemente una asignación errónea. Como hay un docente por curso, el responsable no
necesita registrar el autor de la anulación como requisito adicional. El esquema actual no guarda
por separado quién ni cuándo anuló; esto no debe presentarse como una auditoría completa de esa
acción ni como requisito nuevo.

**Notas históricas ante cambios de grupo:** `course_students.group_id` representa solo el grupo
actual y `group_grades` almacena la nota por grupo y evaluación, sin una atribución congelada por
alumno ni historial de membresías. La regla solicitada —conservar las notas anteriores de un
alumno al cambiar de grupo y atribuirle las siguientes del nuevo— requiere especificar y
persistir esa historia antes de ofrecer exportaciones correctas. Una corrección de la nota del
grupo anterior no debe reasignar retroactivamente al alumno al grupo nuevo. La corrección
individual justificada queda para una etapa posterior, sin implementar. No se cumple solo
consultando la membresía actual.

**Diseño propuesto para especificar e implementar (no disponible hoy):**

El [consolidado vigente](../../development/PLAN-REFINAMIENTO-PARTE-I.md), secciones 4–6,
prevalece para el objetivo acordado. La especificación anterior queda pendiente de sincronización
mediante BK-01 del [backlog vigente](../04-gestion/backlog-y-responsabilidades.md). Las menciones a traslados describen cambios de pertenencia, no una
función adicional obligatoria de traslado directo docente.

1. Registrar en `course_evaluations` la fecha de realización de la actividad; precisar zona
   horaria institucional y cómo tratar actividades y traslados del mismo día. No usar `created_at`
   ni `group_grades.updated_at` como fecha académica. Definir qué ocurre si se cambia esa fecha
   después de guardar notas o traslados: solo el docente del curso podrá hacerlo y deberá
   revisar explícitamente las atribuciones afectadas.
2. Persistir intervalos de pertenencia a grupo por matrícula y curso, incluido el grupo vacío,
   sin solapamientos. Al seleccionar o cambiar de grupo, cerrar el intervalo anterior y abrir el nuevo
   en una sola transacción, validando curso, autorización, cupo y ventana. El docente puede ampliar
   o reabrir la ventana para todo el curso; no se exige un traslado directo docente.
   Revisar **todas** las escrituras de `course_students.group_id`, incluida la sincronización
   desde autorizaciones: ninguna debe modificar el grupo sin mantener la historia. Impedir que
   se borren grupos con atribuciones históricas necesarias para explicar notas.
3. Resolver el grupo aplicable por matrícula y fecha de actividad, independientemente de cuándo
   se haya guardado o corregido la nota. Mantener la nota grupal como fuente: una corrección del
   grupo antiguo debe alcanzar a sus miembros de esa actividad.
4. **Etapa posterior, fuera de la primera entrega:** para casos excepcionales, almacenar una
   corrección por alumno y evaluación con nota, motivo, docente responsable del curso y fecha;
   usarla con precedencia sobre la nota grupal **solo** en esa evaluación, sin sobrescribir la
   nota del grupo. Definir cómo revocarla sin perder el historial de cambios.
5. Aplicar la misma resolución en consultas docentes y futuras exportaciones; solo el docente
   responsable del curso puede crear, modificar o corregir sus notas, tanto en servidor como
   en RLS. Comprobar además que grupo, matrícula y evaluación pertenezcan al mismo curso mediante
   restricciones para cubrir también escrituras privilegiadas y cambios en las entidades
   referenciadas. La política `students read group grades` de `0028` permite `SELECT` al alumno
   del grupo actual; `0029` la elimina y restringe las escrituras docentes al mismo curso al
   aplicarse. Ese bloqueo describe la implementación anterior, no la aceptación vigente.
   El objetivo es permitir lectura desde el registro confirmado a participantes históricos de la
   actividad, negar acceso a otros alumnos y mantener el aislamiento entre cursos. No revertir
   `0029`: la política de `0028`, basada en grupo actual, tampoco satisface la historia.
6. Antes de migrar registros existentes, definir con el docente cómo reconstruir fechas y
   membresías anteriores no registradas: no inferir retrospectivamente el grupo histórico desde
   `course_students.group_id` ni inventar fechas de actividad. Marcar los casos inciertos para
   revisión manual antes de usar resultados individuales o exportarlos.

**Pruebas mínimas propuestas, no ejecutadas aquí:** cambio de grupo antes/después de la actividad,
corrección tardía de la nota grupal, cambio de fecha, actividad/cambio coincidentes, reapertura
general de ventana, concurrencia/cupo, reintento y acceso histórico propio frente a acceso ajeno. En una etapa posterior, agregar
pruebas de la excepción individual y su revocación.
Ejecutarlas con datos sintéticos en Supabase aislado y contrastar los resultados con el docente.

## Objetivo de datos acordado pendiente de implementación

- **Consulta histórica desde guardar:** notas y puntos visibles a sus destinatarios al confirmar
  el registro, sin publicación posterior. Resolver participantes de cada actividad, no el grupo
  actual. No inventar historia ausente; las coincidencias temporales y casos inciertos requieren
  definición y revisión docente.
- **Reclamo grupal histórico:** uno por grupo/evaluación; cualquier participante de la actividad
  puede crearlo y todos esos participantes y el docente pueden consultarlo, aun tras cambiar de
  grupo. La pertenencia actual no concede acceso a otros reclamos.
- **Reclamo individual de puntos:** uno por movimiento propio, privado entre alumno y docente.
  Ambos tipos requieren unicidad por registro, estados Pendiente → En revisión → Respondido,
  decisión docente final motivada, sin réplica, reapertura ni segundo reclamo del mismo registro.
  La respuesta favorable no cambia la nota o los puntos automáticamente: corrección explícita.
- **Aviso docente:** cada reclamo nuevo genera correo breve con enlace, sin notas, puntos ni
  texto del reclamo. No hay correo al alumno, recordatorios ni escalamiento. El reclamo persiste
  si falla el correo; recuperación pendiente de definición. No se observan tablas de reclamos
  ni persistencia de avisos en las migraciones inspeccionadas.
- **XLSX por curso:** resolver notas base por participación histórica y puntos individuales,
  separados de la nota grupal fuente. Vacío es pendiente y cero es registro explícito. La
  exportación no consume ni modifica saldo ni resultados de compañeros, y con iguales entradas
  reproduce los mismos resultados académicos; no es integración SUM ni acta oficial.

### Supuesto del equipo para el cálculo XLSX

No es una regla confirmada por el profesor: todos los trabajos tienen igual peso; cada punto
incrementa una unidad de nota individual con tope 20 por trabajo, distribuido automáticamente
una sola vez en el cálculo. Para `n` trabajos con notas completas y saldo no negativo:

`aplicados = min(saldo, suma(20 - nota_base_i))`

`promedio_ajustado = (suma(notas_base) + aplicados) / n`

No sumar el saldo completo a cada trabajo ni otra vez al promedio. El excedente sin margen no
tiene efecto adicional ni se borra. No hace falta mostrar una distribución por trabajo para
obtener el promedio; no inventar una política de reparto. Una nota pendiente permanece vacía y,
si falta alguna del conjunto incluido, no se presenta promedio final ajustado completo. Redondear
solo el promedio final a dos decimales. Antes de implementar: definir saldo negativo, movimientos
incluidos, columnas e identificadores mínimos del XLSX y precisión decimal de notas base.

Estas historias se organizan en el [backlog vigente](../04-gestion/backlog-y-responsabilidades.md):
BK-09 para historia, BK-13 para consulta, BK-14–BK-18 para reclamos y aviso y BK-19–BK-20 para
cálculo y exportación. BK-01 registra la sincronización pendiente de la especificación anterior. Véase la [capa de alcance vigente de evaluación](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md#alcance-vigente-y-backlog-pendiente).

**Integridad por revisar:** el esquema referencia `group_id` y `evaluation_id` por separado; no
expresa con una restricción compuesta que ambos pertenezcan al mismo curso. `0029` valida la
coincidencia en escrituras autenticadas vía RLS, pero aún se necesita integridad a nivel de base
de datos para otros caminos. La interfaz actual no presenta notas al alumno y `0029` elimina
el permiso basado en grupo actual de `0028`. El objetivo vigente requiere una autorización
histórica nueva y pruebas propias; no declarar esa lectura implementada ni certificar entornos.

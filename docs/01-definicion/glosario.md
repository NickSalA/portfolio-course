# Glosario académico

Términos del dominio observables en el código y las migraciones actuales. Este glosario describe
conceptos; las políticas de desarrollo se encuentran en la [constitución](../../.specify/memory/constitution.md).

| Término                           | Significado                                                                                                                                                                                                                                     |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cuenta autenticada                | Identidad verificada por Supabase Auth mediante Google; no concede acceso académico por sí misma.                                                                                                                                               |
| Docente                           | Cuenta con rol docente autorizada para gestionar sus cursos.                                                                                                                                                                                    |
| Alumno autorizado                 | Correo asociado por el docente a un curso mediante `authorized_students`, aun si la persona no ha iniciado sesión.                                                                                                                              |
| Matrícula                         | Vínculo de una cuenta autenticada con un curso en `course_students`, con estado de acceso y grupo opcional.                                                                                                                                     |
| Periodo académico                 | Año y semestre que agrupan cursos; su estado puede ser `draft`, `upcoming`, `current` o `closed`.                                                                                                                                               |
| Curso                             | Oferta académica de un docente dentro de un periodo.                                                                                                                                                                                            |
| Grupo                             | Subdivisión opcional de un curso con capacidad; el alumno puede seleccionarlo durante una ventana habilitada.                                                                                                                                   |
| Movimiento de puntos              | Variación de puntos vinculada a una autorización; puede existir antes del primer inicio de sesión del alumno. Si se asignó por error, el docente puede anular el movimiento sin borrar el registro.                                             |
| Anulación de puntos               | Cambio de `is_voided` a `true` para conservar el movimiento histórico y excluirlo del saldo; el esquema actual no guarda quién ni cuándo lo anuló.                                                                                              |
| Saldo de puntos                   | Suma derivada de movimientos no anulados; representa puntos individuales, pero no equivale a una nota individual.                                                                                                                               |
| Evaluación de curso               | Evaluación asociada a un curso, como `T1`, `T2` o `T3`, según el esquema actual.                                                                                                                                                                |
| Nota grupal                       | Calificación asociada a un grupo y una evaluación, entre 0 y 20; solo el docente del curso la gestiona; la interfaz no la muestra al alumno. `0029` retira el permiso de lectura estudiantil de `0028`, pendiente de verificar en cada entorno. |
| Pertenencia histórica             | Grupo al que pertenecía una matrícula el día de la actividad; regla acordada, aún no persistida por el sistema.                                                                                                                                 |
| Corrección individual justificada | Excepción docente para una evaluación y un alumno cuya nota difiere de la grupal, con motivo y conservación de la nota del grupo; aún no implementada.                                                                                          |

**Distinción importante:** la autorización previa, la matrícula autenticada y la identidad de
Google son registros distintos. Los puntos están asociados a la autorización, mientras las
notas actuales se asocian a grupo y evaluación. La regla deseada es conservar para cada alumno las
notas obtenidas antes de un cambio de grupo y asignarle las posteriores del nuevo grupo; el esquema
actual no conserva esa atribución histórica. La fecha de la actividad determina el grupo y la
corrección individual justificada es una excepción para una etapa posterior. Véase el
[diseño propuesto](../02-diseno/modelo-datos.md) antes de ampliar ese modelo.

Fuentes: [modelo de datos](../02-diseno/modelo-datos.md),
[sincronización de autorizaciones](../../portfolio-coursse/lib/academic/authorize-current-user.ts),
[migración de puntos](../../portfolio-coursse/supabase/migrations/0018_points_belong_to_authorizations.sql)
y [migraciones de notas](../../portfolio-coursse/supabase/migrations/0028_group_evaluations_and_grades.sql)
y [permisos de notas](../../portfolio-coursse/supabase/migrations/0029_restrict_group_grades_to_teachers.sql).

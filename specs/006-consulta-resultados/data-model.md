# Modelo de datos

- La cuenta del alumno y la matrícula vigente identifican el curso y la autorización vinculada.
- `group_grade_participants` identifica los destinatarios de una nota confirmada por matrícula y actividad. La nota vigente se lee de `group_grades`.
- Un intervalo agrupado de `group_membership_history` a la fecha de realización permite identificar el grupo de un pendiente. Un vacío de evidencia omite la actividad.
- Los puntos siguen asociados a una autorización de matrícula. Se conserva la anulación y el panel excluye los anulados del saldo.

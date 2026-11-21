# Consulta de historial por instante

`student_group_membership_at(target_enrollment_id bigint, requested_at timestamptz)` devuelve una fila con `membership_state` (`grouped`, `ungrouped`, `inactive` o `unknown`) y `group_id` (solo en `grouped`). Se rechaza una fecha nula. Las fechas futuras y anteriores al primer intervalo se devuelven como desconocidas.

El docente responsable accede por las comprobaciones vigentes de BASE-03. Un recurso ajeno o inexistente, o una sesión sin el rol requerido, recibe el mismo rechazo. La tabla privada se reserva a los mecanismos de base y a futuros consumidores autorizados.

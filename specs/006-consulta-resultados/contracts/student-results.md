# Contrato de consulta

`list_student_group_grades(target_course_id bigint)` obtiene la identidad de la sesión y exige una cuenta estudiantil y matrícula autorizada vigente. Las cuentas de alumnos con el rol de perfil sin fijar siguen el acceso estudiantil existente; los perfiles docentes no usan esta RPC. Devuelve una fila por actividad visible, con `evaluation_public_id`, `evaluation_name`, `group_public_id`, `group_name`, `performed_at` y `grade`. Los identificadores devueltos son UUID. La fecha es el instante de realización registrado en la evaluación.

Una nota confirmada conserva sus destinatarios originales y devuelve el valor vigente. Un pendiente con grupo histórico verificable devuelve `null`, incluso en ausencia de fila de calificación. Una nota antigua con valor sin destinatarios verificables, una fecha ausente o una pertenencia desconocida se omiten. Un actor autenticado fuera del alcance recibe una lista vacía y el rol anónimo carece de permiso de ejecución.

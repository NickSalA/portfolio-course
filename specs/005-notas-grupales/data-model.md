# Modelo de datos

- `group_grades` conserva la nota vigente y el comentario. La revisión 0 identifica ausencia de nota confirmada por EVA-01. Las notas previas se conservan con revisión 0 y sin fecha de atribución.
- Una primera confirmación guarda la fecha usada y una fila privada por matrícula participante. Una restricción impide atribuir dos notas diferentes al mismo alumno en la evaluación.
- Las correcciones privadas conservan el identificador de nota y revisión, valores anterior y nuevo, motivo, identidad del docente y hora de base de datos.
- Las notas confirmadas impiden eliminar la evaluación. Los destinatarios y las correcciones quedan protegidos frente a cambios desde roles de aplicación.

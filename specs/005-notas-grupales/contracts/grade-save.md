# Contrato de guardado

`save_group_grade` recibe identificadores de curso, evaluación y grupo, nota numérica, revisión esperada y motivo opcional. Devuelve la nota vigente y su revisión. Valor igual conserva la revisión. Si el valor difiere, la revisión debe coincidir y una corrección requiere motivo. Para guardar, el docente debe tener autorización sobre el curso y ambos recursos deben pertenecer a ese curso.

Las notas pendientes se representan con un campo vacío. Una celda con nota confirmada vuelve al valor vigente cuando se cancela o se intenta vaciar. La interfaz explica los errores de permisos, historia, precisión y revisión.

Para la tabla docente, la lectura de notas por curso incluye los nombres de sus destinatarios históricos a partir de las matrículas conservadas. La lectura devuelve filas solo al docente autorizado. Los nombres mostrados junto al grupo corresponden a sus integrantes actuales y se identifican por separado.

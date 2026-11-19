# Contrato de acceso académico

- `has_academic_identity()` devuelve únicamente si la sesión actual cumple la regla de identidad.
- `available_course_groups(enrollment_id)` conserva el resumen de capacidad y ocupación. `available_course_group_details(enrollment_id)` conserva la forma general de la respuesta y entrega integrantes con `full_name` durante la ventana, o un arreglo vacío fuera de ella.
- La baja o restauración solo devuelven éxito si se actualizó la autorización de un curso propio. La autorización vigente se comprueba también en las solicitudes posteriores que usan una sesión existente.

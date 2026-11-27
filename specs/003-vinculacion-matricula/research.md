# Decisiones técnicas

- **Fuente de identidad**. Mantener el correo verificado de BASE-03 y los controles de matrícula de la base. El padrón importa autorizaciones sin inferir la cuenta ni crear matrículas.
- **Actualización**. El grupo de la autorización solo inicializa una matrícula nueva. Actualizar el grupo en cada sincronización incumple la elección del alumno.
- **Concurrencia**. Mantener el orden autorización antes de matrícula. Usar un bloqueo de fila de autorización que serialice a los sincronizadores y conserve la coordinación con la baja.
- **Legado**. Completar únicamente vínculos nulos inequívocos. Una autorización ya vinculada a otra matrícula requiere revisión fuera de la sesión del alumno. La RPC sigue procesando las demás autorizaciones válidas.

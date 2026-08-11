# Autorización previa por correo institucional

**Estado:** aceptada

Los alumnos no se registran libremente: la carga de alumnos del docente crea una autorización por correo y la matrícula se materializa cuando la cuenta autenticada de Google coincide con esa autorización. Se eligió este modelo en lugar de confiar únicamente en el dominio institucional porque pertenecer al dominio no identifica el curso autorizado ni evita accesos no previstos. La sincronización es idempotente y puede ejecutarse tanto al iniciar sesión como después de una importación tardía.

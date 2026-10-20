## Code Review Rules

### Autorización y datos académicos

- Señala accesos a datos de docentes o alumnos que dependan solo de controles en la interfaz. Las operaciones del servidor deben comprobar la identidad, el rol y el alcance de los recursos; las políticas RLS deben proteger también el acceso directo a Supabase.
- En cambios de esquema o de políticas RLS, comprueba que las migraciones nuevas no amplíen el acceso entre usuarios, grupos o cursos y que mantengan el aislamiento de datos existentes.

### Integridad de evaluaciones y puntos

- Señala cambios que permitan registrar, modificar o anular calificaciones o puntos sin validar en el servidor la pertenencia al curso/grupo y las reglas de negocio aplicables. No confíes en identificadores ni importes enviados desde el cliente.

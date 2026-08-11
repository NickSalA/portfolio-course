# Acceso institucional y autorización académica

## Problem Statement

La plataforma necesita permitir que docentes y alumnos accedan de forma segura usando Google OAuth institucional. Un dominio institucional válido no es suficiente para autorizar a un alumno: el docente debe haberlo cargado previamente mediante CSV y asociado a un curso, con una matrícula activa.

El sistema también debe soportar el caso en que el alumno inicie sesión antes de ser cargado y el caso inverso, en que sea cargado antes de iniciar sesión.

## Solution

Usar Supabase Auth con Google OAuth para verificar la identidad y Supabase/PostgreSQL para decidir la autorización académica. La carga del docente crea un alumno autorizado por correo. Una sincronización idempotente vincula esa autorización con el perfil autenticado y materializa la matrícula activa.

El acceso académico se concede únicamente cuando existe una autorización activa para el correo autenticado o un perfil docente autorizado. El alumno puede consultar sus cursos, su grupo cuando exista y su historial de movimientos de puntos en modo de solo lectura.

## User Stories

1. Como docente, quiero iniciar sesión con Google institucional, para acceder a mis cursos sin crear una contraseña adicional.
2. Como docente, quiero que mi cuenta sea distinguida de una cuenta de alumno, para acceder a las funciones de administración.
3. Como docente, quiero crear un curso, para organizar una actividad académica.
4. Como docente, quiero indicar si un curso utiliza grupos, para no obligar a todos los cursos a dividirse.
5. Como docente, quiero definir una ventana de selección de grupos, para permitir que los alumnos elijan durante un plazo controlado.
6. Como docente, quiero crear grupos con capacidad máxima, para controlar la cantidad de integrantes.
7. Como docente, quiero importar un CSV de alumnos, para autorizar muchos correos en una sola operación.
8. Como docente, quiero asociar cada fila importada a un curso, para evitar que un alumno acceda a cursos no asignados.
9. Como docente, quiero asociar opcionalmente cada alumno a un grupo, para soportar cursos con y sin grupos.
10. Como docente, quiero recibir errores por fila durante la importación, para corregir datos sin perder las filas válidas.
11. Como docente, quiero que los correos se normalicen, para evitar duplicados por mayúsculas o espacios.
12. Como docente, quiero ver qué alumnos autorizados todavía no han iniciado sesión, para dar seguimiento al acceso.
13. Como docente, quiero que un alumno cargado después de su primer inicio de sesión pueda acceder sin intervención manual adicional.
14. Como docente, quiero activar, desactivar o bloquear una autorización, para controlar el acceso durante el curso.
15. Como alumno, quiero iniciar sesión exclusivamente con Google, para usar mi identidad institucional.
16. Como alumno, quiero que una cuenta institucional no cargada sea rechazada, para que nadie acceda por accidente a un curso.
17. Como alumno, quiero ver solo los cursos en los que tengo una matrícula activa, para mantener la privacidad y claridad de mi panel.
18. Como alumno, quiero ver mi grupo cuando el curso use grupos, para conocer mi organización académica.
19. Como alumno, quiero no ver un grupo cuando el curso no lo utilice, para no mostrar información irrelevante.
20. Como alumno, quiero consultar mi saldo de puntos, para conocer mi resultado actual.
21. Como alumno, quiero consultar el historial de movimientos de puntos, para entender cuándo y por qué se modificó mi saldo.
22. Como alumno, quiero que el historial sea de solo lectura, para evitar modificaciones no autorizadas.
23. Como docente, quiero asignar puntos a un alumno, para reconocer actividades o méritos adicionales.
24. Como docente, quiero asignar puntos sin motivo, para no hacer obligatorio un texto explicativo en cada caso.
25. Como docente, quiero asignar puntos con un motivo opcional, para dejar contexto cuando sea útil.
26. Como docente, quiero corregir una asignación sin borrar el historial, para conservar una auditoría confiable.
27. Como docente, quiero consultar movimientos solo de mis cursos, para proteger la información de otros docentes.
28. Como sistema, quiero renovar la sesión mediante cookies seguras, para mantener el acceso sin exponer tokens al cliente.
29. Como sistema, quiero aplicar RLS en Supabase, para que la seguridad no dependa solo de las rutas de Next.js.
30. Como sistema, quiero que sincronizar una autorización sea idempotente, para poder repetir la operación sin crear matrículas duplicadas.
31. Como sistema, quiero distinguir identidad autenticada de autorización académica, para evitar que Google OAuth se convierta accidentalmente en un registro abierto.

## Implementation Decisions

- Supabase Auth será el proveedor de sesiones y Google OAuth será el proveedor de identidad.
- La autorización académica será independiente de la autenticación.
- `academic_periods` representará periodos como `2025-I` y `2025-II`.
- Cada curso pertenecerá a un periodo académico.
- `authorized_students` almacenará las autorizaciones importadas por correo.
- `profiles` almacenará la identidad local vinculada a `auth.users`.
- `course_students` representará la matrícula autenticada real.
- El correo se normalizará a minúsculas y sin espacios antes de persistirse o compararse.
- La sincronización de autorizaciones estará detrás de una función idempotente sin parámetros de identidad; usará el usuario autenticado actual.
- El trigger de `auth.users` se limitará a crear o actualizar el perfil. La vinculación académica se hará mediante una función explícita de sincronización.
- Los cursos pueden tener grupos o no. `group_id` será opcional en la matrícula y en la autorización.
- El docente define `group_selection_opens_at` y `group_selection_closes_at` cuando el curso permita selección por alumnos.
- El alumno selecciona o cambia de grupo mediante una función transaccional solo dentro de esa ventana.
- Fuera de la ventana, el docente puede cambiar la matrícula mediante una operación administrativa.
- Los grupos, matrículas y movimientos heredarán el periodo desde su curso; no duplicarán `period_id`.
- Las claves primarias internas pueden ser numéricas. Los `public_id` UUID se reservarán para referencias externas.
- Los movimientos de puntos son registros históricos. `reason` será nullable.
- El saldo se derivará de la suma de los movimientos, no se mantendrá como una segunda fuente mutable en el MVP.
- Los movimientos de corrección se modelarán como ajustes o reversos, no mediante eliminación destructiva.
- Las mutaciones académicas se harán desde módulos server-side o funciones SQL/RPC con RLS activo.
- La importación CSV debe ser una operación de dominio con resultado por fila, no una inserción directa desde un componente de cliente.

## Testing Decisions

- Probar el comportamiento a través de las interfaces de acceso y sincronización, no la implementación interna del trigger.
- Probar el intercambio OAuth con un usuario docente, un alumno autorizado y un usuario institucional no autorizado.
- Probar el orden alternativo de eventos: autorización antes del primer login y autorización después del primer login.
- Probar que repetir la sincronización no duplica matrículas.
- Probar que una autorización inactiva o bloqueada no concede acceso.
- Probar que un alumno solo puede leer sus propias matrículas y movimientos.
- Probar que un docente no puede leer o modificar cursos de otro docente.
- Probar cursos con grupos y cursos sin grupos.
- Probar selección de grupo antes, durante y después de la ventana permitida.
- Probar que un alumno no pueda seleccionar un grupo de otro curso.
- Probar dos selecciones concurrentes para el último cupo disponible.
- Probar importaciones con correos duplicados, correos con espacios, mayúsculas, grupos inexistentes y capacidades excedidas.
- Probar asignaciones de puntos con motivo, sin motivo, puntos positivos y ajustes negativos.
- Probar que un alumno no puede crear, editar o eliminar movimientos.
- Añadir pruebas de integración contra una base Supabase de desarrollo o un entorno local equivalente antes de depender de RLS en producción.

## Out of Scope

- Registro libre de alumnos.
- Acceso con correo y contraseña para alumnos.
- Elección arbitraria de curso por parte del alumno.
- Selección de grupo fuera de la ventana definida por el docente.
- Administración multiinstitución completa.
- Roles de administrador institucional en el MVP.
- Notificaciones por correo.
- Exportación avanzada de reportes.
- Integración con un LMS o WordPress.
- Reglas de puntos por curso configurables automáticamente.

## Further Notes

La autorización por dominio institucional y la autorización por curso son reglas distintas. Google verifica la identidad; Supabase decide si esa identidad tiene una autorización académica activa. La capacidad de los grupos debe validarse en la base de datos antes de habilitar la carga CSV o cualquier cambio de grupo.

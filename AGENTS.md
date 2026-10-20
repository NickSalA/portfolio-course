## Trabajo con issues del backlog

- Antes de abordar una issue, localizar su ficha en `docs/backlog/` y consultar sus **Antecedentes BASE-01** junto con el [inventario de capacidades](docs/03-calidad-y-operacion/inventario-capacidades-base-01.md). Si se recibe solo un número de GitHub, resolver primero su correspondencia en `docs/backlog/github.md`.
- Contrastar los antecedentes con el código actual y el caso vigente antes de cambiar la implementación. El inventario es una referencia inicial de inspección estática, no un estado permanentemente vigente ni evidencia de aceptación funcional. Reutilizar lo que cumpla los criterios; no reconstruir funciones por defecto.
- En cambios de interfaz, distinguir implementación en código, navegación identificada, funcionamiento probado y usabilidad comprobada. No declarar una pantalla inexistente o verificada sin evidencia; registrar los recorridos visuales no ejecutados como pendientes.
- Al completar la tarea, registrar en su documentación/evidencia qué antecedentes se resolvieron o dejaron de aplicar, las pruebas realmente ejecutadas y los pendientes con su issue de seguimiento. No marcar un hallazgo resuelto solo por documentarlo ni modificar el inventario histórico como si el contraste original hubiera probado el estado nuevo.
- Los antecedentes no añaden dependencias ni amplían automáticamente el alcance de una issue. Si un hallazgo relevante queda fuera de alcance, identificar su responsable/issue de seguimiento y cualquier bloqueo antes de declarar aceptación.
- Las fichas locales y las issues de GitHub no se sincronizan automáticamente. Indicar explícitamente dónde se actualizó el seguimiento; no afirmar que GitHub cambió por editar archivos locales.

## Code Review Rules

### Autorización y datos académicos

- Señala accesos a datos de docentes o alumnos que dependan solo de controles en la interfaz. Las operaciones del servidor deben comprobar la identidad, el rol y el alcance de los recursos; las políticas RLS deben proteger también el acceso directo a Supabase.
- En cambios de esquema o de políticas RLS, comprueba que las migraciones nuevas no amplíen el acceso entre usuarios, grupos o cursos y que mantengan el aislamiento de datos existentes.

### Integridad de evaluaciones y puntos

- Señala cambios que permitan registrar, modificar o anular calificaciones o puntos sin validar en el servidor la pertenencia al curso/grupo y las reglas de negocio aplicables. No confíes en identificadores ni importes enviados desde el cliente.

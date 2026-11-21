# Modelo de acceso

| Entidad | Regla |
|---|---|
| Cuenta de Auth | Sesión OAuth e identidad de Google verificada con el correo actual. |
| Perfil docente | Rol administrado y curso propio en cada operación. |
| Autorización | Propia y activa para la consulta del padrón previa a sincronización. |
| Matrícula | Vínculo coherente con cuenta, curso y autorización. Ambas deben estar activas para conceder acceso. |
| Grupo y evaluación | Alcance por curso. Los nombres de integrantes de opciones solo se devuelven durante la ventana. |
| Puntos | Se conserva la asignación docente antes del primer login. La lectura estudiantil exige matrícula y autorización vigentes. |

Ante una baja se actualiza el estado de los vínculos válidos en la misma transacción. Las discrepancias anteriores se conservan y se excluyen del acceso.

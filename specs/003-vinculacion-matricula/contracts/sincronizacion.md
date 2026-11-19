# Contrato de sincronización

`sync_authorized_student()` conserva nombre, rol de ejecución y retorno booleano. Devuelve `true` si la cuenta posee al menos una matrícula con acceso vigente tras la sincronización. Devuelve `false` cuando falta identidad académica o matrícula elegible. Las llamadas repetidas no cambian el grupo de una matrícula existente.

La autorización agregada después del primer intento permite el acceso en un nuevo inicio de sesión. Si ya existe sesión académica para otro curso, el panel sincroniza la nueva autorización en su siguiente carga.

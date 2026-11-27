# Plan técnico de BASE-06

**Rama** `feature/base-06-vinculacion-matricula` · [Especificación](spec.md)

## Resumen y contexto

Actualizar la RPC sin argumentos en una migración nueva. Las entradas actuales de Next.js seguirán invocándola. Se reutilizan PostgreSQL, la identidad verificada y las comprobaciones de pertenencia de BASE-03, y el contrato de importación de BASE-05. No se agregan dependencias.

## Constitución

La base deriva la identidad de la sesión, valida el curso y conserva autorizaciones previas sin transferir sus datos. Las actualizaciones son transaccionales y respetan la revocación. La evidencia usa fixtures sintéticos y revisión independiente.

## Diseño y validación

Seleccionar autorizaciones activas, serializar solicitudes sobre las filas de autorización y crear solo vínculos disponibles. Mantener el grupo de una matrícula existente durante la actualización. Revocar estados incoherentes sin eliminar datos. Validar ambos órdenes de incorporación, los conflictos de uno o varios cursos y la conservación del grupo con pruebas SQL y dos sesiones.

[Decisiones](research.md) · [Modelo](data-model.md) · [Contrato](contracts/sincronizacion.md) · [Validación](quickstart.md)

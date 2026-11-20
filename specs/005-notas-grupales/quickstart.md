# Verificación de EVA-01

1. Iniciar un Supabase aislado, con ID y puertos propios, y aplicar las migraciones con fixtures sintéticos. Verificar instalación limpia y actualización desde 0045.
2. Ejecutar `PORTFOLIO_QA_DB_CONTAINER=<contenedor-aislado> pnpm test:db` desde `portfolio-coursse` y comprobar permisos, límites, auditoría y concurrencia entre registro de notas y cambio de fecha.
3. Desde Notas con un docente del curso, registrar 0, recargar y corregir a 20 con motivo. Comprobar que cancelar, vaciar o intentar más de dos decimales conserva la nota. Verificar histórico con un cambio de grupo y un intento de edición de una nota antigua.
4. Registrar evidencia y límites observados en `docs/automatizaciones/gestion-evaluacion-grupal/evaluacion.md`.

## Despliegue coordinado de 0046

La versión anterior escribe directamente en la tabla y el nuevo servidor usa las RPC de 0046. Coordinar la migración con la activación del servidor nuevo en una ventana de mantenimiento de Notas.

1. Preparar el despliegue nuevo y probarlo con 0046 en un entorno aislado. Anunciar la ventana y pedir a los docentes terminar los guardados en curso.
2. Pausar el tráfico a Notas y sus guardados, y dejar terminar las solicitudes ya iniciadas. Aplicar 0046 y activar la versión compatible durante esa pausa.
3. Verificar con una cuenta de prueba autorizada que se puede guardar y que la tabla presenta la revisión y los destinatarios correctos. Reabrir el tráfico cuando esas comprobaciones pasen.
4. Si falla la comprobación, mantener Notas en mantenimiento mientras se corrige el despliegue. Volver solo a la aplicación anterior no restablece el guardado después de 0046. Conservar la restricción de escritura y cualquier corrección ya registrada.

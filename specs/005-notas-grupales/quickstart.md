# Verificación de EVA-01

1. Iniciar un Supabase aislado, con ID y puertos propios, y aplicar las migraciones con fixtures sintéticos. Verificar instalación limpia y actualización desde 0045.
2. Ejecutar `PORTFOLIO_QA_DB_CONTAINER=<contenedor-aislado> pnpm test:db` desde `portfolio-coursse` y comprobar permisos, límites, auditoría y concurrencia entre registro de notas y cambio de fecha.
3. Desde Notas con un docente del curso, registrar 0, recargar y corregir a 20 con motivo. Comprobar que cancelar, vaciar o intentar más de dos decimales conserva la nota. Verificar histórico con un cambio de grupo y un intento de edición de una nota antigua.
4. Registrar evidencia y límites observados en `docs/automatizaciones/gestion-evaluacion-grupal/evaluacion.md`.

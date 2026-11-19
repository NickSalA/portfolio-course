# Validación de GRP-02

Usar un Supabase local aislado y la [guía del proyecto](../../docs/03-calidad-y-operacion/entorno-de-pruebas-supabase.md). Verificar la migración desde `0038` sobre matrículas sintéticas y comprobar ambos lados del corte. Ejecutar la suite de GRP-02 y las existentes con `pnpm test:db`; validar también dos conexiones y los checks de aplicación.

Registrar esperado, observado, datos sintéticos y limitaciones en [evaluacion.md](../../docs/automatizaciones/gestion-evaluacion-grupal/evaluacion.md). Mantener las comprobaciones de participantes por actividad como pendientes de #23.

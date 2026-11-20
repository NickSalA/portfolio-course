# Verificación de EVA-04

1. Usar un Supabase local con ID y puertos propios. Probar una instalación limpia y la actualización desde la última migración base, 0047.
2. Ejecutar `PORTFOLIO_QA_DB_CONTAINER=<contenedor-aislado> pnpm test:db` desde `portfolio-coursse`.
3. Comprobar que un traslado o un alta posterior no cambian los destinatarios, que pendiente y cero difieren y que una corrección aparece al consultar de nuevo. Comparar acceso por curso, rol, sesión, revocación y titularidad de puntos.
4. Registrar la evidencia y las limitaciones en `docs/automatizaciones/gestion-evaluacion-grupal/evaluacion.md`. El recorrido del panel con notas corresponde a EVA-05.

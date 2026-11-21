# Validación de BASE-03

Seguir la [guía de Supabase local](../../docs/03-calidad-y-operacion/entorno-de-pruebas-supabase.md). Validar con la instancia aislada y registrar los resultados en el [registro de evaluación](../../docs/automatizaciones/gestion-evaluacion-grupal/evaluacion.md).

1. Ejecutar `pnpm test:db` desde la aplicación con las migraciones actuales.
2. Verificar por separado una actualización del esquema anterior que conserve los datos sintéticos previos.
3. Con sesiones locales, comprobar lecturas y mutaciones permitidas y denegadas mediante la API, incluyendo una sesión que sigue abierta tras la baja.
4. Verificar Google OAuth en navegador con las cuentas de desarrollo previstas. Probar que los nombres de integrantes se muestran durante la ventana y que las respuestas omiten correos.
5. Ejecutar `pnpm lint`, `pnpm typecheck` y `pnpm build`.

# Plan · Registro y corrección de notas grupales

**Rama** `feature/eva-01-notas-grupales` desde `develop` · **Issue** #24

## Contexto técnico

Next.js, TypeScript y PostgreSQL en Supabase. Conservar la tabla y la RLS de lectura. Añadir una RPC transaccional, relaciones privadas para participantes e historial y una confirmación en la tabla docente. Reutilizar GRP-06 para determinar las matrículas y serializar las correcciones de fecha.

## Constitución

El servidor comprueba permisos y alcance. La migración conserva datos anteriores y bloquea cambios sin trazabilidad. Las pruebas se ejecutan con actores sintéticos en un Supabase aislado. La integración utiliza PR hacia develop y revisión independiente.

## Diseño y validación

- [Decisiones](research.md)
- [Modelo de datos](data-model.md)
- [Contrato de guardado](contracts/grade-save.md)
- [Verificación](quickstart.md)

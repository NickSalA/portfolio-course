# Plan de implementación de GRP-02

**Rama** `feature/grp-02-historial-grupos` · [Especificación](spec.md)

## Resumen y contexto técnico

Materializar intervalos de matrícula en PostgreSQL mediante una migración y un trigger privados. La RPC de Supabase consulta un instante y reutiliza la comprobación de docente del curso. La selección y sincronización actuales siguen escribiendo la matrícula.

## Constitución

El historial es aditivo, transaccional y protegido por curso. La aplicación usa la sesión del usuario. La migración y la suite emplean datos sintéticos para probar fechas, permisos y conservación.

## Diseño y validación

[Decisiones](research.md) · [Modelo](data-model.md) · [Contrato](contracts/consulta-historial.md) · [Validación](quickstart.md).

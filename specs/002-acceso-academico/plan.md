# Plan de implementación de BASE-03

**Rama** `feature/base-03-acceso-academico` · [Especificación](spec.md)

## Resumen y contexto técnico

Next.js y Supabase Auth conservan Google OAuth. Una migración nueva impone el alcance en PostgreSQL. Next.js usa el cliente Supabase de la sesión y consulta el mismo criterio de identidad. Las políticas por fila se ejecutan igualmente cuando la consulta llega directamente a la API. Se amplían las suites SQL de BASE-02 y se comprueba el flujo del navegador en el entorno local.

## Constitución

Aplicar mínimo privilegio y verificar identidad, rol y recurso en la base. Guardar los cambios de estado de manera atómica. Conservar los datos históricos inconsistentes y verificar que no concedan acceso. Usar identidades sintéticas y revisión independiente. Una migración aditiva, funciones acotadas y el cliente existente cubren la necesidad.

## Estructura y diseño

- `portfolio-coursse/supabase/migrations/` contiene las reglas de identidad, políticas y transiciones.
- `portfolio-coursse/app/`, `lib/` y `components/` mantienen los recorridos de sesión y selección.
- `portfolio-coursse/supabase/qa/` y el registro de evaluación contienen pruebas y resultados.
- [Decisiones](research.md), [modelo de datos](data-model.md), [contrato](contracts/acceso.md) y [validación](quickstart.md).

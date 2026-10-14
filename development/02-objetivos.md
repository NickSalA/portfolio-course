# 2. Objetivos

## Objetivo general

Diseñar una automatización controlada para la gestión de evaluaciones grupales que integre la preparación del curso, la organización histórica de grupos, el registro y corrección de calificaciones y la conciliación docente, aplicando seguridad, integridad, trazabilidad y recuperación ante reintentos dentro de la arquitectura Next.js, Supabase y PostgreSQL existente.

## Objetivos específicos

1. Analizar el proceso manual basado en XLSX y registros separados para identificar actividades repetitivas, reglas, actores, entradas, salidas, errores y excepciones.
2. Delimitar el alcance funcional mediante prioridades MoSCoW, historias de usuario, casos válidos, inválidos y excepcionales, y elementos expresamente fuera de alcance.
3. Diseñar un modelo de datos que preserve pertenencias temporales a grupos, fechas académicas de las actividades, calificaciones vigentes, correcciones y evidencia de operaciones.
4. Separar autenticación y autorización académica, aplicando mínimo privilegio mediante comprobaciones de servidor, responsabilidad sobre el curso y políticas RLS.
5. Definir operaciones atómicas e idempotentes que eviten estados parciales o duplicaciones durante importaciones, traslados, guardados, correcciones y reintentos.
6. Proponer una estrategia de pruebas por capas con datos sintéticos, entorno aislado y cobertura de reglas, permisos, accesibilidad, rendimiento y recuperación.
7. Establecer indicadores y un protocolo reproducible para comparar en Parte II la plataforma con el proceso manual sin anticipar resultados.
8. Organizar el backlog y las responsabilidades de cinco integrantes mediante incrementos revisables, PR con revisión cruzada y evidencia asociada.

## Resultados esperados de Parte I

- Especificación funcional consolidada.
- Arquitectura y responsabilidades técnicas justificadas.
- Modelo de datos propuesto con invariantes y estrategia de migración.
- Casos de uso, pruebas y controles operativos planificados.
- Backlog por fases y distribución del trabajo.
- Diagnóstico honesto del estado inicial y las brechas.
- Bibliografía académica, normativa y técnica que sustente las decisiones.

Estos son productos de análisis y diseño. No equivalen a una implementación completa ni a una mejora cuantitativa ya demostrada.

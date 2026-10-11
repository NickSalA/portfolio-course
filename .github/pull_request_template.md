## Resumen y propósito

<!-- ¿Qué cambia, qué problema resuelve y qué resultado se espera? -->

## Seguimiento y etapa del trabajo final

- Issue: Closes #
- Entrega: [ ] Parte I — análisis/diseño/prototipo [ ] Parte II — implementación/pruebas/evaluación [ ] No aplica
- Artefactos de especificación relacionados (si aplica):

## Proceso y controles afectados

<!-- Describe solo lo que aplique a este cambio. Para automatizaciones, explica el efecto en el proceso real elegido. -->

- Actividad repetitiva o necesidad atendida:
- Reglas/condiciones de control:
- Eventos o estados gestionados:
- Validación de ejecución y resultado esperado:
- Errores, excepciones, reintentos o recuperación:
- Evidencia/resultados registrados y monitoreo:

<!-- Si un punto no corresponde, indica "No aplica"; si está planeado pero aún no implementado, indícalo como "Pendiente". No presentes planes como resultados comprobados. -->

## Validación y evidencia

- [ ] `pnpm lint`
- [ ] `pnpm exec next typegen && pnpm exec tsc --noEmit`
- [ ] `pnpm build`
- [ ] Probé los casos válidos, inválidos y excepcionales relevantes (si aplica)
- [ ] Registré resultado, fecha, entorno y evidencia reproducible (si aplica)
- [ ] Diferencié checks de CI de evidencia de ejecución del proceso real

**Pruebas realizadas y resultado:**

<!-- Indica comandos/casos y si pasaron o fallaron. Para el proceso académico, enlaza la evaluación versionada cuando corresponda: docs/automatizaciones/<proceso>/evaluacion.md. Usa evidencia sintética o anonimizada. -->

**Indicadores/resultados observados (si aplica):**

<!-- Compara con una línea base o criterio definido. No inventes métricas ni declares éxito sin medición. -->

## Arquitectura, seguridad y operación

- [ ] Justifiqué decisiones o cambios de arquitectura relevantes para el caso
- [ ] Revisé permisos/RLS y límites de autorización afectados
- [ ] Los cambios de esquema, funciones o políticas están en una migración nueva y versionada
- [ ] No incluí secretos ni datos personales innecesarios en código, logs o evidencia
- [ ] Documenté controles operativos afectados; marqué como pendientes los no implementados/no verificados
- [ ] Actualicé documentación, evaluación o entregables si el cambio modifica sus afirmaciones/resultados
- [ ] El cambio es acotado y no incorpora complejidad sin justificarla

## Revisión del PR

- [ ] El título sigue Conventional Commits, por ejemplo `feat(auth): add teacher login`
- [ ] CI pasa y las conversaciones de revisión están resueltas
- [ ] Añadí capturas o pasos de revisión manual cuando son útiles

<!-- La Parte I debe evidenciar análisis, diseño y prototipo. La Parte II continúa ese trabajo y evidencia implementación, pruebas y evaluación. El informe y la presentación finales deben derivarse de resultados realmente observados, no del estado verde de CI. -->

# Tareas de BASE-06

## Preparación

- [x] T001 Preparar la rama aislada y los artefactos en specs/003-vinculacion-matricula/.
- [x] T002 Contrastar los antecedentes de BASE-01 con la RPC vigente en portfolio-coursse/supabase/migrations/0030_academic_resource_access.sql y las pruebas de BASE-05.

## Implementación y pruebas

- [x] T003 [US1] Vincular solo autorizaciones activas de la identidad verificada en portfolio-coursse/supabase/migrations/0037_sync_student_enrollment.sql.
- [x] T004 [US2] Preservar vínculo y grupo al repetir la RPC y serializar las solicitudes en portfolio-coursse/supabase/migrations/0037_sync_student_enrollment.sql.
- [x] T005 [US3] Omitir conflictos y mantener la revocación en portfolio-coursse/supabase/migrations/0037_sync_student_enrollment.sql.
- [x] T006 [US1] Probar ambos órdenes de incorporación e identidad en portfolio-coursse/supabase/qa/base_06_student_enrollment.sql.
- [x] T007 [US2] Probar grupos nulos y no nulos, repetición y dos sesiones en portfolio-coursse/supabase/qa/base_06_student_enrollment.sql y en Supabase local.
- [x] T008 [US3] Probar vínculos antiguos, conflicto y restauración en portfolio-coursse/supabase/qa/base_06_student_enrollment.sql.

## Validación

- [x] T009 Ejecutar las suites y registrar resultados en docs/automatizaciones/gestion-evaluacion-grupal/evaluacion.md.
- [ ] T010 Ejecutar los recorridos OAuth reales conforme a specs/003-vinculacion-matricula/quickstart.md.
- [x] T011 Actualizar los antecedentes y pendientes en docs/backlog/01-base-y-acceso.md.

La migración se entrega conjuntamente para US1–US3. Cada escenario SQL puede verificarse de forma independiente sobre los mismos fixtures sintéticos.

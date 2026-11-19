# Tareas de BASE-03

[Especificación](spec.md) · [Plan](plan.md) · [Validación](quickstart.md)

## Preparación

- [x] T001 Crear la rama aislada y completar los artefactos en specs/002-acceso-academico/.
- [x] T002 Contrastar BASE-01, políticas vigentes y pruebas de BASE-02 en docs/03-calidad-y-operacion/inventario-capacidades-base-01.md y portfolio-coursse/supabase/qa/.

## US1 · Identidad y alcance

- [x] T003 [US1] Centralizar identidad actual y reemplazar políticas y controles en portfolio-coursse/supabase/migrations/0030_academic_resource_access.sql.
- [x] T004 [US1] Integrar la comprobación de sesión en portfolio-coursse/lib/academic/authorize-current-user.ts y las entradas docente y estudiante, y ajustar portfolio-coursse/supabase/config.toml.
- [x] T005 [US1] Adaptar los actores sintéticos y comprobar acceso permitido y denegado en portfolio-coursse/supabase/qa/.

## US2 · Revocación y restauración

- [x] T006 [US2] Proteger vínculos y aplicar cambios de estado atómicos en portfolio-coursse/supabase/migrations/0030_academic_resource_access.sql y portfolio-coursse/app/teacher/students/actions.ts.
- [x] T007 [US2] Comprobar baja con sesión vigente, restauración y preservación de datos previos en portfolio-coursse/supabase/qa/.

## US3 · Opciones de grupo

- [x] T008 [US3] Aplicar vigencia, ventana y privacidad en portfolio-coursse/supabase/migrations/0030_academic_resource_access.sql y portfolio-coursse/components/student-portal/group-selection.tsx.
- [x] T009 [US3] Verificar cupos, nombres y ausencia de correo en portfolio-coursse/supabase/qa/.

## Validación y revisión

- [x] T010 Ejecutar pruebas SQL y estáticas y registrar resultados en docs/automatizaciones/gestion-evaluacion-grupal/evaluacion.md.
- [x] T011 Verificar el aislamiento mediante la API local conforme a specs/002-acceso-academico/quickstart.md.
- [ ] T012 Verificar Google OAuth y los recorridos visuales en specs/002-acceso-academico/quickstart.md.
- [x] T013 Documentar antecedentes y pendientes en docs/backlog/01-base-y-acceso.md.

T003 precede a los recorridos y a las regresiones. T006 y T008 comparten la migración y se integran en orden. Los casos de T005, T007 y T009 se pueden diseñar en paralelo. La entrega valida los tres recorridos juntos.

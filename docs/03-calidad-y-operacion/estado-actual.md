# Calidad y operación: estado documentado

## Verificaciones disponibles en el repositorio

Esta actualización es una **inspección estática**, no una certificación operativa. El
[paquete de la aplicación](../../portfolio-coursse/package.json) declara `dev`, `start`, `lint`,
`build`, `typecheck`, `test` (Vitest), `test:e2e` (Playwright) y `test:db` (Supabase).
Hay una prueba unitaria de infraestructura en `tests/unit/test-harness.test.ts`, soporte E2E y
pruebas SQL; esto no equivale a una batería funcional completa ni a resultados aprobados.
[Vitest](../../portfolio-coursse/vitest.config.ts) busca `tests/unit/**/*.test.ts`;
[Playwright](../../portfolio-coursse/playwright.config.ts) apunta a `tests/e2e`, exige Supabase
local y configura servidor Next.js local, pero no se encontraron escenarios E2E de aceptación.

El workflow [CI](../../.github/workflows/ci.yml) declara instalación, lint, generación de tipos,
TypeScript y build para PR/push a `main`; **no ejecuta** `test`, `test:e2e` ni `test:db`.
[Release](../../.github/workflows/release.yml) declara `semantic-release` en push a `main`, sin
pruebas ni dependencia declarada del job de CI. Su presencia no prueba ejecuciones exitosas,
despliegues ni conexión a producción. La referencia previa a Vercel/Supabase productivo procede
del responsable; no se inspeccionaron proveedor, registros ni disponibilidad de un entorno remoto
de pruebas. Hay configuración local, no certificación de su funcionamiento.

Las [migraciones SQL](../../portfolio-coursse/supabase/migrations/) definen políticas RLS y
funciones para proteger operaciones académicas. La evidencia histórica documenta aplicación de
`0001`–`0029` mediante `db reset --local` en la instancia local. No se repitió aquí. La prueba reproducible
[`group_grades_rls.sql`](../../portfolio-coursse/supabase/tests/group_grades_rls.sql) pasó
con identidades sintéticas: alumno sin lectura, docentes restringidos a sus propios cursos,
modificación permitida al docente responsable e inserción entre cursos rechazada. Los fixtures
se revierten al final. Esto **no prueba la aplicación remota** ni despliegue. En
particular, la migración
[`0029`](../../portfolio-coursse/supabase/migrations/0029_restrict_group_grades_to_teachers.sql)
retira el acceso de lectura estudiantil a notas grupales concedido por `0028` y limita
escrituras docentes a pares grupo/evaluación del mismo curso. Producción no fue modificada.

## Alcance vigente frente a evidencia anterior

El [consolidado](../../development/PLAN-REFINAMIENTO-PARTE-I.md), leído completo, autoriza
consulta estudiantil de notas desde el registro confirmado por participantes históricos de cada
actividad. `0029` la bloquea actualmente: no se revierte ni se interpreta el test histórico de
denegación como aceptación del nuevo alcance. El panel observado consulta puntos y matrícula,
no notas históricas. Reclamos, avisos docentes y XLSX calculado son objetivo acordado, no operación
verificada. La reapertura de ventana es para todo el curso y no obliga a un traslado directo docente.

La [evaluación](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md#alcance-vigente-y-backlog-pendiente)
conserva los FR verificados del alcance anterior y añade historias vigentes pendientes, vinculadas
al [backlog BK-01–BK-24](../04-gestion/backlog-y-responsabilidades.md). BK-01 exige sincronizar
`specs`, que todavía contiene reglas contradictorias. Ningún estado histórico certifica esas ampliaciones.

## Datos de operación aún no confirmados

El responsable indicó que aún no dispone de monitoreo, alertas, respaldos o procedimientos de
recuperación adicionales documentados; tampoco hay evidencia de indicadores de ejecución.
No se verificó la configuración del proveedor ni el mecanismo que conecta el repositorio con
Vercel. Por eso no se atribuyen al sistema controles operativos o resultados de pruebas no
comprobados. La [hoja de ruta de controles](controles-operativos.md) indica cómo preparar,
verificar y documentar esas capacidades; las métricas y CI/CD propuestos figuran en
[indicadores y CI/CD](indicadores-y-ci-cd.md). La referencia anterior a una guía de entorno
Supabase aislado no tiene archivo disponible en este árbol; no se conserva como enlace válido.
Antes de pruebas destructivas debe confirmarse el aislamiento respecto de producción.

Para una automatización terminada, la [constitución](../../.specify/memory/constitution.md)
exige controles, evidencia, monitoreo y una evaluación versionada en
`docs/automatizaciones/<nombre-del-proceso>/evaluacion.md`. En ese registro se deben consignar
pruebas y resultados **ejecutados**, con datos sintéticos o anonimizados, y distinguirlos de lo
planeado. Los detalles del proyecto académico están en
[trabajo final](../05-entregables/trabajo-final.md).

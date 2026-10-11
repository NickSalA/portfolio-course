# Calidad y operación: estado documentado

## Verificaciones disponibles en el repositorio

El [paquete de la aplicación](../../portfolio-coursse/package.json) ofrece `pnpm lint` y
`pnpm build` además de `dev` y `start`. No contiene script de pruebas. Durante esta revisión no
se encontraron pruebas automatizadas rastreadas ni workflows de CI en `.github/workflows/`;
el responsable confirma que actualmente no hay CI configurada. La aplicación se despliega en
Vercel contra el Supabase productivo según el responsable, pero no se revisó su configuración ni
los registros de despliegue. Aún no existe un proyecto Supabase de pruebas.

Las [migraciones SQL](../../portfolio-coursse/supabase/migrations/) definen políticas RLS y
funciones para proteger operaciones académicas. Se aplicaron `0001`–`0029` mediante `db reset
--local` en la instancia local. La prueba reproducible
[`group_grades_rls.sql`](../../portfolio-coursse/supabase/tests/group_grades_rls.sql) pasó
con identidades sintéticas: alumno sin lectura, docentes restringidos a sus propios cursos,
modificación permitida al docente responsable e inserción entre cursos rechazada. Los fixtures
se revierten al final. Esto **no prueba la aplicación remota** ni despliegue. En
particular, la migración
[`0029`](../../portfolio-coursse/supabase/migrations/0029_restrict_group_grades_to_teachers.sql)
retira el acceso de lectura estudiantil a notas grupales concedido por `0028` y limita
escrituras docentes a pares grupo/evaluación del mismo curso. Producción no fue modificada.

## Datos de operación aún no confirmados

El responsable indicó que aún no dispone de monitoreo, alertas, respaldos o procedimientos de
recuperación adicionales documentados; tampoco hay evidencia de indicadores de ejecución.
No se verificó la configuración del proveedor ni el mecanismo que conecta el repositorio con
Vercel. Por eso no se atribuyen al sistema controles operativos o resultados de pruebas no
comprobados. La [hoja de ruta de controles](controles-operativos.md) indica cómo preparar,
verificar y documentar esas capacidades; las métricas y CI/CD propuestos figuran en
[indicadores y CI/CD](indicadores-y-ci-cd.md). Para evitar pruebas sobre producción, consulta la
[guía de entorno aislado](entorno-de-pruebas-supabase.md).

Para una automatización terminada, la [constitución](../../.specify/memory/constitution.md)
exige controles, evidencia, monitoreo y una evaluación versionada en
`docs/automatizaciones/<nombre-del-proceso>/evaluacion.md`. En ese registro se deben consignar
pruebas y resultados **ejecutados**, con datos sintéticos o anonimizados, y distinguirlos de lo
planeado. Los detalles del proyecto académico están en
[trabajo final](../05-entregables/trabajo-final.md).

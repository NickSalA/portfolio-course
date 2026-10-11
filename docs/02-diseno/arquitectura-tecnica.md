# Arquitectura técnica observada

## Componentes

| Parte                      | Ubicación y función                                                                                                                |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Aplicación web             | [`portfolio-coursse/app/`](../../portfolio-coursse/app/): Next.js App Router, páginas públicas, área docente y panel del alumno.   |
| Presentación               | [`portfolio-coursse/components/`](../../portfolio-coursse/components/): componentes de interfaz y formularios por capacidad.       |
| Servicios y acceso a datos | [`portfolio-coursse/lib/`](../../portfolio-coursse/lib/): autorización académica, consultas y clientes Supabase.                   |
| Persistencia y controles   | [`portfolio-coursse/supabase/migrations/`](../../portfolio-coursse/supabase/migrations/): esquema PostgreSQL, RLS y funciones RPC. |

Es una aplicación Next.js con backend de datos/autenticación en Supabase; no hay evidencia en el
repositorio de un servidor de automatización independiente. El responsable indica que la
aplicación se despliega en Vercel, pero la configuración y la conexión con Supabase no se
verificaron en esta revisión.

## Flujos principales

- **Acceso:** el usuario inicia Google OAuth en
  [`login-card.tsx`](../../portfolio-coursse/components/auth/login-card.tsx). La
  [ruta callback](../../portfolio-coursse/app/auth/callback/route.ts) crea la sesión y consulta
  la [autorización académica](../../portfolio-coursse/lib/academic/authorize-current-user.ts).
  La sincronización vincula una autorización por correo con la cuenta; una sesión sin permiso no
  basta para entrar a los datos académicos.
- **Carga de alumnos:** el
  [importador](../../portfolio-coursse/components/teacher/students/csv-importer.tsx) lee CSV o
  XLSX en el navegador y aplica validaciones de formato. La
  [acción de servidor](../../portfolio-coursse/app/teacher/students/actions.ts) invoca
  `import_period_students`; la
  [migración](../../portfolio-coursse/supabase/migrations/0020_fix_authorized_student_import_upsert.sql)
  define sus reglas de escritura. La respuesta persistente es por lote, no un informe fiable de
  éxito o fallo por cada fila de base de datos.
- **Notas grupales:** la
  [pantalla docente](../../portfolio-coursse/app/teacher/grades/page.tsx) consulta evaluaciones,
  grupos y notas, y las [acciones](../../portfolio-coursse/app/teacher/grades/actions.ts)
  permiten registrarlas. La importación XLSX existente corresponde a alumnos, no a estas notas.
- **Consulta del alumno:** el
  [panel](../../portfolio-coursse/lib/student/get-dashboard.ts) consulta matrículas activas y
  puntos para la cuenta autorizada; actualmente no muestra las notas grupales.

## Alcance de esta descripción

RLS y funciones están definidos en SQL, pero no se ha verificado aquí su aplicación en una
instancia Supabase. Tampoco se han confirmado los dominios, las alertas o el monitoreo de Vercel
ni otros entornos. La justificación de arquitectura de una automatización futura se debe
registrar junto con su especificación y, al concluirla, con sus resultados de evaluación.

Decisión previa relacionada:
[autorización por correo](../../portfolio-coursse/docs/adr/0001-autorizacion-previa-por-correo.md).

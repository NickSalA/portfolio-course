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

## Objetivo acordado, todavía no implementado/verificado

Fuente: [consolidado vigente](../../development/PLAN-REFINAMIENTO-PARTE-I.md), secciones 4–6.
La especificación anterior requiere sincronización mediante BK-01 del [backlog](../04-gestion/backlog-y-responsabilidades.md); no tratar sus
exclusiones como aceptación vigente ni dar por implementadas estas ampliaciones.

- **Consulta histórica:** al confirmar notas y puntos quedan visibles a sus destinatarios, sin
  fase de publicación. La autorización debe resolver participantes de cada actividad, no grupo
  actual. El [modelo](modelo-datos.md) describe la historia faltante. `0029` bloquea hoy lectura
  estudiantil: no revertirla a `0028`, cuyo permiso por grupo actual no cumple el objetivo.
- **Reclamos:** uno grupal por grupo/evaluación, creable por cualquier participante histórico y
  consultable por esos participantes y docente; uno individual por movimiento de puntos propio,
  privado alumno/docente. Pendiente → En revisión → Respondido; decisión final motivada sin
  réplica, reapertura ni segundo reclamo del registro. Una respuesta favorable requiere corrección
  expresa de notas/puntos, nunca cambio automático.
- **Correo:** solo aviso al docente por reclamo nuevo, breve y con enlace, sin nota, puntos ni
  texto del reclamo. Sin aviso al alumno, recordatorios o escalamiento. Si falla, el reclamo
  permanece registrado; recuperación y proveedor pendientes, no servicio operativo acreditado.
- **Exportación XLSX por curso:** notas base por historia y puntos individuales, sin consumir
  saldo ni modificar notas grupales o compañeros; repetible con iguales entradas. No confundir
  con el importador de padrón existente ni con integración SUM/acta oficial. Como supuesto del
  equipo, igual peso por trabajo, +1 unidad por punto distribuido automáticamente una sola vez,
  tope 20; para `n` notas completas y saldo no negativo, sumar a las bases
  `min(saldo, suma de márgenes hasta 20)` y dividir entre `n`. Excedente conservado sin efecto.
  Pendientes en blanco, cero explícito y sin promedio final ajustado completo si faltan notas;
  redondear solo al final a dos decimales. Reparto visible por trabajo no acordado. Saldo negativo,
  movimientos incluidos, columnas y precisión de notas base siguen pendientes.
- **Grupos:** docente define número, capacidad y ventana; alumno elige/cambia si hay cupo dentro
  de ella. Ampliación/reapertura para todo el curso, sin exigir traslado directo docente ni crear
  automáticamente una categoría de solicitud de reapertura. No se reciben tareas ni sus plazos.

No se observó implementación de reclamos. El componente
[`group-grades-table.tsx`](../../portfolio-coursse/components/teacher/grades/group-grades-table.tsx)
contiene una descarga XLSX de notas por grupo e integrantes actuales, pero no demuestra la salida
histórica individual ni el cálculo de puntos acordado. BK-19 y BK-20 deben verificar y completar
esa capacidad candidata, no asumir que toda exportación está ausente. Las historias y pruebas de
aceptación pendientes se separan del inventario
histórico en la [evaluación](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md#alcance-vigente-y-backlog-pendiente).

## Configuración de validación observada

[package.json](../../portfolio-coursse/package.json) declara lint, build, typecheck, Vitest,
Playwright y pruebas SQL. Existen configuraciones y archivos de soporte, no una aceptación
integral demostrada. [CI](../../.github/workflows/ci.yml) configura lint, tipos y build, pero no
pruebas unitarias/E2E/SQL; [Release](../../.github/workflows/release.yml) configura semantic-release,
no despliegue de aplicación. Véase [estado actual](../03-calidad-y-operacion/estado-actual.md).
Solo se inspeccionaron archivos; no se ejecutaron scripts, workflows ni servicios.

## Alcance de esta descripción

RLS y funciones están definidos en SQL, pero no se ha verificado aquí su aplicación en una
instancia Supabase. Tampoco se han confirmado los dominios, las alertas o el monitoreo de Vercel
ni otros entornos. La justificación de arquitectura de una automatización futura se debe
registrar junto con su especificación y, al concluirla, con sus resultados de evaluación.

Decisión previa relacionada:
[autorización por correo](../../portfolio-coursse/docs/adr/0001-autorizacion-previa-por-correo.md).

# Documento del proyecto

## Propósito y alcance actual

`portfolio-coursse/` es una aplicación Next.js orientada principalmente a la gestión académica
por docentes. Surgió de una necesidad real planteada por un docente en el contexto de la UNMSM:
antes llevaba notas en XLSX y necesitaba reunir la organización de grupos, las notas grupales y
los puntos en una plataforma, en lugar de mantener registros dispersos. Un docente administra
periodos, cursos, alumnos autorizados, grupos, movimientos de puntos y notas grupales. El alumno
accede a la información autorizada que su panel expone. Existe también una ruta pública de
portafolio; el foco de esta documentación es la plataforma académica. Según el responsable del
proyecto, el entorno de despliegue actual es Vercel; esta revisión no verificó su configuración
ni la disponibilidad del servicio.

## Actores y procesos

- **Docente:** configura periodos/cursos, carga alumnos, gestiona grupos, puntos y notas grupales.
- **Alumno:** inicia sesión mediante Google/Supabase Auth y consulta sus cursos, grupos y puntos
  cuando está autorizado; la interfaz no muestra notas grupales. La migración `0028` permitía
  consultarlas directamente para el grupo actual; la nueva `0029` retira ese permiso, pendiente
  de aplicación y verificación por entorno (véase el [modelo de datos](../02-diseno/modelo-datos.md)).
  La identidad autenticada no implica acceso académico.
- **Sistema:** vincula autorizaciones por correo con cuentas autenticadas y controla el acceso a
  recursos académicos mediante reglas de servidor y PostgreSQL.

El docente recibe un XLSX del SUM al inicio del curso, durante las primeras semanas de clase, y
lo usa para cargar alumnos. El proceso de carga admite CSV y XLSX en la interfaz; la acción del
servidor invoca una RPC para importar autorizaciones. **Esa importación no es una importación de notas desde
XLSX.** El módulo docente de evaluaciones y notas grupales ya tiene esquema, pantalla y acciones
de guardado; no se ha comprobado aquí su operación en Vercel/Supabase. Las notas grupales son
información de uso docente que se desea exportar posteriormente; esa exportación es una capacidad
futura. Los puntos son individuales, pero no se consideran una calificación individual. La
importación de calificaciones desde XLSX y otros tipos de notas no deben tratarse como funciones
existentes sin una especificación e implementación verificadas.

El [caso seleccionado para el trabajo final](caso-evaluacion-grupal.md) es la gestión de
la evaluación grupal; la carga inicial de alumnos es su entrada, no el proceso que se evaluará
por separado. El docente debe poder autorizar un cambio de grupo aun fuera de la ventana de
elección: el alumno conserva las notas obtenidas antes del cambio y las siguientes deben
corresponder a su nuevo grupo. Esta es una **regla deseada, no una función implementada**: el
esquema actual no guarda la membresía histórica necesaria para atribuir esas notas al alumno
tras el traslado. La fecha de la actividad, no la fecha de registro o corrección, determina la
pertenencia; se prevé una corrección individual justificada como excepción secundaria para
una etapa posterior, todavía sin implementar. Solo el docente responsable del curso puede
modificar sus notas. Véase el [diseño propuesto](../02-diseno/modelo-datos.md).

## Límites y referencias

La aplicación utiliza Next.js, React y TypeScript; Supabase proporciona autenticación y PostgreSQL.
El despliegue Vercel indicado por el responsable utiliza actualmente Supabase productivo; aún no
existe un entorno Supabase de pruebas. No se presupone un servidor de automatización separado. Los requisitos detallados de nuevas
funcionalidades pertenecen a los artefactos de Spec Kit; la referencia normativa es la
[constitución](../../.specify/memory/constitution.md).

Fuentes: [`README` de la aplicación](../../portfolio-coursse/README.md),
[rutas docentes](../../portfolio-coursse/app/teacher/),
[acceso académico](../../portfolio-coursse/lib/academic/authorize-current-user.ts),
[importador](../../portfolio-coursse/components/teacher/students/csv-importer.tsx) y
[spec histórica de acceso](../../portfolio-coursse/docs/specs/0001-acceso-institucional-y-autorizacion.md).
La spec histórica describe también intenciones que deben contrastarse con la implementación vigente.

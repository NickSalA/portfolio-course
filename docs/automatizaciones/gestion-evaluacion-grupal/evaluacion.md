# Evaluación de la automatización: gestión de evaluación grupal

**Estado del registro:** inventario histórico conservado y capa de alcance vigente pendiente.
Inventario por inspección estática; pruebas locales de QA R4 ejecutadas el 2026-10-24 (ver «Resultados de implementación y pruebas»).

Este documento registra evidencia ejecutada para la Parte II. Una capacidad presente en código o documentación se clasifica como `present-unverified` hasta superar una comprobación reproducible en un entorno aislado. No contiene resultados de producción ni afirma que existan monitoreo, alertas, respaldos o recuperación no verificados.

## Referencias

- Especificación: [`../../../specs/001-manage-group-evaluation/spec.md`](../../../specs/001-manage-group-evaluation/spec.md)
- Plan: [`../../../specs/001-manage-group-evaluation/plan.md`](../../../specs/001-manage-group-evaluation/plan.md)
- Tareas: [`../../../specs/001-manage-group-evaluation/tasks.md`](../../../specs/001-manage-group-evaluation/tasks.md)
- Guía de validación: [`../../../specs/001-manage-group-evaluation/quickstart.md`](../../../specs/001-manage-group-evaluation/quickstart.md)
- EXP-01 #38: [especificación](../../../specs/001-export-decisions/spec.md), [plan](../../../specs/001-export-decisions/plan.md), [tareas](../../../specs/001-export-decisions/tasks.md) y [guía](../../../specs/001-export-decisions/quickstart.md).

## BASE-04 #13 · Periodos y cursos docentes

**Fecha:** 2026-11-19 · **Versión:** rama `feature/BASE-04`, migración `0032` · **Entorno:** Supabase local aislado y datos de prueba; resultados del recorrido visual comunicados por el responsable.

| Escenario                               | Esperado                                                                                                             | Observado                                                                                                    |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `pnpm test:db`, dos docentes sintéticos | Cada docente gestiona sus cursos sin leer ni modificar los ajenos; se rechazan cambios docentes a periodos globales. | Las tres suites pasaron, incluida `base_04_courses_periods.sql`; las transacciones de prueba se revirtieron. |
| Recorrido docente local                 | Seleccionar periodo, crear, renombrar, archivar y restaurar curso; segundo docente no ve el curso ajeno.             | El responsable informó que completó esos pasos y comprobó la separación con una segunda cuenta.              |
| Seed local sobre base con periodos      | No modificar el calendario existente, incluso al repetirlo.                                                          | Dos ejecuciones dentro de una transacción no insertaron filas; se revirtió la transacción.                   |

**Revisión posterior:** con la migración `0033` aplicada en Supabase local, `pnpm test:db` pasó las tres suites, incluyendo el rechazo de un segundo periodo actual por inserción o actualización y una transición válida. Las pruebas unitarias de `updatePeriodDates` pasaron para fila actualizada, cero filas y error. No se probó una carrera concurrente ni la aplicación sobre datos duplicados existentes.

**Decisión y límites:** el equipo administrador gestionará los periodos reales directamente en la base de datos; el seed es solo para desarrollo. No se ejecutó la carga automática del seed en una base vacía ni la operación administrativa en un entorno real. La configuración OAuth desplegada sigue en BASE-03 #12, la revisión de experiencia en BASE-07 #16 y la importación de cursos archivados en BASE-05 #14. No se realizó una evaluación formal de usabilidad. La revisión independiente corresponde al PR; el seguimiento de estos resultados se actualizó en archivos locales, no en la issue de GitHub.

## BASE-03 #12 · Acceso académico por recurso

**Fecha** 2026-11-18 · **Versión** rama `feature/base-03-acceso-academico`, migración `0030` · **Entorno** Supabase aislado en Docker, PostgreSQL 17 y Node 24. [Especificación](../../../specs/002-acceso-academico/spec.md) · [Plan](../../../specs/002-acceso-academico/plan.md) · [Tareas](../../../specs/002-acceso-academico/tasks.md).

| Comprobación                              | Esperado                                                                                                                                              | Observado                                                                            |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Suites SQL de BASE-02 y RLS de notas      | Alumno ve recursos propios; alumno sin autorización o sesión y docente ajeno quedan denegados. Los permisos legítimos de notas y puntos se conservan. | Ambas suites pasaron con identidades sintéticas y rollback.                          |
| Identidad y revocación con sesión abierta | Otra clase de sesión carece de acceso académico. La baja retira acceso y la reactivación válida conserva matrícula y grupo.                           | Casos aprobados en SQL, sin volver a sincronizar entre baja y consulta.              |
| Opciones de grupo                         | Capacidad y ocupación; nombres durante la ventana; respuesta sin correos.                                                                             | Casos aprobados en SQL.                                                              |
| Actualización `0029 → 0030` y API local   | Conservar una matrícula previa inconsistente sin darle acceso. El alumno autorizado ve su curso y las consultas sin sesión quedan vacías.             | Actualización y consultas HTTP aprobadas con sesiones sintéticas y datos temporales. |
| Comprobaciones de aplicación              | Lint, tipos, pruebas unitarias y compilación sin errores.                                                                                             | ESLint, TypeScript, 8 pruebas Vitest y build de Next.js con Turbopack aprobados.     |
| Rutas de la aplicación sin sesión         | Docente y alumno son redirigidos al login.                                                                                                            | Las dos rutas respondieron con HTTP 307 y destino `/login` usando el build local.    |

**Pendientes**. OAuth real y recorridos visuales docente/alumno quedan por ejecutar con las credenciales Google de desarrollo. Los datos y sesiones sintéticos comprueban la base y la API, pero no el intercambio de código con Google. El responsable de Supabase debe verificar los proveedores del entorno desplegado antes de aplicar la migración allí. El ciclo completo de incorporación queda en BASE-06 #15 y la consulta de notas históricas queda en EVA-04 #27. El inventario BASE-01 conserva su carácter histórico.

### Revisión del PR #57

**Fecha** 2026-11-18 · **Entorno** Supabase local, PostgreSQL 17 y Node 24 · **Migración** `0031_academic_access_review.sql`.

- **Identidad del padrón y puntos.** La combinación de curso y correo canónico de una autorización es inmutable desde su creación. Una corrección de identidad requiere una autorización nueva y la baja de la anterior. Los puntos y las matrículas existentes conservan su titularidad. El caso SQL comprobó el rechazo de una reasignación y el alta de una cuenta con autorización previa. También verificó que un compañero del mismo curso queda excluido de los puntos ajenos.
- **Ingreso y cupos.** El callback reintenta la sincronización una vez cuando la primera respuesta no encuentra matrícula. Dos pruebas unitarias verificaron el resultado del reintento. En SQL se comprobó que una matrícula sin identidad vigente no ocupa cupo y que el resultado coincide entre las opciones de grupo y la selección.
- **Contraste con las migraciones vigentes.** `0006` ya hace que la comprobación de titularidad docente invoque el control de rol e identidad. `0029` elimina la lectura estudiantil de notas grupales. `0004` crea solo el perfil en el alta Auth. `0007` ya obliga a normalizar el correo y garantiza la unicidad por curso. Las suites locales de capacidades y RLS de notas pasaron tras aplicar `0031`.
- **Seguimiento.** La preasignación de grupos durante la sincronización corresponde a GRP-03 #20 y BASE-06 #15. El inicio real con Google y la configuración desplegada siguen pendientes en #12. El inventario histórico permanece como referencia de contraste.

## BASE-06 #15 · Vinculación de autorización y matrícula

**Fecha** 2026-11-19 · **Base** `develop` `a433807` · **Migración** `0037_sync_student_enrollment.sql` · **Entorno** Supabase aislado en Docker, PostgreSQL 17 y Node 24. [Especificación](../../../specs/003-vinculacion-matricula/spec.md) · [Pruebas SQL](../../../portfolio-coursse/supabase/qa/base_06_student_enrollment.sql).

| Comprobación | Esperado | Observado |
| --- | --- | --- |
| Padrón antes y después del primer ingreso | Solo la identidad verificada se vincula a su autorización activa. El importador de BASE-05 crea la autorización y el siguiente ingreso vincula la cuenta. | Ambos órdenes aprobados en SQL con cuentas sintéticas. |
| Repetición, baja y restauración | El grupo elegido y la matrícula se conservan, con y sin grupo del padrón. Resincronizar tras una baja no restaura el acceso. | Aprobado. Se conservó el grupo B aunque el padrón indicaba A. |
| Vínculos anteriores | Completar un vínculo inequívoco conserva el grupo nulo. Un conflicto antiguo queda inactivo, conserva su referencia y no impide acceder a otro curso válido. | Aprobado con fixture transaccional y rollback. |
| Dos sesiones de la misma identidad | Una sincronización espera a la otra y ambas convergen en una sola matrícula activa con el grupo inicial. | Aprobado en dos conexiones SQL. La segunda esperó el bloqueo antes de continuar. |
| Comprobaciones de aplicación | Lint, tipos, Vitest y build aprobados. | Todos aprobaron, incluidas 13 pruebas unitarias y build con Turbopack. |

**Límite de la suite general**. El runner pasó capacidades actuales, RLS de notas y BASE-04. Se detuvo en `base_05_import_students.sql:151` con `FAIL BASE-05: anonymous RPC grant`. La misma aserción falló tras restablecer otra vez el entorno aislado a `0036`, sin `0037`. El runner específico de BASE-06 pasó. El fallo preexistente se remite a BASE-05 #14 y su responsable.

**Pendientes**. Registrar el inicio real con Google en ambos órdenes cuando haya credenciales locales. La concurrencia entre alumnos distintos por un cupo de grupo preasignado sigue en GRP-03 #20. El inventario BASE-01 conserva su evidencia histórica.

### Revisión del PR #60

- La migración `0038` copia el número de matrícula del padrón al crear el vínculo y lo actualiza cuando el padrón aporta un valor. Si el padrón omite el número, se conserva el que ya tenía la matrícula. La suite de BASE-06 pasó sobre `0037 → 0038` en una transacción con rollback. Se verificaron los ceros iniciales, la actualización del número, la conservación del grupo y la restauración con el número omitido.
- El índice único vigente de `0007` ya cubre curso y correo normalizado. La concurrencia por el último cupo entre alumnos distintos al preasignar grupos sigue en GRP-03 #20. El recorrido real con Google sigue pendiente.

## GRP-02 #19 · Historial de pertenencia a grupos

**Fecha** 2026-11-19 · **Base** `develop` `059f01a` · **Migración** `0039_group_membership_history.sql` · **Entorno** Supabase aislado, PostgreSQL 17 y Node 24. [Especificación](../../../specs/004-historial-grupos/spec.md) · [Suite SQL](../../../portfolio-coursse/supabase/qa/grp_02_group_membership_history.sql).

| Comprobación | Esperado | Observado |
| --- | --- | --- |
| Actualización desde `0038` | El corte registra el grupo vigente, un instante anterior es desconocido y un vínculo incoherente queda desconocido hasta repararse. | Aprobado sobre matrículas sintéticas previas a ejecutar la migración. |
| Cambios y orden | La hora exacta resuelve al estado nuevo. Se distinguen grupo, sin grupo e inactiva. Repetir la sincronización conserva los intervalos. Un rollback revierte ambos cambios. | Aprobado en la suite SQL. |
| Dos conexiones | La segunda escritura espera a la primera. Se conservan tres intervalos adyacentes en orden. | Aprobado con dos conexiones SQL y confirmación del bloqueo. |
| Acceso y conservación | El docente responsable puede consultar. La sesión anónima, el alumno y el docente ajeno quedan denegados. Reducir grupos conserva las referencias y la nota existente. | Aprobado en la suite SQL. |
| Comprobaciones de aplicación | Lint, TypeScript, unitarias y build aprobados. | Pasaron las comprobaciones, incluidas 13 pruebas Vitest y build con Turbopack. |

**Regresiones y pendientes**. Pasaron por separado las suites de capacidades, RLS de notas, BASE-04, BASE-06 y GRP-02. El runner completo se detiene en la aserción `anonymous RPC grant` de BASE-05, tanto en la base `0038` como con `0039`. La suite de requisitos pendientes conserva la nota 12 al reducir grupos y sigue esperando los adaptadores de GRP-06 #23 y EVA-04 #27. La coordinación de cupos preasignados queda en GRP-03 #20. El inventario BASE-01 sigue siendo evidencia histórica.

## BASE-07 #16 · Experiencia de acceso y contexto académico

**Fecha** 2026-11-20 · **Base** `develop` `030b34c` · **Rama** `feature/BASE-07-experiencia-acceso` · **Entorno** Supabase local aislado en Docker (migraciones `0001`–`0043`, periodo sintético `2026-II`), Node 22.18.0, Next.js 16.3.0 y Chrome headless (Playwright) con identidades sintéticas `@example.test`.

### Recorrido y representación actualizada

```text
/ (inicio) ──▶ /login (LoginCard: errores oauth / authorization / unauthorized)
                  │
                  ▼ /auth/callback (authorizeCurrentUser)
          ┌───────┴───────┐
          ▼               ▼
   /student             /teacher (sidebar: ?period & ?course en Alumnos/Puntos/Notas;
   (loading.tsx,         Periodos/Ajustes/Cerrar sesión visibles en escritorio y móvil)
    error.tsx,            ├── /teacher/courses/[id] (muestra periodo real del curso)
    alerta forbidden,     ├── /teacher/students · /points · /grades
    distingue error       ├── /teacher/periods · /settings
    de lista vacía)       └── not-found.tsx / error.tsx (404 neutro en español)
```

### Comprobaciones ejecutadas

| Recorrido | Esperado | Observado |
| --- | --- | --- |
| A1–A2 · Visitante y rutas protegidas | Acceso a `/login`; `/teacher`, `/teacher/grades` y `/student` sin sesión redirigen a `/login`. | Aprobado en Chrome local. |
| A3 · Ingreso real con Google (sin padrón y docente) | Cuenta sin padrón rechazada en `/login?error=unauthorized`; tras asignar `role = teacher` en Supabase local, accede a `/teacher`. | Aprobado manualmente en entorno local con Google OAuth (`CLIENT_ID` y `CLIENT_SECRET` de desarrollo; sin registrar correos personales). |
| A5 · Retorno OAuth sin código | Redirección a `/login?error=oauth` con alerta en español. | Aprobado (`No se pudo completar el inicio de sesión con Google.`). |
| A6–A8 · Contexto docente y detalle de curso | Nombre, rol, periodo y curso visibles; `?period=` y `?course=` se conservan entre módulos y el detalle muestra el periodo real del curso. | Aprobado tras corregir `teacher-sidebar.tsx`, `period-context-switcher.tsx` y `courses/[coursePublicId]/page.tsx`. |
| A9–A10, A19 · Curso ajeno, inexistente y ruta `/teacher/groups` | Estado neutro «Este recurso no está disponible» sin revelar cursos ajenos ni mostrar placeholder engañoso. | Aprobado (`teacher/not-found.tsx` idéntico para curso ajeno e inexistente; `groups` retirado del placeholder). |
| A15–A16 · Cierre de sesión escritorio y móvil (`375×812`) | Botón visible en ambos tamaños; al cerrar sesión, volver a `/teacher` o `/student` exige login. | Aprobado tras habilitar `SignOutButton`, Periodos y Ajustes en vista móvil. |
| A11–A12, A14 · Panel del alumno y acceso prohibido | Curso y periodo visibles; `/teacher` como alumno muestra alerta `forbidden`; cuenta sin padrón ve estado vacío honesto. | Aprobado en Chrome local (`student-dashboard.tsx`, `app/student/page.tsx`). |
| Consulta del alumno con fallo (Vitest) | Distinguir fallo de consulta/RPC (`query-failed`) de ausencia de cursos; no ocultar fallos como lista vacía. | Aprobado en 4 pruebas unitarias simuladas (`get-student-dashboard.test.ts`). |
| Teclado en `/login` | Orden lógico de Tab hacia botón de Google y foco visible. | Comprobado (`Tab` recorre tema → «Continuar con Google»). |
| Comprobaciones técnicas y BD | Lint, tipos, Vitest, build y suites SQL locales sin errores. | `pnpm lint`, `pnpm typecheck`, `pnpm test` (6 archivos / 20 pruebas), `pnpm build` y `pnpm test:db` (8 suites) aprobados. |

**Dimensiones verificadas y límites:** se comprobó **implementación en código**, **descubrimiento** desde la navegación de cada rol y **funcionamiento visible** tanto con sesiones sintéticas en Chrome (`1280×800` y `375×812`) como con inicio de sesión real de Google OAuth en local (rechazo sin padrón y acceso docente tras asignar rol en Studio local). No se automatizaron pruebas de `error.tsx` ante un fallo de runtime ni una auditoría integral de accesibilidad (seguimiento en `QA-01 #42`). El retorno a `next` tras sesión vencida (`H14`) queda pendiente de decisión con R1, y la verificación de OAuth desplegado corresponde a producción/BASE-03. No se modificaron RLS ni migraciones.

## GRP-01 #18 · Configuración de número, capacidad y ventana de grupos

**Fecha** 2026-11-20 · **Base** `develop` `c560503` · **Rama** `feature/GRP-01-config-grupos` · **Migración** `0047_configure_group_count_and_locks.sql` · **Entorno** Supabase local aislado en Docker (`0001`–`0047`), Node 22.18.0, Next.js 16.3.0 (`pnpm build` + `pnpm start`) y Chrome headless con cuentas sintéticas `@example.test`.

### Condiciones de configuración verificadas

- **Número y capacidad:** ambos deben ser enteros `>= 1`; la capacidad nunca puede quedar por debajo de los alumnos activos actualmente asignados a un grupo (`capacity_below_existing_members`). Si `número × capacidad` es menor que los alumnos activos autorizados, la UI muestra una advertencia visible pero permite guardar (decisión documentada para revisión con R1 `@NickSalA`).
- **Cursos vacíos y conservación histórica:** permite crear grupos aunque el curso tenga `0` alumnos autorizados. Al reducir el número de grupos, solo se eliminan grupos excedentes sin integrantes, `authorized_students`, `group_grades` ni historial `academic_access.group_membership_history`; los grupos conservados se informan al docente.
- **Ventana y reapertura global:** siempre en zona `America/Lima` con cierre estrictamente posterior a apertura (`closes > opens`, admitiendo cualquier minuto, incluido `23:59`). Se muestran cuatro estados con texto (`Sin configurar`, `Programada`, `Abierta`, `Cerrada`) y opciones de ampliación o reapertura para **todo el curso**, sin permisos individuales ni impacto en cursos ajenos.
- **Curso activo y concurrencia:** `synchronize_course_groups` y `configure_course_group_selection` bloquean la fila del curso (`FOR UPDATE`) exigiendo `courses.active = true` (`course_not_active`) y `is_teacher_of_course` (`not_course_teacher`). `synchronize_course_groups` adquiere `pg_advisory_xact_lock(group.id)` en orden por `id` antes de validar ocupación y mantiene compatibilidad retroactiva de 2 argumentos (`target_group_count default null`).

### Recorrido docente actualizado

```text
/teacher/courses/[coursePublicId] (muestra Grupos, Autorizados activos y Asignados activos)
  ├── Tarjeta «Configurar grupos» (GroupCapacityForm)
  │     ├── Alumnos por grupo (>= 1) + Número de grupos (>= 1, sugerido ceil(activos/cap))
  │     ├── Vista previa en vivo: cupos totales, advertencia de déficit o reducción segura
  │     └── Envío con estado pendiente ──▶ synchronizeGroups ──▶ RPC 0047 ──▶ banner ?saved=groups (+retained) o alerta
  ├── Tarjeta «Ventana de selección» (siempre visible, con badge de estado y horario Lima)
  │     └── GroupSelectionWindowDialog (Configurar / Ampliar o editar / Reabrir para todo el curso)
  │           ├── Atajo editable «Prellenar desde ahora (+48 h)» al reabrir
  │           └── Validación rango (step=60) ──▶ saveSelectionWindow ──▶ RPC 0047 ──▶ banner ?saved=window | window-reopened
  └── Listado de Grupos ──▶ GroupMembersDialog (miembros activos únicamente)
```

### Comprobaciones ejecutadas

| Comprobación | Esperado | Observado |
| --- | --- | --- |
| `grp_01_group_configuration.sql` (`pnpm test:db`) | Número explícito con 0 y con alumnos; reducción conserva grupos con notas/historial y elimina libres; rechazo de `0`, `< miembros`, `cierre <= apertura`, curso archivado y docente ajeno; reapertura habilita curso A sin tocar curso B; firma de 2 argumentos compatible. | Aprobado en Docker local con rollback. Pasaron 10 suites SQL (`current_capabilities`, `eva_02_*`, `group_grades_rls`, `eva_01`, `base_04`–`06`, `grp_01`, `grp_02`). *Nota preexistente:* `grp_06_activity_participants.sql` falla en este entorno Windows por fin de línea CRLF al copiar `grp_06_concurrency.sh`. |
| Pruebas unitarias (`group-config.test.ts`) | Sugerencia de grupos, parseo/formato `America/Lima` (`23:59`), estados `[opens, closes)`, validación de rango y aviso de cierre pasado, atajo +48 h y vista previa de cupos. | 6/6 pruebas aprobadas dentro de Vitest (7 archivos / 26 pruebas en total). |
| Navegador local (`1280×800` y `375×812`, sintético) | Curso vacío crea 3×4 y ve tarjeta de ventana; conteo filtra inactivos; capacidad `< miembros` alerta y bloquea envío; reducción de 3 a 1 conserva grupo con nota y avisa `1` retenido; rango inválido bloquea y `23:59` guarda estado `Cerrada`; reapertura cambia a `Abierta` sin alterar otro curso; curso archivado deshabilita controles; docente B recibe 404 neutro; móvil sin desborde y `Esc` cierra diálogos. | Aprobado en todos los recorridos probados sobre `next start` local. |
| Comprobaciones de aplicación | Lint, generación de tipos, TypeScript y build de producción sin errores. | `pnpm lint`, `pnpm typecheck` y `pnpm build` aprobados. |

**Dimensiones verificadas y pendientes:** se verificaron **implementación en código**, **descubrimiento**, **funcionamiento visible** y **revisión básica de teclado/móvil (`aria-labelledby`, `role="alert"`, `role="status"`, `Esc`, `375px`)** en entorno local aislado. La validación de selección concurrente estudiantil y resincronización corresponde a `GRP-03 #20` (R1), el recorrido estudiantil de selección a `GRP-04 #21` (R2) y la auditoría integral de accesibilidad a `QA-01 #42`. Decisión propuesta para revisar en PR con R1 (`@NickSalA`): mantener `número × capacidad < autorizados` como advertencia no bloqueante en UI.

## EXP-01 #38: decisiones y evidencia documental

**Fuente y revisión:** R1 se identificó en la conversación como @NickSalA y confirmó las reglas de [EXP-01](../../backlog/05-exportacion.md); comunicó que R3 las revisó y aceptó, y que la revisión completa se realizará en el PR. Es un reporte de R1, no una aprobación independiente comprobada en GitHub; no se dispone aquí de fecha ni comentario de R3. El profesor no confirmó la fórmula. Seguimiento actualizado en archivos locales únicamente; GitHub no se modificó.

**Contraste BASE-01 — inspección estática:** la generación XLSX existente es candidata a reutilización, no aceptación funcional. `portfolio-coursse/components/teacher/grades/group-grades-table.tsx` exporta por grupo, integrantes actuales, valores locales potencialmente no guardados y pendientes `-`; `portfolio-coursse/components/teacher/points/export-points-button.tsx` suma movimientos activos y exporta puntos por separado. Falta salida individual integrada con historia y cálculo (#39, #40 y GRP-06 #23). La nota se almacena como `numeric(4,2)`, pero la acción actual no rechaza explícitamente entradas con más de dos decimales y la interfaz usa paso 0,1; adecuación de entrada corresponde al responsable de notas (EVA-01 #24). Las funciones de exportación inspeccionadas no escriben saldo ni notas; no se verificó repetición ni descarga. Los anulados se conservan en la base y se excluyen del saldo actual; visibilidad explicativa es seguimiento EVA-02/03 (#25/#26).

**Ejemplos esperados preparados** para #39/#41: no equivalen a pruebas ejecutadas del cálculo o del XLSX. Con datos sintéticos y fórmula documentada:

| Notas base | Saldo | Aplicados | Excedente |  Promedio base | Ajustado |
| ---------- | ----: | --------: | --------: | -------------: | -------: |
| 10, 18     |    15 |        12 |         3 |          14,00 |    20,00 |
| 10, 10, 11 |     1 |         1 |         0 | 10,33 (visual) |    10,67 |
| 0, 1       |    −3 |        −1 |        −2 |           0,50 |     0,00 |
| 19,50      |     1 |      0,50 |      0,50 |          19,50 |    20,00 |
| 0,25       |    −1 |     −0,25 |     −0,75 |           0,25 |     0,00 |
| 20, 20     |     3 |         0 |         3 |          20,00 |    20,00 |
| 0, 20      |     0 |         0 |         0 |          10,00 |    10,00 |

Otros esperados: +3 activo y −1 anulado dan saldo 3, conservando ambos registros; con `10, pendiente` y saldo 3, el saldo se muestra y los promedios, aplicados y excedente quedan vacíos; sin trabajos y saldo 3 ocurre lo mismo, sin división. El cero explícito no es pendiente. El promedio ajustado final `13,505` se muestra `13,51`; no usar el promedio base visualizado para calcular.

**Comprobaciones de esta revisión:** el agente contrastó código, migraciones, backlog y ejemplos; un cálculo con `Decimal` imprimió los cinco resultados de la tabla y el empate esperado, pero el proceso terminó con código 2 por `Cannot set tty process group`, por lo que no se presenta como suite aprobada. No se ejecutaron descarga, interfaz, aplicación del cálculo o recorrido visual. Para aceptación de implementación siguen #39, #40, #41 y GRP-06 #23; la restricción y pruebas de notas corresponden a EVA-01 #24. El inventario BASE-01 se mantiene histórico, sin editarlo como evidencia nueva.

**Comprobaciones documentales adicionales:** `git diff --check` devolvió código interno 0 (el lanzador emitió después el error de TTY). Un chequeo local de rutas Markdown en este archivo, el caso y el backlog encontró cuatro enlaces históricos rotos a `specs/001-manage-group-evaluation/` (spec, plan, tareas y guía); los enlaces de EXP-01 existen. Queda pendiente recuperar o corregir esas referencias históricas, a cargo de DOC-01 #47; no se alteró ni inventó la documentación histórica.

## Vocabulario de estado

- `verified`: comportamiento ejecutado y respaldado por evidencia reproducible indicada aquí.
- `present-unverified`: existe una implementación candidata, pero aún no se ejecutó toda su aceptación.
- `missing`: la revisión encontró una brecha necesaria.
- `out-of-scope`: decisión explícita de no implementar en Parte II.
- `evaluated`: además de verificarse, cuenta con medición frente al protocolo acordado.

## Alcance vigente y backlog pendiente

Fuente de acuerdos: [consolidado vigente](../../../development/PLAN-REFINAMIENTO-PARTE-I.md),
leído completo, especialmente secciones 4–6. Esta capa no reemplaza ni recalifica la evidencia
histórica que sigue abajo. Las exclusiones iniciales de consulta de notas y reclamos fueron
reemplazadas por acuerdos con el solicitante, no por peticiones iniciales literales del profesor.

**Gestión BK:** el [backlog vigente](../../04-gestion/backlog-y-responsabilidades.md) identifica
BK-01–BK-24. BK-01 registra la sincronización de `specs`, que conserva contradicciones (por ejemplo,
FR-032 y traslado docente FR-013); no usarla como aceptación del nuevo alcance sin sincronizar.
Las historias siguientes describen la situación inspeccionada, no tareas ya completadas:
consulta BK-13, reapertura BK-08, reclamos BK-14–BK-17, correo BK-18 y cálculo/exportación BK-19–BK-20.

| Historia / fuente del caso                          | Estado de alcance vigente                                  | Brecha y aceptación pendiente (no ejecutada aquí)                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta de notas por participantes históricos — §4 | Acordada; missing en consulta estudiantil                  | Panel solo consulta matrícula/puntos; `0029` bloquea lectura. Persistir historia y permitir nota al confirmar registro a participantes de esa actividad, aun tras cambiar de grupo; negar a ajenos. No revertir `0029` ni restaurar permiso por grupo actual de `0028`.                                                                                                                                          |
| Reapertura general de selección — §4                | Acordada; present-unverified para configuración de ventana | Existen ventana y acciones de grupos; comprobar ampliación/reapertura para todo el curso, cupo y cambios del alumno. No exigir traslado directo docente ni categoría automática de solicitud. FR-013 histórico no es obligación nueva.                                                                                                                                                                           |
| Reclamo grupal histórico — §4                       | Acordada; missing en esquema inspeccionado                 | Un reclamo por grupo/evaluación, creado por cualquier participante histórico, visible solo a esos participantes y docente. Probar unicidad concurrente, cambios de grupo y aislamiento.                                                                                                                                                                                                                          |
| Reclamo individual de puntos — §4                   | Acordada; missing en esquema inspeccionado                 | Uno por movimiento propio; privacidad alumno/docente. Probar rechazo de movimiento ajeno y segundo reclamo del mismo registro.                                                                                                                                                                                                                                                                                   |
| Atención final de reclamos — §4                     | Acordada; missing                                          | Pendiente → En revisión → Respondido; motivo y decisión final docente, sin réplica, reapertura ni segundo reclamo. Respuesta favorable no modifica notas/puntos automáticamente; corrección expresa.                                                                                                                                                                                                             |
| Aviso docente de reclamo — §4 y §6                  | Acordada; missing                                          | Correo solo al docente por reclamo nuevo: aviso breve y enlace, sin notas, puntos ni texto. Sin avisos al alumno, recordatorios o escalamiento. Reclamo persiste ante fallo; recuperación por definir.                                                                                                                                                                                                           |
| XLSX histórico por curso — §5                       | Acordada; present-unverified parcial                       | Existe descarga XLSX en `components/teacher/grades/group-grades-table.tsx` basada en grupos y miembros actuales; falta verificar/completar salida por alumno con participación histórica y puntos individuales. No confundir importación de padrón con exportación. Sin consumo/modificación del saldo, bases o compañeros; iguales entradas, iguales resultados académicos. No acta oficial ni integración SUM. |
| Cálculo individual con puntos — §5–6                | Supuesto explícito del equipo; pendiente                   | Igual peso, +1 unidad por punto, distribución automática una sola vez, cap 20 por trabajo. Para `n` notas completas y saldo no negativo: `aplicados = min(saldo, suma(20 - base_i))`; `promedio = (suma(bases) + aplicados) / n`. No sumar saldo a cada trabajo ni otra vez al promedio; conservar excedente sin efecto.                                                                                         |
| Pendientes y precisión XLSX — §5–6                  | Decisiones EXP-01 documentadas; implementación pendiente   | Pendiente en blanco; cero explícito; sin promedio final ajustado completo si falta nota del conjunto incluido; solo redondeo final a dos decimales. No inventar reparto visible por trabajo. Las decisiones sobre columnas, negativos, anulados y precisión se registran en el caso vigente; requieren implementación y comprobación en #39/#40.                                                                 |

También quedan abiertos orden temporal de actividad/cambio coincidentes, reconstrucción de
historia incierta con revisión docente y protocolo de evaluación (participantes, escenarios y
repeticiones). No inventar fechas, línea base histórica, metas numéricas ni eficacia comprobada.
La [arquitectura](../../02-diseno/arquitectura-tecnica.md) y el
[modelo de datos](../../02-diseno/modelo-datos.md) separan implementación y objetivo.

## Inventario inicial de requisitos funcionales

**Lectura histórica:** los estados siguientes corresponden a la especificación anterior, no a la
aceptación vigente. Se preservan FR-004, FR-032 y NFR-010 verificados y sus límites. En particular,
FR-032 verifica la antigua denegación de lectura, que contradice el objetivo actual: no es una
prueba de aceptación de acceso histórico autorizado. No se reejecutó ni reinterpretó.

| Requisito | Estado inicial     | Evidencia o brecha observada                                                                                 |
| --------- | ------------------ | ------------------------------------------------------------------------------------------------------------ |
| FR-001    | present-unverified | Google está configurado en `portfolio-coursse/supabase/config.toml`; falta ejecutar el flujo aislado.        |
| FR-002    | present-unverified | `lib/academic/authorize-current-user.ts` separa rol/autorización; falta batería integral.                    |
| FR-003    | present-unverified | Acciones de periodos y cursos existen; falta verificación completa.                                          |
| FR-004    | verified           | `group_grades_rls.sql` verificó localmente aislamiento docente para notas; otros recursos siguen pendientes. |
| FR-005    | present-unverified | Existen comprobaciones de servidor y políticas RLS; cobertura transversal pendiente.                         |
| FR-006    | present-unverified | Existe importación CSV/XLSX y RPC; vista previa por fila pendiente de confirmar.                             |
| FR-007    | missing            | La acción actual devuelve totales, no estados y razones por fila completos.                                  |
| FR-008    | present-unverified | RPC/importación usa conflictos documentados; falta prueba de repetición equivalente.                         |
| FR-009    | present-unverified | `sync_authorized_student` vincula por correo normalizado; falta caso negativo integral.                      |
| FR-010    | present-unverified | Matrícula y estado existen; falta verificación cruzada completa.                                             |
| FR-011    | present-unverified | Gestión/sincronización de grupos existe; falta aceptación aislada.                                           |
| FR-012    | present-unverified | `select_course_group` y ventana existen; faltan concurrencia y repetición.                                   |
| FR-013    | missing            | No se encontró traslado docente histórico con instante efectivo.                                             |
| FR-014    | missing            | No existe historial de intervalos de pertenencia.                                                            |
| FR-015    | missing            | El grupo actual no preserva por sí solo la historia.                                                         |
| FR-016    | missing            | No existe resolución por instante de actividad.                                                              |
| FR-017    | missing            | Evaluaciones actuales no tienen instante académico.                                                          |
| FR-018    | present-unverified | Evaluaciones y rango 0–20 existen; falta fecha/hora de actividad.                                            |
| FR-019    | missing            | No existe revisión de impacto al cambiar fecha de actividad.                                                 |
| FR-020    | present-unverified | `group_grades` tiene unicidad por grupo/evaluación; falta integridad completa.                               |
| FR-021    | present-unverified | Rango se valida en acción y restricción SQL; falta batería de límites.                                       |
| FR-022    | present-unverified | RLS 0029 valida mismo curso para escrituras autenticadas; falta restricción para otros caminos.              |
| FR-023    | present-unverified | Upsert evita fila duplicada, pero no identifica el intento ni su auditoría.                                  |
| FR-024    | missing            | No se distingue resultado incierto ni recuperación correlacionada.                                           |
| FR-025    | missing            | La nota se sobrescribe sin historial de corrección.                                                          |
| FR-026    | missing            | No hay población histórica por fecha de actividad.                                                           |
| FR-027    | out-of-scope       | La corrección individual está excluida explícitamente de Parte II.                                           |
| FR-028    | present-unverified | Puntos y notas usan entidades y vistas separadas.                                                            |
| FR-029    | present-unverified | Existe anulación no destructiva de puntos; falta reejecutar aceptación.                                      |
| FR-030    | present-unverified | Existen vistas docentes; faltan historia, correcciones y conciliación.                                       |
| FR-031    | present-unverified | Dashboard muestra cursos, grupo y puntos propios; falta prueba integral.                                     |
| FR-032    | verified           | La prueba RLS local documentada niega lectura de notas al alumno tras 0029.                                  |
| FR-033    | missing            | Los estados completos de operación/evaluación no están modelados.                                            |
| FR-034    | missing            | No existe contrato unificado de eventos relevantes.                                                          |
| FR-035    | missing            | Logs actuales no ofrecen correlación y categorías estructuradas completas.                                   |
| FR-036    | missing            | No existe auditoría académica de correcciones.                                                               |
| FR-037    | missing            | No existe conciliación explícita de grupos esperados y calificados.                                          |
| FR-038    | missing            | No existía registro versionado de evidencia antes de este documento.                                         |
| FR-039    | present-unverified | La documentación distingue propuestas y verificaciones; debe mantenerse al ejecutar.                         |

## Inventario inicial no funcional

| Requisito                 | Estado inicial     | Observación                                                                         |
| ------------------------- | ------------------ | ----------------------------------------------------------------------------------- |
| NFR-001 Seguridad         | present-unverified | RLS y servidor existen parcialmente; falta cobertura transversal.                   |
| NFR-002 Privacidad        | present-unverified | La política documental existe; fixtures/evidencia sintética deben comprobarse.      |
| NFR-003 Integridad        | missing            | Historia, corrección y reintento requieren operaciones atómicas nuevas.             |
| NFR-004 Accesibilidad     | present-unverified | No existe auditoría ejecutada de todos los flujos Must.                             |
| NFR-005 Rendimiento       | missing            | No existen mediciones registradas.                                                  |
| NFR-006 Recuperación      | missing            | No existe protocolo probado de resultado incierto/reintento.                        |
| NFR-007 Observabilidad    | missing            | No existen señales verificadas para el proceso completo.                            |
| NFR-008 Mantenibilidad    | present-unverified | Hay separación por módulos; faltan pruebas y contratos completos.                   |
| NFR-009 Entorno seguro    | present-unverified | Supabase local está configurado; debe verificarse antes de cada prueba destructiva. |
| NFR-010 Arquitectura base | verified           | El repositorio usa Next.js, Supabase y PostgreSQL sin servicio adicional.           |

## Evidencia inicial disponible

| Fecha                       | Versión/PR              | Entorno           | Comprobación                                                     | Resultado                                                                                                                          |
| --------------------------- | ----------------------- | ----------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Revisión previa documentada | Migraciones 0001–0029   | Supabase local    | `supabase/tests/group_grades_rls.sql` con identidades sintéticas | Aprobó aislamiento docente, modificación autorizada, rechazo entre cursos y ausencia de lectura estudiantil; no prueba producción. |
| 2026-10-11                  | Árbol de trabajo actual | Revisión estática | Inventario de acciones, migraciones, pruebas y documentación     | Identificó capacidades candidatas y brechas; no convierte `present-unverified` en `verified`.                                      |

## Inspección estática de herramientas disponible en esta actualización

[package.json](../../../portfolio-coursse/package.json) contiene `lint`, `build`, `typecheck`,
`test` (Vitest), `test:e2e` (Playwright) y `test:db` (Supabase). Existen
[configuración Vitest](../../../portfolio-coursse/vitest.config.ts),
[configuración Playwright](../../../portfolio-coursse/playwright.config.ts), una prueba unitaria
de infraestructura y soporte/fixtures. No se encontraron escenarios E2E de aceptación; la prueba
SQL histórica sí existe. La presencia de archivos no demuestra cobertura funcional ni ejecución.

[CI](../../../.github/workflows/ci.yml) declara lint, generación de tipos, TypeScript y build;
no ejecuta esos tres scripts de pruebas. [Release](../../../.github/workflows/release.yml)
declara semantic-release, no despliegue ni aceptación, y no declara dependencia del job CI.
No se consultaron resultados de GitHub Actions ni se ejecutaron scripts, base local o servicios.
Se conserva la evidencia inicial disponible sin elevar estados por inspección estática.

## Resultados de implementación y pruebas

Registro de QA (R4). Solo se anotan como resultados las pruebas **ejecutadas**; lo preparado y no
ejecutado figura como pendiente. Datos sintéticos (`@example.test`), sin secretos ni producción.
Estos resultados no elevan por sí solos los estados del inventario anterior.

### Cómo reproducir

Requisitos: Docker y la base local de Supabase. Todos los comandos se ejecutan desde
`portfolio-coursse/`; el contenedor se llama `supabase_db_portfolio-course` (`project_id` de
`supabase/config.toml`).

```bash
# Solo base de datos y auth: el stack completo agotó la memoria de un equipo de 16 GB.
pnpm dlx supabase start -x studio,realtime,storage-api,imgproxy,edge-runtime,logflare,vector,postgres-meta,mailpit,supavisor,postgrest,kong
pnpm dlx supabase db reset            # solo local; nunca --linked ni db push
pnpm test:db                          # capacidades y aislamiento RLS: deben pasar
pnpm test:db:pending                  # requisitos pendientes: debe fallar hasta implementarlos
pnpm test:node                         # cálculo puro de EXP-02 (Node 24, node:test; Vitest no lo incluye)
```

Cada script SQL corre en una transacción que termina en `rollback`: no deja datos.
Ante un error, `ON_ERROR_STOP` hace que `psql -f` cierre la conexión y PostgreSQL revierta
la transacción. Estos scripts son comprobaciones de `psql`, no pgTAP: viven en
`supabase/qa/`, fuera del descubrimiento de `supabase test db`. `pnpm test:db`
ejecuta las comprobaciones psql de capacidades y RLS mediante Docker, sin requerir
la CLI en el PATH. `pnpm test:db:pending` ejecuta los requisitos pendientes por
separado. Actualmente no hay pruebas pgTAP: `supabase test db` informa `NOTESTS`.

### Conjunto sintético (BASE-02, #11)

[`supabase/qa/fixtures.sql`](../../../portfolio-coursse/supabase/qa/fixtures.sql), reutilizable
con `\ir` dentro de una transacción del llamador. Después de `BEGIN`, crear
`create temporary table qa_fixture_transaction () on commit drop;` antes de incluirlo.
La ejecución independiente falla antes de insertar datos. El llamador debe terminar
con `ROLLBACK` (o cerrar la conexión ante un error).

| Elemento  | Contenido                                                           |
| --------- | ------------------------------------------------------------------- |
| Docentes  | A (curso A, grupos A1/A2) y B (curso B, grupo B1)                   |
| S1        | autorizado en A; realizó T1 con A1 y después pasó a A2 (trasladado) |
| S2        | autorizado en A; siempre en A1                                      |
| S3        | autenticado, sin autorización                                       |
| S4        | autorizado solo en B                                                |
| Notas A   | A1/T1 = 15, A1/T2 pendiente (`null`), A2/T1 = 0 explícito           |
| Puntos S1 | +3 y −1 (el −1 se usa para anulación)                               |

### Pruebas de capacidades existentes (deben pasar)

[`current_capabilities.sql`](../../../portfolio-coursse/supabase/qa/current_capabilities.sql)

| Issue      | Escenario                                                                 | Esperado                                                |
| ---------- | ------------------------------------------------------------------------- | ------------------------------------------------------- |
| BASE-03    | Alumno sin autorización                                                   | Sin cursos, grupos, matrículas ni puntos                |
| BASE-03    | Sin sesión anula puntos                                                   | Rechazado                                               |
| BASE-03/04 | Docente B sobre curso A                                                   | No lee ni modifica curso ni padrón                      |
| EVA-02     | Docente B anula puntos de A                                               | `not_course_teacher`                                    |
| BASE-06    | Sincronizar dos veces                                                     | Una matrícula; conserva el grupo elegido                |
| EVA-01     | Notas 0/20, 20.01/−0.01, duplicado, curso ajeno                           | Acepta límites; rechaza el resto; pendiente ≠ 0         |
| EVA-02     | Anular dos veces                                                          | Conserva el movimiento, segunda vez sin cambio, saldo 3 |
| GRP-05     | Sin ventana, ventana vencida, grupo lleno, grupo ajeno, ventana reabierta | Rechaza los cuatro primeros; aplica el último           |

### Pruebas TDD de reglas pendientes (rojas hasta implementar)

[`pending_requirements.sql`](../../../portfolio-coursse/supabase/qa/pending_requirements.sql)
y [`adjusted-average.test.mjs`](../../../portfolio-coursse/lib/export/adjusted-average.test.mjs).
Un FAIL aquí es un requisito por implementar, no una regresión, pero produce un
error SQL y salida no cero; no debe contarse como ejecución exitosa.

#### Revisión de las pruebas (2026-10-28)

Cambios en código, pendientes de ejecución SQL: se comprueba 20 antes de escribir 0,
existencia de pendientes/matrículas/movimientos, conservación de los campos originales
al anular y cambio efectivo de capacidad más conservación de la nota exacta 12 al
resincronizar. Se trasladaron también los otros scripts/fixtures `psql` fuera de
`supabase/tests` para no mezclarlos con pgTAP.

Contraste BASE-01: siguen vigentes la ausencia de historia productiva (GRP-02 #19,
GRP-06 #23) y de consulta estudiantil (EVA-04 #27). `qa_participation` registra la
participación esperada **antes** del traslado, pero es solo un oráculo de prueba,
no historia de producción. Los adaptadores de historia y resultados quedan
explícitamente bloqueados hasta que sus responsables (@MathiMomos, R3) definan las
interfaces y la preparación de historia productiva; no se sustituye esa consulta por
lectura directa de `group_grades`. Deben adaptarse a la interfaz real, sea RPC u otra.
La comparación de resultados permitidos y prohibidos se informa como un único caso:
una política que deniega todo nunca acredita aislamiento correcto.

Validación comunicada por el usuario en Supabase local: `current_capabilities.sql`
aprobó 8 escenarios y `group_grades_rls.sql` 3, ambos con rollback;
`pending_requirements.sql` informó 3 FAIL/bloqueos y salió con código 3;
`fixtures.sql` directo fue rechazado antes de insertar (código 3).
`pnpm test:db` anterior falló por CLI ausente y `pnpm dlx supabase test db`
mostró `NOTESTS`. El nuevo runner superó `node --check`; en el sandbox del agente
Docker denegó acceso al socket, pero el usuario ejecutó `pnpm test:db` en su entorno:
ambos scripts aprobaron (8 y 3 escenarios), con rollback y código de salida 0.
`pnpm test:db:pending` como comando integrado no se ejecutó; su script SQL sí se
probó directamente con código 3 y los tres resultados fallidos/bloqueados indicados.
No se ejecutaron recorridos visuales.
Seguimiento actualizado solo en esta documentación local; GitHub no se modificó.
No se declara aceptación funcional de #19/#23/#27 ni usabilidad comprobada.

| Issue        | Escenario                                                 | Esperado                                                   |
| ------------ | --------------------------------------------------------- | ---------------------------------------------------------- |
| EVA-04 (#27) | S1 trasladado lee A1/T1                                   | Visible (participó)                                        |
| EVA-04       | S1 lee A2/T1                                              | No visible (llegó después)                                 |
| EVA-04       | S2 lee su nota y la pendiente                             | Visible; pendiente como `null`                             |
| EVA-04       | S4 (otro curso)                                           | No ve notas de A                                           |
| GRP-02 (#19) | Resincronizar grupos con un grupo calificado sin miembros | El grupo y su nota se conservan                            |
| EXP-02 (#39) | 10, 18 / saldo 15                                         | margen 12, aplicados 12, excedente 3, base 14, ajustado 20 |
| EXP-02       | 10, 10, 11 / saldo 1                                      | ajustado 10,67, sin redondeo intermedio                    |
| EXP-02       | Nota faltante / sin trabajos                              | ajustado pendiente (`null`), sin dividir entre cero        |
| EXP-02       | Cero explícito, margen agotado, saldo 0, pureza           | Ver archivo de prueba                                      |
| EXP-02       | Saldo negativo, movimientos anulados                      | `todo`: bloqueado por EXP-01 (#38)                         |

### Escenarios preparados sin prueba automatizable aún

No existe esquema para estos casos; no se inventan tablas para no condicionar el diseño del
responsable. Se automatizarán cuando exista la interfaz.

| Issue                | Escenario                                     | Esperado                                                                       |
| -------------------- | --------------------------------------------- | ------------------------------------------------------------------------------ |
| EVA-01 (#24)         | Corregir A1/T1 de 15 a 16                     | Queda valor anterior, nuevo, responsable y momento                             |
| EVA-07 (#30)         | Reenviar el mismo guardado                    | Mismo resultado, sin corrección duplicada                                      |
| GRP-03 (#20)         | Dos alumnos por el último cupo a la vez       | Solo uno entra (requiere dos sesiones)                                         |
| REC-01/02 (#31, #32) | S1 y S2 reclaman A1/T1                        | Un único reclamo; ambos lo ven; S4 no                                          |
| REC-01               | S1 reclama su movimiento −1 dos veces         | Un único reclamo, solo S1 y docente A                                          |
| REC-03 (#33)         | Pendiente → En revisión → Respondido; reabrir | Solo docente A; Respondido es final; nota y puntos sin cambio                  |
| REC-06 (#36)         | Falla el correo al docente                    | El reclamo persiste; aviso sin notas ni texto privado                          |
| EXP-03 (#40)         | XLSX del curso A tras el traslado de S1       | S1 conserva T1 de A1; pendientes vacíos; cero visible; S4/docente B sin acceso |
| EXP-04 (#41)         | Descargar dos veces                           | Mismos resultados; puntos y notas base intactos                                |

### Resultados ejecutados

Entorno: Windows 11, Docker Desktop, Supabase CLI vía `pnpm dlx`, Node 24.12.0, base local
reiniciada con `db reset`. Versión: rama `test/qa-r4-tdd-suite`, commit base `42a3fd7` más los
cambios de prueba registrados aquí.

| Fecha      | Versión   | Prueba                                                                                                                | Esperado                                  | Observado                                                                                                                                                           | Estado                                                                                                                 |
| ---------- | --------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 2026-10-21 | `42a3fd7` | `pnpm test`                                                                                                           | Rojo hasta EXP-02                         | Falla al importar `lib/export/adjusted-average.ts`, que no existe                                                                                                   | Rojo esperado (EXP-02 #39)                                                                                             |
| 2026-10-21 | `42a3fd7` | Casos de `adjusted-average.test.mjs` contra implementación de referencia desechable, fuera del repositorio            | Coherencia de casos                       | 8 aprobados, 2 `todo`                                                                                                                                               | Solo valida los casos; no acepta EXP-02                                                                                |
| 2026-10-21 | `42a3fd7` | Scripts SQL                                                                                                           | —                                         | Docker Desktop respondía `500 Internal Server Error`                                                                                                                | Fallo de infraestructura                                                                                               |
| 2026-10-24 | `42a3fd7` | `supabase db reset`                                                                                                   | Migraciones 0001–0029 aplican             | Aplican sin errores                                                                                                                                                 | PASS                                                                                                                   |
| 2026-10-24 | `42a3fd7` | `current_capabilities.sql` (primera ejecución)                                                                        | 8 PASS                                    | 7 PASS; GRP-05 «full group accepted a member»                                                                                                                       | Defecto **de la prueba**: el `update` de capacidad corría como `authenticated` y RLS lo descartaba (0 filas) sin error |
| 2026-10-24 | rama      | `current_capabilities.sql` corregido (capacidad preparada como propietario) y con caso de ventana vencida y reabierta | 8 PASS                                    | 8 PASS, rollback completo                                                                                                                                           | PASS                                                                                                                   |
| 2026-10-24 | `42a3fd7` | `group_grades_rls.sql`                                                                                                | Alumno sin lectura; docente solo su curso | 3 PASS, rollback completo                                                                                                                                           | PASS                                                                                                                   |
| 2026-10-24 | `42a3fd7` | `pending_requirements.sql` — EVA-04                                                                                   | Rojo hasta #27                            | 2 PASS (S1 no ve A2/T1; S4 no ve curso A), 3 FAIL (participante actual, trasladado y pendiente no visibles: `group_grades` solo es legible por docentes desde 0029) | Rojo esperado (EVA-04 #27)                                                                                             |
| 2026-10-24 | `42a3fd7` | `pending_requirements.sql` — GRP-02                                                                                   | Grupo calificado vacío se conserva        | FAIL: tras `synchronize_course_groups` la nota del grupo vacío desaparece                                                                                           | **Defecto confirmado**, devuelto a GRP-02 (#19)                                                                        |
| 2026-10-24 | `42a3fd7` | `pnpm test:node`                                                                                                      | Rojo hasta EXP-02                         | 1 fallo: módulo inexistente                                                                                                                                         | Rojo esperado (EXP-02 #39)                                                                                             |

Defecto confirmado para GRP-02 (#19): `synchronize_course_groups` (migración `0021`) elimina grupos
sin miembros activos y `group_grades.group_id` usa `on delete cascade`; un grupo calificado que queda
vacío tras los traslados pierde sus notas al resincronizar. La corrección corresponde al responsable
de #19; esta prueba debe pasar antes de cerrarla.

### Estado por issue de R4

| Issue         | Avance verificable                                                 | Bloqueo para cerrar                                                                  |
| ------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| BASE-02 (#11) | Datos sintéticos y comprobación inicial reproducibles en local     | Revisión de R3 (@MathiMomos)                                                         |
| GRP-05 (#22)  | Ventana sin configurar/vencida/reabierta, cupo y grupo ajeno: PASS | Historia por actividad (GRP-02 #19 con defecto, GRP-06 #23), GRP-04 #21; revisión R1 |
| EVA-06 (#29)  | Registro 0/20, pendiente ≠ 0 y corrección de puntos: PASS          | Consulta del alumno (EVA-04 #27, EVA-05 #28), EVA-03 #26, EVA-07 #30                 |
| REC-07 (#37)  | Escenarios preparados                                              | No existe esquema de reclamos (#31–#36)                                              |
| EXP-04 (#41)  | Casos de cálculo preparados                                        | EXP-02 #39, EXP-03 #40 y reglas de EXP-01 #38                                        |
| QA-04 (#45)   | Protocolo propuesto abajo                                          | QA-01–03 (#42–#44) y acuerdo del equipo                                              |
| DOC-04 (#50)  | Este registro                                                      | DOC-03 #49 y QA-05 #46                                                               |

### Protocolo propuesto para QA-04 (#45) — pendiente de acuerdo

Propuesta, no medición. A acordar antes de medir: participantes (al menos dos personas que no
desarrollaron el módulo), conjunto sintético (curso A de `fixtures.sql` ampliado a la cantidad de
grupos acordada), repeticiones (tres por procedimiento, alternando el orden manual/sistema) y
condiciones (mismo equipo y red local). Se cronometra solo el registro de notas y puntos ya
decididos, no la evaluación del contenido. Consulta, reclamos, correo y exportación se revisan contra
sus criterios sin línea base histórica. Se registran todos los resultados, aunque no haya mejora.

## Comparación con línea base manual

Pendiente. No hay métricas ni resultados todavía.

## Limitaciones actuales

- Producción no fue inspeccionada ni modificada.
- No se ha verificado un proveedor de monitoreo, alertas, respaldos o restauración.
- No se usan datos personales reales ni secretos como evidencia.
- El inventario inicial es una decisión de alcance y no sustituye pruebas de comportamiento.

## EVA-01 #24 · Registro y corrección de notas grupales

Validación del 20 de noviembre de 2026 en la rama `feature/eva-01-notas-grupales`, desde `develop` en `f8961ec`, con Supabase local aislado y migración `0046`. Se contrastaron la ficha EVA-01, BASE-01, el caso vigente y las migraciones `0028`, `0029`, `0039`, `0044` y `0045`.

| Escenario y esperado | Resultado observado |
| --- | --- |
| Instalación limpia y actualización desde `0045` | Las migraciones y la semilla terminaron correctamente. La actualización preservó las notas sintéticas 0 y 15 y una nota pendiente, con revisión 0 y sin atribuciones inferidas. |
| Límites, permisos, trazabilidad y pertenencia | Pasó la suite SQL regular. Rechazó valores fuera del rango o precisión, escritura directa y guardado sin permisos. El valor 0 se confirmó, la corrección a 20 conservó comentario, autor, motivo y hora, y la repetición no añadió un evento. Se bloquearon una nota antigua sin destinatarios verificables, el borrado de su evaluación y el guardado con pertenencia desconocida. |
| Cambio A1 → A2 y carreras de guardado | Las dos sesiones observaron el bloqueo de evaluación. Se rechazó un cambio de fecha que reasignaba destinatarios y se permitió otro que los conservaba. Una corrección concurrente con revisión obsoleta fue rechazada. |
| Recorrido docente en Chromium local | Se navegó a Notas con un curso y una sesión sintéticos. T1 mostraba la nota antigua bloqueada. En T2 se registró 0, se recargó, se canceló una corrección, se confirmó otra a 20 y se verificó que vaciar o ingresar 12.345 conservaba 20. La consulta posterior encontró un evento 0 → 20 y dos destinatarios originales. |
| Comprobaciones de aplicación | Pasaron ESLint, tipos de Next.js y TypeScript, las 20 pruebas unitarias y `git diff --check`. |

Se conservaron unicidad, rango y aislamiento por curso. Quedan cubiertos los antecedentes del guardado que sobrescribía nota y comentario sin auditoría y del borrado que podía arrastrar una nota confirmada. Las notas antiguas sin destinatarios comprobables se conservan con su valor y quedan bloqueadas para edición. Las pertenencias desconocidas del padrón bloquean la primera confirmación cuando GRP-06 carece de evidencia para descartarlas.

La suite separada `test:db --pending` sigue fallando por el adaptador de consulta de EVA-04 #27 y por una referencia de prueba al adaptador antiguo de GRP-06 #23. Las pruebas vigentes de GRP-06 pasaron con la RPC actual. La matriz docente ampliada sigue en #26, la recuperación de guardados en #30 y el XLSX histórico en #40. La prueba en Chromium acredita el recorrido funcional con sesión sintética. Quedan pendientes la evaluación formal de usabilidad y la revisión independiente.

**Revisión de Sourcery en el PR #65.** Tras aplicar la versión revisada de `0046` desde una instalación limpia, la suite SQL regular aprobó la comprobación de `TRUNCATE` para el rol autenticado y la lectura de destinatarios históricos limitada al docente del curso. Se probó además la actualización desde `0045` con el curso sintético. En Chromium se interrumpió un guardado y se conservó el borrador. Al corregir el valor inválido desapareció el aviso. Dos pestañas reprodujeron una revisión obsoleta y la actualización mostró la nota confirmada más reciente sin perder el borrador. La tabla mostró a ambos destinatarios originales aunque uno ya pertenecía a otro grupo. Pasaron lint, tipos y las 20 pruebas unitarias.

La transición entre versiones requiere coordinar la activación de la aplicación con la migración y pausar los guardados de Notas durante el cambio. El procedimiento está documentado en el [quickstart de EVA-01](../../../specs/005-notas-grupales/quickstart.md#despliegue-coordinado-de-0046). Se comprobó en Supabase aislado. La ventana de despliegue real queda pendiente.

## EVA-03 #26 · Matriz docente de notas y pendientes

**Fecha** 2026-11-20 · **Base** `develop` `c23ba0f` · **Rama** `feature/EVA-03-matriz-notas-docente` · **Migración nueva** ninguna (`Opción A`, reutiliza las RPC de `0044`–`0046`) · **Entorno** Supabase local aislado en Docker (`0001`–`0047`), Node 22.18.0, Next.js 16.3.0 (`pnpm build` + `pnpm start`) y Chrome headless (`1280×800` y `375×812`) con datos sintéticos `@example.test`.

### Recorrido y representación docente actualizada

```text
/teacher ──▶ Notas (/teacher/grades?period=...&course=...)
  ├── Carga con loading.tsx (ModuleLoading) y alerta role="alert" + enlace de recarga si falla list_group_grades_with_participants
  ├── Gestionar Evaluaciones (EvaluationManagerDialog accesible: role="dialog", Esc, fechas America/Lima)
  │     └── Alta/eliminación sin notas + set_activity_performed_at + ActivityDateCorrection (conservado)
  ├── Barra de resumen y filtros (GroupGradesTable)
  │     ├── Progreso en vivo (X calificados · Y pendientes, sin fecha y bloqueadas) + regla visible vacío ≠ 0
  │     ├── Filtro rápido por evaluación (Todas / T1 / T2 / ...) y descarga local XLSX (pendientes como "")
  │     └── Región global role="status" anunciando confirmación solo tras respuesta exitosa del servidor
  └── Matriz Grupos × Evaluaciones (inputs neutros sin semáforos, badges textuales de estado)
        ├── Columna de grupo: integrantes únicamente active; separados de destinatarios históricos
        ├── Encabezado de evaluación: fecha America/Lima o badge «Sin fecha de realización» + alerta de padrón unknown
        ├── Estados textuales: Pendiente | Calificada (incluye 0) | Corregida · rev. N | Bloqueada · sin verificar | Sin fecha | Padrón por verificar
        ├── Destinatarios: «Destinatarios previstos (N)» antes de guardar → «Destinatarios históricos (N)» tras confirmar (router.refresh)
        └── Guardado seguro (inFlightRef + Enter/Esc/blur) y diálogo de corrección con motivo obligatorio abierto hasta confirmar o recuperar error
```

### Comprobaciones ejecutadas

| Comprobación | Esperado | Observado |
| --- | --- | --- |
| Pruebas unitarias (`grade-matrix.test.ts`) | Validación `0–20` (máx. 2 decimales, `0` vs vacío), formato `America/Lima`, resolución de destinatarios históricos y alerta `unknown`, clasificación textual de estados, resumen de progreso y formato Excel `""` en pendientes. | 5/5 bloques de prueba aprobados en Vitest (`8` archivos / `31` pruebas totales). |
| `E1–E4` y `E13` en navegador local (`1280×800`) | Curso, periodo y fechas `America/Lima` visibles sin abrir modal; `T3` sin fecha y `T4` con historial `unknown` advertidos; integrantes actuales excluyen `inactive` y trasladados; destinatarios previstos antes de guardar y destinatarios históricos (`2`) inmediatos tras guardar `15.75` sin F5 manual. | Aprobado con datos sintéticos `@example.test`. |
| `E5–E8` y `E12` (cero, decimales, corrección, bloqueo) | `0` explícito queda `Calificada` distinto de `Pendiente`; `20.01` y `12.345` conservan borrador con `role="alert"`, «Reintentar» y «Descartar»; corrección exige motivo no vacío y pasa a `Corregida · rev. 2`; vaciar nota o cancelar restaura valor vigente; nota legacy `rev=0` queda `readOnly` con `Bloqueada · sin verificar`. | Aprobado en Chrome local. |
| `E9–E11` (doble envío, conflicto y fallo de red) | `Enter` seguido de `blur` dispara exactamente `1` petición `POST`; conflicto concurrente entre dos pestañas mantiene abierto el diálogo con alerta, conserva el motivo y actualiza nota vigente (`16` → `17`); fallo de red simulado en celda y en diálogo conserva nota y motivo con «Reintentar» y nunca anuncia éxito falso. | Aprobado interceptando acciones `POST` y usando dos pestañas concurrentes. |
| `E14–E16` (filtros, XLSX, teclado y móvil `375px`) | Filtro `Todas / T2` y resumen se actualizan tras guardar; `.xlsx` exporta solo confirmadas dejando pendientes como `""` y omitiendo borradores sin guardar; `Esc` descarta borrador y cierra `EvaluationManagerDialog` (`role="dialog"`, `aria-modal="true"`); vista `375×812` sin desbordamiento horizontal del documento. | Aprobado; sin errores de consola ni regresiones visuales en las capturas revisadas. |
| Comprobaciones de aplicación | Lint, generación de tipos, TypeScript y build de producción sin errores. | `pnpm lint`, `pnpm typecheck` (`tsc --noEmit`) y `pnpm build` aprobados después del último cambio. |

**Dimensiones verificadas y pendientes:** se verificaron **implementación en código**, **descubrimiento** (entrada desde `/teacher` → *Notas*), **funcionamiento visible** (`E1–E16` sobre `next start` + Supabase Docker local) y **usabilidad básica / accesibilidad** (roles `dialog`, `alert`, `status`, `scope`, foco visible, teclado `Enter`/`Esc` y móvil `375×812`). Quedan fuera de alcance la consulta del alumno (`EVA-04 #27` y `EVA-05 #28`), el recorrido integral M2 (`EVA-06 #29`), la recuperación multi-módulo o entre sesiones (`EVA-07 #30`), la exportación individual ajustada (`EXP-03 #40`), la auditoría formal completa de usabilidad/accesibilidad (`QA-01 #42`) y la revisión independiente en PR por `@fabrizio25504` (R4).
## EVA-04 #27 · Consulta estudiantil de resultados

Validación del 20 de noviembre de 2026 en `feature/eva-04-consulta-resultados`, desde `develop` en `c23ba0f`, con datos sintéticos y Supabase local aislado. Se contrastaron la ficha EVA-04, BASE-01, el caso vigente y las reglas de las migraciones `0029`, `0030`, `0039` y `0046`. La migración `0048` usa la matrícula autorizada, el historial para pendientes y los destinatarios conservados para notas confirmadas.

| Escenario esperado | Resultado observado |
| --- | --- |
| El traslado conserva el grupo original y el nuevo integrante carece de la nota anterior | El alumno trasladado recibió T1 del grupo A1 con valor 0, y T2 de A2 como pendiente. El alumno que ingresó después careció de T1. |
| Pendiente distinto de cero y evidencia incompleta omitida | Tanto la fila existente con valor pendiente como el pendiente sin fila se devolvieron con `null`. Se omitieron las actividades sin fecha o historial y las notas antiguas con destinatarios sin verificar. |
| Corrección disponible de inmediato y acceso docente preservado | El docente responsable corrigió la nota a 17,25. El alumno histórico consultó el nuevo valor en la siguiente lectura y mantuvo el grupo original. |
| Sesión y alcance académico válidos | Un alumno de otro curso, un docente con matrícula vinculada y una sesión ausente o sin OAuth verificado quedaron sin resultados. La revocación retiró el acceso a notas y puntos con la sesión previa. El rol anónimo careció de permiso sobre la RPC. |
| Titularidad de puntos y acceso a tablas | Se conservaron las lecturas de puntos propios y se excluyeron movimientos ajenos. El anulado se conserva bajo la política existente y queda fuera del saldo. Las tablas de historial y auditoría siguieron privadas, y la tabla de notas siguió sin devolver filas a alumnos. |
| Instalación y acceso HTTP | Pasaron la instalación limpia, la actualización desde `0046` pasando por `0047`, la suite SQL regular y una prueba HTTP de PostgREST para la consulta propia, curso ajeno, sesión anónima, tabla de notas y puntos propios. Pasaron también lint, tipos y las 26 pruebas unitarias. |

La denegación general descrita en BASE-01 se conserva como evidencia histórica de la tabla directa. La consulta estudiantil entra por `list_student_group_grades`, sin recuperar la política por grupo actual. Los puntos mantienen la titularidad de `0030`. La integración visual del panel queda en EVA-05 #28 y la aceptación de EVA-04 queda pendiente de revisión independiente.

La suite separada `test:db --pending` confirmó el caso de preservación de GRP-02 y continúa fallando por el adaptador provisional de GRP-06 #23. La prueba de GRP-06 que usa la migración vigente pasó en la suite regular. EVA-04 quedó en esa suite con el contrato real.

## Avance local de issues desbloqueadas (`GRP-03 #20`, `EVA-05 #28`, `EXP-02 #39`, `REC-01 #31`)

**Fecha:** 2026-11-22 · **Base:** `origin/develop` (`54e3356`) · **Entorno:** Windows 11, Node 24.12.0, pnpm 11.20.0. Docker Desktop no estuvo activo en este entorno, por lo que las migraciones SQL nuevas (`0049` y `0050`) y las pruebas SQL (`grp_03_group_selection.sql` y `rec_01_claims_model.sql`) quedan preparadas y pendientes de ejecución en Supabase local.

| Issue | Alcance implementado | Comprobaciones ejecutadas | Pendiente para cierre |
| --- | --- | --- | --- |
| `EXP-02 #39` | Módulo puro [`adjusted-average.ts`](../../../portfolio-coursse/lib/export/adjusted-average.ts) (`calculateAdjustedAverage`, `calculateActivePointsBalance`), pruebas en [`adjusted-average.test.mjs`](../../../portfolio-coursse/lib/export/adjusted-average.test.mjs) y [`adjusted-average.test.ts`](../../../portfolio-coursse/tests/unit/adjusted-average.test.ts). | `pnpm test:node` (`14/14` PASS), `pnpm test` (`13/13` PASS de EXP-02; `45/45` en 9 archivos), `pnpm lint`, `pnpm typecheck`, `pnpm build` (con variables placeholder de CI). | Revisión independiente R4 (`@fabrizio25504`) en PR. |
| `EVA-05 #28` | [`get-dashboard.ts`](../../../portfolio-coursse/lib/student/get-dashboard.ts) consulta `list_student_group_grades` por matrícula activa y expone `grades`/`gradesError`; [`student-course-card.tsx`](../../../portfolio-coursse/components/student-portal/student-course-card.tsx) y [`student-dashboard.tsx`](../../../portfolio-coursse/components/student-portal/student-dashboard.tsx) separan *Notas grupales* históricas de *Puntos* (`0` vs `Pendiente`, fecha `America/Lima`, etiqueta de grupo histórico). | `pnpm test` (`get-student-dashboard.test.ts` `5/5` PASS), `pnpm lint`, `pnpm typecheck`, `pnpm build` (con variables placeholder de CI). | Recorrido visual en navegador con sesión sintética y revisión independiente R4. |
| `GRP-03 #20` | Migración [`0049_grp03_group_selection_concurrency_and_history.sql`](../../../portfolio-coursse/supabase/migrations/0049_grp03_group_selection_concurrency_and_history.sql) (bloqueo de bypass directo en `course_students.group_id`, orden `courses for share` → `pg_advisory_xact_lock` antes de leer capacidad en `select_course_group`, idempotencia y control de cupo en preasignaciones iniciales de `sync_authorized_student`), validación positiva en [`app/student/actions.ts`](../../../portfolio-coursse/app/student/actions.ts) y script [`grp_03_group_selection.sql`](../../../portfolio-coursse/supabase/qa/grp_03_group_selection.sql) registrado en [`test-db.mjs`](../../../portfolio-coursse/scripts/test-db.mjs). | `pnpm lint`, `pnpm typecheck`, `pnpm build`. | Ejecutar `supabase db reset --local` y `pnpm test:db` (Docker requerido), prueba concurrente de dos sesiones por el último cupo y revisión independiente R3. |
| `REC-01 #31` | Migración [`0050_claims_model_and_rls.sql`](../../../portfolio-coursse/supabase/migrations/0050_claims_model_and_rls.sql) (`public.claims`, FKs compuestas por curso/titular, índices únicos parciales permanentes, participación histórica `is_historical_group_participant`, políticas RLS y trigger `guard_claim_mutation`) y script [`rec_01_claims_model.sql`](../../../portfolio-coursse/supabase/qa/rec_01_claims_model.sql) registrado en [`test-db.mjs`](../../../portfolio-coursse/scripts/test-db.mjs). | Inspección estática y actualización documental en [`modelo-datos.md`](../../02-diseno/modelo-datos.md). | Ejecutar `supabase db reset --local` y `pnpm test:db` (Docker requerido) y revisión independiente R4. |

## GRP-04 #21 · Selección de grupo del alumno

**Fecha** 2026-11-24 · **Base** `develop` `86268ec` · **Rama** `feature/GRP-04-seleccion-grupo-alumno` · **Migración nueva** ninguna (`D1 Opción A`, reutiliza `available_course_group_details` `0031`, `configure_course_group_selection` `0047` y `select_course_group` / `sync_authorized_student` `0049`) · **Entorno** Supabase local aislado en Docker (`0001`–`0050`), Node 22.18.0, Next.js 16.3.0 (`pnpm build` + `pnpm start`) y Chrome headless (`1280×800` y `375×812`) con datos sintéticos `@example.test`.

### Recorrido estudiantil actualizado

```text
/student (StudentPage → getStudentDashboard con sync_authorized_student 0049)
  └── Tarjeta de curso (StudentCourseCard)
        ├── Bloque «Grupo actual» con badge textual («Confirmado» | «Sin asignar»)
        └── Selección de grupo (GroupSelection [Server] → GroupSelectionList [Client])
              ├── Estado de ventana en America/Lima con badge textual: Sin configurar | Programada | Abierta | Cerrada
              ├── Si falla available_course_group_details: alerta role="alert" con botón «Reintentar» (nunca disfraza lista vacía)
              ├── Listado de grupos del curso: cupos disponibles / Sin cupo / Tu grupo actual (aria-current="true") e integrantes solo en ventana abierta
              ├── Botón por grupo (aria-label con grupo y curso): «Elegir grupo» / «Cambiar a este grupo» / «Seleccionado» / «Lleno» / «Aún no abre» / «Ventana cerrada»
              └── Envío con inFlightRef + «Guardando…» ──▶ selectStudentGroupAction ──▶ RPC select_course_group (0049) ──▶ confirmación role="status" o alerta role="alert" en la tarjeta + router.refresh()
```

## EXP-03 #40 · Descarga XLSX por curso con atribución histórica

**Fecha:** 2026-11-23 · **Base:** `develop` (`86268ec`) · **Rama:** `feature/r5-reclamos-exportacion` · **Migración nueva:** [`0051_course_export_historical_data.sql`](../../../portfolio-coursse/supabase/migrations/0051_course_export_historical_data.sql) · **Entorno:** Windows 11, Node 22.14.0, pnpm 11.20.0. Docker no estuvo disponible en este entorno; no se ejecutó contra Supabase local ni producción.

### Contrato y recorrido implementados

- **RPC de solo lectura (`0051`):** `public.list_course_export_grade_attributions(target_course_id)` (`STABLE SECURITY DEFINER`) valida `is_teacher_of_course` y devuelve únicamente notas confirmadas (`revision > 0`) desde `academic_access.group_grade_participants`, sin consultar `course_students.group_id` ni exponer filas legacy `revision = 0`.
- **Generación XLSX pura:** [`course-export.ts`](../../../portfolio-coursse/lib/export/course-export.ts) reutiliza `xlsx` y [`adjusted-average.ts`](../../../portfolio-coursse/lib/export/adjusted-average.ts) para emitir la hoja `Resultados Curso` con columnas `Nombre`, `Correo`, evaluaciones ordenadas por `(position, id)`, `Promedio base` (precisión completa con formato `0.00`), `Saldo` (entero siempre visible), `Puntos aplicados`, `Excedente` y `Promedio ajustado` (redondeo half-up a 2 decimales con formato `0.00`).
- **Endpoint y UI:** [`GET /api/teacher/courses/[coursePublicId]/export`](../../../portfolio-coursse/app/api/teacher/courses/[coursePublicId]/export/route.ts) valida UUID, sesión, identidad académica verificada, rol `teacher` y propiedad del curso, ejecutando solo lecturas (sin invocar `ensure_default_evaluations`). [`CourseExportButton`](../../../portfolio-coursse/components/teacher/grades/course-export-button.tsx) se integró en `/teacher/grades` y `/teacher/courses/[coursePublicId]` con estados de carga, error (`role="alert"`) y confirmación (`role="status"`).

### Comprobaciones sintéticas ejecutadas

| Comprobación | Esperado | Observado |
| --- | --- | --- |
| Atribución histórica, traslado, cero vs pendiente y legacy (`course-export.test.ts`) | Alumna trasladada conserva T1 de grupo A (`10`) y T2 de grupo B (`18`) con saldo `15` → aplicados `12`, excedente `3`, promedio base `14`, ajustado `20.00`; alumno con `0` explícito y `1` con saldo `-3` → aplicados `-1`, excedente `-2`, ajustado `0.00`; nota legacy `revision = 0` queda como celda vacía (`undefined` en SheetJS) manteniendo saldo `3`; inactivo con historia se conserva (`13.505 → 13.51`) e inactivo sin historia se excluye. | Aprobado en Vitest (`10/10` pruebas de `course-export.test.ts`, inspeccionando celdas y formatos `0.00`/`0` tras `XLSX.read` del buffer generado). |
| Sin trabajos y precisión intermedia (`course-export.test.ts`) | Con `0` evaluaciones, `Saldo` (`4`) permanece visible y promedios/aplicados/excedente quedan vacíos; con `[10, 10, 11]` y saldo `+1`, `Promedio base` conserva `31/3` y `Promedio ajustado` redondea a `10.67`. | Aprobado en Vitest. |
| Repetición sin mutaciones y control de acceso en servidor (`course-export.test.ts`) | Dos renders consecutivos producen la misma matriz XLSX sin mutar entradas; `loadCourseExportForTeacher` devuelve `400` (UUID inválido), `403` (sin identidad verificada o rol `student`), `404` (curso ajeno/inexistente), `500` (fallo de lectura) y `200` invocando únicamente `has_academic_identity` y `list_course_export_grade_attributions`. | Aprobado en Vitest (`55/55` pruebas en 10 archivos). |
| Regresión de cálculo puro (`adjusted-average.test.mjs`) | Mantener los 14 casos de `EXP-02`. | `node --experimental-strip-types --test lib/export/adjusted-average.test.mjs`: `14/14` PASS. |
| Calidad y build de aplicación | Sin errores de ESLint, tipos ni build de Next.js. | `pnpm lint`, `pnpm typecheck` (`next typegen && tsc --noEmit`) y `pnpm build` (con variables placeholder de CI) aprobados; ruta dinámica `/api/teacher/courses/[coursePublicId]/export` compilada. |

**Dimensiones verificadas y pendientes:** se verificaron **implementación en código**, **navegación identificada en código** (`/teacher/grades` y `/teacher/courses/[coursePublicId]`) y **pruebas unitarias/binarias XLSX y de autorización en servidor**. Quedan pendientes: ejecutar `supabase db reset --local` y `pnpm test:db` para validar `0051` y [`exp_03_course_export.sql`](../../../portfolio-coursse/supabase/qa/exp_03_course_export.sql) en PostgreSQL/Supabase local (Docker no estuvo disponible), comprobar el recorrido visual y la descarga en navegador en vivo, la revisión independiente de R2 (`@RobertoPizarro`) en PR y la matriz QA de `EXP-04 #41`. Este seguimiento se actualizó solo en archivos locales, no en GitHub.

## REC-02 #32 · Presentación de ambos tipos de reclamo

**Fecha:** 2026-11-23 · **Base:** `feature/r5-reclamos-exportacion` (`7091fd8`) · **Migración nueva:** [`0052_submit_claims_rpc.sql`](../../../portfolio-coursse/supabase/migrations/0052_submit_claims_rpc.sql) · **Entorno:** Windows 11, Node 22.14.0, pnpm 11.20.0. Docker no estuvo disponible; no se ejecutó contra Supabase local ni producción.

### Operaciones implementadas

- **RPCs transaccionales (`0052`):** `public.submit_group_grade_claim(target_group_public_id, target_evaluation_public_id, claim_reason)` y `public.submit_point_transaction_claim(target_point_transaction_id, claim_reason)` resuelven curso, matrícula y permisos directamente desde `auth.uid()` y `REC-01` (`is_historical_group_participant` / `can_read_enrollment`), crean el registro en estado `pending`, devuelven `created = false` en reintentos equivalentes del mismo autor y rechazan con `claim_already_exists` (`23505`) cualquier segundo reclamo distinto o de otro participante. `public.list_student_claims` expone los reclamos visibles con identificadores públicos y nombre del autor.
- **Capa de aplicación:** [`lib/claims/validation.ts`](../../../portfolio-coursse/lib/claims/validation.ts), [`lib/claims/submit-claim.ts`](../../../portfolio-coursse/lib/claims/submit-claim.ts) y Server Actions en [`app/student/claims/actions.ts`](../../../portfolio-coursse/app/student/claims/actions.ts), sin acoplar la persistencia al aviso por correo (`REC-06 #36`).

### Comprobaciones ejecutadas

| Comprobación | Esperado | Observado |
| --- | --- | --- |
| Pruebas unitarias (`student-group-selection.test.ts`) | Clasificación de ventana `[opens, closes)` en `America/Lima` (`Sin configurar`, `Programada`, `Abierta`, `Cerrada`), cupos disponibles / `Sin cupo` / `Tu grupo actual`, distinción *Elegir grupo* vs. *Cambiar a este grupo*, mapeo de los 5 códigos RPC y limpieza de campos inesperados (`email`) en `normalizeGroupOptions`. | 4/4 bloques aprobados en Vitest (`10` archivos / `49` pruebas totales). |
| `S1–S4` en navegador local (`1280×800`) | Cursos con ventana `Sin configurar`, `Programada`, `Cerrada` y `Abierta` muestran badges textuales, horario `(Lima)`, botones bloqueados fuera de ventana, ocultamiento de integrantes fuera de ventana y confirmación en la tarjeta tras elegir `Grupo 1` (`Confirmado`, `Seleccionado` deshabilitado). | Aprobado con datos sintéticos `@example.test`. |
| `S5–S6` (cambio de grupo, F5 y notas históricas) | Tras registrar nota `16` en `T1` para `Grupo 1`, cambiar a `Grupo 2` y recargar (`F5`), `Grupo 2` persiste (`aria-current="true"`) y *Notas grupales* conserva `T1 = 16` atribuida a `Grupo 1` con etiqueta `Grupo histórico (actual: Grupo 2)`. | Aprobado en Chrome local. |
| `S7–S8` y `S11–S12` (rechazos reales, fallo de red y doble clic) | Grupo lleno deshabilita botón (`Lleno`); ocupación concurrente del último cupo (`group_full`), cierre de ventana entre carga y clic (`group_selection_closed`) y fallo de red abortado muestran `role="alert"`, mantienen intacto el grupo actual y refrescan cupos/estado reales; doble clic rápido dispara exactamente `1` petición `POST`. | Aprobado en Chrome local. |
| `S9–S10` y `S13` (reapertura global, aislamiento y payload RPC `0031`) | Reapertura global del docente sobre *Curso Cerrado* habilita la selección en `/student` tras recargar sin afectar otro curso (`Programado`); grupos de cursos ajenos no aparecen y su envío directo lanza `group_not_available`; `available_course_group_details` (`0031`) omite `email` en ventana abierta y retorna `members = []` fuera de ventana. | Aprobado mediante UI docente + estudiantil y consulta autenticada directa en PostgreSQL. |
| `S14` (teclado, accesibilidad y móvil `375×812`) | `aria-labelledby` enlazado a `<h3>`, `aria-current="true"`, `aria-label` con grupo y curso, cambio de grupo con `Tab` + `Enter`, foco visible y móvil `375px` sin desbordamiento horizontal. | Aprobado; capturas de escritorio, reapertura y móvil verificadas visualmente. |
| Comprobaciones de aplicación | Lint, generación de tipos, TypeScript y build de producción sin errores. | `pnpm lint`, `pnpm typecheck` (`next typegen && tsc --noEmit`) y `pnpm build` aprobados después del último cambio de código/pruebas. |

**Dimensiones verificadas y pendientes:** se verificaron **implementación en código**, **descubrimiento** (acceso directo en tarjetas de `/student`), **funcionamiento visible** (`S1–S14` sobre `next start` + Supabase Docker local con `0001`–`0050`) y **usabilidad básica / accesibilidad** (`h3` + `aria-labelledby`, `aria-current="true"`, `role="alert"`, `role="status"`, teclado y móvil `375×812`). Siguen pendientes la comprobación integral M1 en `GRP-05 #22` (incluida concurrencia entre dos sesiones simultáneas por el último cupo), la revisión transversal `QA-01 #42` y la revisión independiente en PR por `@fabrizio25504` (R4).
| Validación y mapeo de errores (`claims-submission.test.ts`) | Validar UUIDs, ID positivo de movimiento y motivo (`1..2000` caracteres); mapear conflictos (`23505`), permisos (`42501`), curso inactivo y objetivo ausente a mensajes claros en español. | Aprobado en Vitest (`3/3` pruebas). |
| Presentación grupal, individual, reintento idempotente y consulta (`claims-submission.test.ts`) | Creación en `pending` (`created: true`), reintento equivalente del mismo autor devuelve `created: false` con el mismo `claimPublicId`, duplicado de otro participante devuelve `conflict`, acceso ajeno devuelve `forbidden` y `listStudentClaims` normaliza filas históricas. | Aprobado en Vitest (`4/4` pruebas; `62/62` en 11 archivos). |
| Calidad y build de aplicación | Sin errores de lint, tipos ni compilación de producción. | `pnpm lint`, `pnpm typecheck` y `pnpm build` (con variables placeholder de CI) aprobados. |

**Pendientes:** ejecutar `0050` + `0052` y las suites SQL [`rec_01_claims_model.sql`](../../../portfolio-coursse/supabase/qa/rec_01_claims_model.sql) y [`rec_02_claim_submission.sql`](../../../portfolio-coursse/supabase/qa/rec_02_claim_submission.sql) en Supabase local con Docker, integrar el formulario en la vista del alumno (`REC-04 #34`), conectar el aviso docente (`REC-06 #36`), ejecutar QA integral (`REC-07 #37`) y completar la revisión independiente de R3 (`@MathiMomos`) en PR. Este seguimiento se actualizó solo en archivos locales, no en GitHub.

## REC-03 #33 · Transiciones y respuesta final docente

**Fecha:** 2026-11-23 · **Base:** `feature/r5-reclamos-exportacion` · **Migración nueva:** [`0053_claim_teacher_transitions.sql`](../../../portfolio-coursse/supabase/migrations/0053_claim_teacher_transitions.sql) · **Entorno:** Windows 11, Node 22.14.0, pnpm 11.20.0. Docker no estuvo disponible; no se ejecutó contra Supabase local ni producción.

### Transiciones válidas e inválidas implementadas

- **Válidas (docente responsable `is_teacher_of_course`):** `pending → in_review` vía `public.start_claim_review` (idempotente si ya está `in_review`, retornando `transitioned = false` sin alterar `in_review_at`); `in_review → responded` vía `public.respond_to_claim` con respuesta motivada (`1..2000` caracteres).
- **Inválidas rechazadas:** saltar de `pending` a `responded` (`claim_must_be_in_review`), reabrir o editar tras `responded` (`claim_response_is_final`), motivo vacío o >2000 caracteres (`claim_response_invalid`), acceso por docente ajeno, alumno o `anon` (`claim_teacher_access_denied` / `42501`).
- **Separación académica:** responder nunca modifica `group_grades` ni `point_transactions`; cualquier ajuste académico sigue siendo una operación expresa del docente en Notas o Puntos.

### Comprobaciones ejecutadas

| Comprobación | Esperado | Observado |
| --- | --- | --- |
| Validación y mapeo de transiciones (`claims-transitions.test.ts`) | Validar UUID y respuesta (`1..2000` caracteres); mapear `claim_must_be_in_review`, `claim_response_is_final`, `claim_teacher_access_denied` y `claim_not_found`. | Aprobado en Vitest (`2/2` pruebas). |
| Flujo ordenado, idempotencia, cierre final y bandeja (`claims-transitions.test.ts`) | `pending → in_review` idempotente, rechazo de salto directo y de reapertura tras `responded`, respuesta motivada final y normalización en `listTeacherClaims`. | Aprobado en Vitest (`4/4` pruebas; `68/68` en 12 archivos). |
| Calidad y build de aplicación | Sin errores de ESLint, tipos ni build. | `pnpm lint`, `pnpm typecheck` y `pnpm build` (con variables placeholder de CI) aprobados. |

**Pendientes:** ejecutar `0050`/`0052`/`0053` y [`rec_03_claim_transitions.sql`](../../../portfolio-coursse/supabase/qa/rec_03_claim_transitions.sql) en Supabase local con Docker, completar bandeja/detalle docente (`REC-05 #35`), QA integral (`REC-07 #37`) y revisión independiente de R4 (`@fabrizio25504`) en PR. Este seguimiento se actualizó solo en archivos locales, no en GitHub.

## REC-06 #36 · Correo docente y recuperación de fallos

**Fecha:** 2026-11-23 · **Base:** `feature/r5-reclamos-exportacion` · **Migración nueva:** [`0054_claim_email_notifications.sql`](../../../portfolio-coursse/supabase/migrations/0054_claim_email_notifications.sql) · **Entorno:** Windows 11, Node 22.14.0, pnpm 11.20.0. Docker no estuvo disponible; las pruebas de despacho usaron transporte SMTP simulado.

### Diseño de aviso y recuperación

- **Unicidad y persistencia desacoplada (`0054`):** trigger `tr_create_claim_notification` crea una fila `pending` única por reclamo en `public.claim_notifications` (RLS solo docente). `prepare_claim_email_dispatch` permite un único despacho automático inicial al crearse el reclamo (`created === true`, `attempt_count = 0`) y reintentos posteriores exclusivamente al docente responsable mientras el estado no sea `sent`.
- **Privacidad y señales seguras:** [`lib/mail/claim-notice.ts`](../../../portfolio-coursse/lib/mail/claim-notice.ts) reutiliza `BASE-08` con enlace relativo autenticado `/teacher/claims?claim=<claim_public_id>`, sin notas, puntos, nombres ni texto del reclamo. Los fallos se registran solo con códigos técnicos (`MAIL_CONFIG_INCOMPLETE`, `MAIL_RECIPIENT_MISSING`, `MAIL_SEND_FAILED`, `MAIL_DISPATCH_ERROR`) sin exponer `SMTP_PASS`. El estado `sent` representa aceptación técnica SMTP, nunca entrega ni lectura.

### Comprobaciones ejecutadas

| Comprobación | Esperado | Observado |
| --- | --- | --- |
| Envío exitoso y privacidad (`claim-notice.test.ts`) | Envía aviso breve al correo docente con enlace `/teacher/claims?claim=...`, sin credenciales ni contenido académico, y registra `did_send: true` (`sent`). | Aprobado en Vitest. |
| Prevención de duplicados (`claim-notice.test.ts`) | Si `should_send` es `false` (`status: sent`), omite SMTP (`sendMail` 0 llamadas) y devuelve `skipped: true`. | Aprobado en Vitest. |
| Fallo por configuración incompleta o error SMTP (`claim-notice.test.ts`) | No lanza excepciones ni revierte el reclamo; registra `MAIL_CONFIG_INCOMPLETE` o `MAIL_SEND_FAILED` sin filtrar `SMTP_PASS`. | Aprobado en Vitest (`5/5` pruebas; `73/73` en 13 archivos). |
| Calidad y build de aplicación | Sin errores de ESLint, tipos ni build. | `pnpm lint`, `pnpm typecheck` y `pnpm build` (con variables placeholder de CI) aprobados. |

**Pendientes:** ejecutar `0054` y [`rec_06_claim_notifications.sql`](../../../portfolio-coursse/supabase/qa/rec_06_claim_notifications.sql) en Supabase local con Docker, integrar la visibilidad del estado técnico y botón de reintento en la bandeja docente (`REC-05 #35`), prueba integrada en `REC-07 #37` y revisión independiente de R1 (`@NickSalA`) en PR. Este seguimiento se actualizó solo en archivos locales, no en GitHub.

## REC-05 #35 · Bandeja y detalle docente de reclamos

**Fecha:** 2026-11-23 · **Base:** `feature/r5-reclamos-exportacion` · **Migración nueva:** ninguna (reutiliza `0053` y `0054`) · **Entorno:** Windows 11, Node 22.14.0, pnpm 11.20.0. No se ejecutó recorrido visual en navegador en vivo ni contra Supabase local (Docker no estuvo disponible).

### Recorrido implementado en código

- **Navegación identificada:** entrada «Reclamos» en [`teacher-sidebar.tsx`](../../../portfolio-coursse/components/teacher/shell/teacher-sidebar.tsx) hacia `/teacher/claims` conservando `?period=` y `?course=`, y soporte de enlace profundo `?claim=<uuid>` desde el aviso `REC-06`.
- **Bandeja y detalle:** [`TeacherClaimsInbox`](../../../portfolio-coursse/components/teacher/claims/teacher-claims-inbox.tsx) diferencia `Nota grupal` / `Puntos` y `Pendiente` / `En revisión` / `Respondido`, muestra contexto histórico, autor, motivo, acciones bloqueadas durante envío (`busyAction`), respuesta final sin controles de reapertura, enlace explícito a corrección académica separada (`/teacher/grades` o `/teacher/points`) y estado/reintento del aviso SMTP (`REC-06`).

### Comprobaciones ejecutadas

| Comprobación | Esperado | Observado |
| --- | --- | --- |
| Helpers de bandeja (`teacher-claims-inbox.test.ts`) | Resumen por estado/tipo, filtros combinados, resolución de enlace profundo `?claim=` y enlaces separados a Notas/Puntos. | Aprobado en Vitest (`4/4` pruebas; `77/77` en 14 archivos). |
| Calidad y build de aplicación | Sin errores de ESLint, tipos ni build de producción. | `pnpm lint`, `pnpm typecheck` y `pnpm build` aprobados; ruta dinámica `/teacher/claims` compilada. |

**Dimensiones verificadas y pendientes:** se verificaron **implementación en código**, **navegación identificada en código** y **pruebas unitarias/build**. Quedan pendientes el recorrido visual y pruebas de usabilidad/teclado en navegador en vivo, la verificación integrada en `REC-07 #37`, la revisión de accesibilidad `QA-01 #42` y la revisión independiente de R2 (`@RobertoPizarro`) en PR. Este seguimiento se actualizó solo en archivos locales, no en GitHub.

## QA-03 #44 · Operación y demostración reproducible

**Fecha:** 2026-11-23 · **Base:** `feature/r5-reclamos-exportacion` · **Entorno:** Windows 11, Node 22.14.0, pnpm 11.20.0 (sin Docker ni conexión a producción).

- **Artefactos creados:** guía [`operacion-y-demostracion.md`](../../03-calidad-y-operacion/operacion-y-demostracion.md) (configuración sin secretos, matriz local vs. externo con responsables, recuperación de correo, guion sintético de 7 pasos y Plan B con evidencia previa) y script [`demo-readiness.mjs`](../../../portfolio-coursse/scripts/demo-readiness.mjs) (`pnpm demo:check`).
- **Comprobación ejecutada:** `pnpm demo:check` verificó sin exponer secretos la disponibilidad de 54 migraciones (`0001`–`0054`) y suites SQL sintéticas; `pnpm test` (`77/77`), `pnpm lint`, `pnpm typecheck`, `pnpm build` y `git diff --check` sin errores.
- **Pendientes:** reproducción del guion completo en vivo por otro integrante con Docker/Supabase local activo, revisión independiente de R1 (`@NickSalA`) en PR y consolidación en `QA-04 #45`. Este seguimiento se actualizó solo en archivos locales, no en GitHub.

## REC-04 #34 · Interfaz estudiantil para presentar y consultar

**Fecha:** 2026-11-25 · **Base:** `develop` `121a157` · **Rama:** `feature/REC-04-interfaz-reclamos-alumno` · **Migración nueva:** ninguna (`D1 Opción A` y `D2 Opción A`, reutiliza `0050`, `0052`–`0054`, `listStudentClaims` y `app/student/claims/actions.ts`) · **Entorno:** Supabase local aislado en Docker (`0001`–`0054`), Node 22.18.0, Next.js 16.3.0 (`pnpm build` + `pnpm start`) y Chrome headless (`1280×800` y `375×812`) con datos sintéticos `@example.test`.

### Recorrido estudiantil integrado en `/student`

```text
/student (StudentPage → getStudentDashboard [list_student_group_grades + list_student_claims])
  └── StudentCourseCard → StudentCourseAcademicRecords (student-claims-panel.tsx)
        ├── Notas grupales (EVA-05): botón «Presentar reclamo» o badge «Reclamo: <estado> · por <autor>»
        ├── Puntos: botón «Presentar reclamo» por movimiento o badge «Reclamo: <estado>»
        ├── <dialog> Presentar reclamo (aria-labelledby, aria-describedby, Esc, 1–2000 chars, inFlightRef, «Enviando reclamo…»)
        │     └── submitGroupGradeClaimAction / submitPointTransactionClaimAction ──▶ role="status" o role="alert" conservando motivo
        └── Sección Reclamos: filtro por estado (Todos / Pendiente / En revisión / Respondido), claimsError con «Reintentar»,
              autor («Tú» o compañero histórico), alcance (grupal histórico vs. privado), fechas America/Lima, motivo y
              «Respuesta final del docente» sin botones de réplica, edición ni reapertura
```

### Comprobaciones ejecutadas

| Comprobación | Esperado | Observado |
| --- | --- | --- |
| Pruebas unitarias (`student-claims-ui.test.ts` y `get-student-dashboard.test.ts`) | Emparejamiento nota/movimiento ↔ reclamo, resúmenes, filtros, autor `Tú` vs. compañero histórico, alcance grupal vs. privado, descripción diferenciando `0` vs. `Pendiente`, mapeo en `getStudentDashboard` y aislamiento de `claimsError`. | `3/3` en `student-claims-ui.test.ts` y `6/6` en `get-student-dashboard.test.ts` aprobados (`16` archivos / `85` pruebas Vitest en total). |
| Suites SQL en Docker local (`0001`–`0054`) | Validar contratos subyacentes de reclamos (`rec_01`, `rec_02`, `rec_03`, `rec_06`). | `rec_02_claim_submission.sql`, `rec_03_claim_transitions.sql` y `rec_06_claim_notifications.sql` aprobaron (`PASS`). *Nota preexistente:* `rec_01_claims_model.sql:145` falló (`student deleted claims`), ajeno a `REC-04`. |
| `C1–C5` y `C9–C10` en navegador local (`1280×800`) | Estado vacío y disparadores en *Notas grupales* y *Puntos*; validación de motivo vacío (`"   "`) y `> 2000` chars con `role="alert"`; reclamo grupal histórico (`T1 = 16`, incluso tras traslado a `Grupo 2`, y `T2 = 0` vs. `T3 = Pendiente`) visible para compañero histórico sin botón duplicador; reclamo de puntos (`+3`) privado y oculto para compañeros; persistencia aun sin SMTP (`REC-06`); aislamiento total para tercero en otro grupo (`Alumno Tres`). | Aprobado con datos sintéticos `@example.test` (3 contextos estudiantiles simultáneos). |
| `C6–C8` y `C12–C14` (ciclo docente, conflicto, red, filtros, A11y y móvil `375px`) | Desde `/teacher/claims`, docente pasa a `En revisión` y luego `Respondido`; ambos participantes históricos ven la **Respuesta final del docente** y fecha `(Lima)` sin controles de réplica/reapertura ni cambios en nota o saldo (`+2`). Conflicto concurrente (`conflict` `23505`) entre dos pestañas y fallo de red abortado conservan el motivo escrito con `role="alert"`; doble clic dispara `1` solo `POST`; filtros `Todos`/`Respondido`, foco/cierre con `Esc` y móvil `375×812` sin desborde horizontal. | Aprobado en Chrome local; capturas (`modal`, `responded`, `mobile`) verificadas visualmente. |
| Comprobaciones de aplicación | Lint, generación de tipos, TypeScript y build de producción sin errores. | `pnpm lint`, `pnpm typecheck` (`next typegen && tsc --noEmit`) y `pnpm build` aprobados después del último cambio de código y pruebas. |

**Dimensiones verificadas y pendientes:** se verificaron **implementación en código**, **descubrimiento** (acceso directo en tarjetas de `/student`), **funcionamiento visible** (`C1–C14` en `next start` + Supabase Docker local con `0001`–`0054`) y **usabilidad básica / accesibilidad** (`<dialog>` nativo con `aria-labelledby`/`aria-describedby`, `Esc` con retorno de foco, `role="alert"`, `role="status"`, teclado y móvil `375×812`). Quedan pendientes la batería integral de reclamos `REC-07 #37` (R4), la revisión transversal de accesibilidad `QA-01 #42` (R2) y la revisión independiente en PR por `@fabrizio25504` (R4). Este seguimiento se actualizó solo localmente, no en GitHub.

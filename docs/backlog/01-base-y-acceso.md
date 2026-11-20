# Backlog 01 — Base, acceso e incorporación

> Convenciones e índices por rol: [README](README.md). Alcance: [caso](../01-definicion/caso-evaluacion-grupal.md). Hitos: [M1–M4](../04-gestion/milestones.md). La aplicación ya existe: verificar y completar, no crear un proyecto nuevo ni sustituir su autenticación.

### BASE-01 · Revisar capacidades existentes y concretar el trabajo restante

**Rol:** R1 · **Revisor:** R4 · **Milestone:** M1 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** Ninguno

**GitHub:** [#10](https://github.com/NickSalA/portfolio-course/issues/10) · **Asignado:** @NickSalA · **Revisión propuesta:** @fabrizio25504

- [ ] Contrastar acceso, cursos, importación, grupos, notas, puntos y descarga existente con el caso vigente.
- [ ] Identificar por recorrido qué se conserva, qué requiere corrección y qué falta, sin ejecutar pruebas destructivas en producción.
- [ ] Registrar decisiones pendientes y carga estimada por rol antes de comprometer la semana.

**Aceptación:** inventario verificable con fuentes y brechas; no se exige actualizar `specs/` ni se reconstruyen funciones aceptadas.

**Documentación:** estado actual, caso y notas de planificación; sin marcar aceptado solo por existir código.

**Evidencia de trabajo:** [inventario y contraste estático del recorrido](../03-calidad-y-operacion/inventario-capacidades-base-01.md), con cadenas interfaz → servidor → RPC/RLS, hallazgos y comprobaciones pendientes. No constituye aceptación funcional ni cierre en GitHub; estimaciones por revisar con el equipo.

### BASE-02 · Preparar datos sintéticos y comprobaciones aisladas

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#comprobaciones-necesarias-para-aceptación-funcional). Preparar los casos de dos docentes, IDs coincidentes/no coincidentes, autorización ajena, revocación con sesión previa, cambios de grupo y reintentos. El inventario no contiene resultados funcionales ejecutados.

**Rol:** R4 · **Revisor:** R3 · **Milestone:** M1 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** Ninguno

**GitHub:** [#11](https://github.com/NickSalA/portfolio-course/issues/11) · **Asignado:** @fabrizio25504 · **Revisión propuesta:** @MathiMomos

- [ ] Revisar la configuración de pruebas existente y comprobar el aislamiento de los datos.
- [ ] Preparar dos docentes, cursos separados, alumnos autorizados/no autorizados, grupos y actividades de prueba.
- [ ] Incorporar participantes trasladados, puntos y notas pendientes para reutilizarlos en los demás módulos.
- [ ] Registrar comandos y resultados reales; separar fallos de infraestructura de fallos funcionales.

**Aceptación:** un compañero puede reproducir los datos y ejecutar una comprobación inicial sin secretos ni conexión destructiva a producción.

**Documentación:** instrucciones de prueba y registro de evaluación.

### BASE-03 · Verificar autenticación y acceso académico por recurso

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#1-acceso-autorización-y-matrícula). Contrastar correlación de RLS de cursos/grupos, integridad matrícula/autorización, revocación no atómica y fuentes de identidad. Revisar también escrituras directas y datos de compañeros expuestos por RPC.

**Rol:** R3 · **Revisor:** R4 · **Milestone:** M1 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** BASE-02

**GitHub:** [#12](https://github.com/NickSalA/portfolio-course/issues/12) · **Asignado:** @MathiMomos · **Revisión propuesta:** @fabrizio25504

- [ ] Verificar el inicio de sesión existente y la separación de identidad, rol y autorización de curso.
- [ ] Probar alumno sin autorización, docente ajeno y sesión ausente.
- [ ] Completar controles de consulta y modificación sin confiar solo en botones o rutas ocultas.

**Aceptación:** usuarios autorizados acceden a sus cursos; las operaciones ajenas se deniegan por interfaz y acceso directo. No se crea registro público ni otro mecanismo de identidad.

**Documentación:** matriz de acceso y evidencia de casos válidos y denegados.

**Seguimiento de implementación**. La migración 0030 y el servidor verifican identidad, rol, curso y vigencia. Las pruebas locales cubrieron la lectura de recursos propios y ajenos, la preservación de vínculos anteriores inconsistentes, la revocación y la privacidad de grupos. El recorrido OAuth real y la configuración desplegada quedan pendientes de verificación en BASE-03. El ciclo de sincronización y la conservación del grupo en todos los órdenes de incorporación siguen en BASE-06 #15. [Evidencia de BASE-03](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md#base-03-12--acceso-académico-por-recurso).

**Revisión del PR #57**. La migración 0031 protege la titularidad de la autorización desde su alta y excluye matrículas inválidas del cálculo de cupos. El reintento de sincronización y la privacidad de puntos tienen pruebas de regresión. La concurrencia de las preasignaciones sigue en GRP-03 #20 y BASE-06 #15. [Evidencia de la revisión](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md#revisión-del-pr-57).

### BASE-04 · Consultar periodos institucionales y preparar cursos docentes

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#2-periodos-cursos-e-importación). Reutilizar gestión de cursos/periodos; resolver autoridad sobre periodos globales y efectos en cursos ajenos. Verificar operaciones sin filas afectadas y contexto visible.

**Rol:** R1 · **Revisor:** R3 · **Milestone:** M1 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** BASE-03

**GitHub:** [#13](https://github.com/NickSalA/portfolio-course/issues/13) · **Asignado:** @NickSalA · **Revisión propuesta:** @MathiMomos

- [ ] Verificar la consulta y selección de periodos institucionales y la gestión de cursos docentes existentes.
- [ ] Comprobar que las acciones afectan solo cursos del docente responsable.
- [ ] Corregir únicamente brechas demostradas y preparar un curso de ejemplo.

**Aceptación:** el docente prepara un curso para incorporar alumnos sin leer o alterar cursos de otro docente.

**Documentación:** recorrido de preparación y pruebas correspondientes.

**Seguimiento local de implementación:** se conserva la consulta de periodos y la gestión de cursos propios. La migración `0032` retira a usuarios autenticados la escritura de periodos compartidos y la promoción global, evitando que un docente altere indirectamente cursos ajenos. Por decisión del responsable, el equipo administrador gestionará los periodos reales directamente en la base de datos, sin crear por ahora un rol institucional en la aplicación; deberá verificar el calendario existente y el efecto sobre todos los cursos antes de cualquier cambio. La migración `0033` impide más de un periodo actual; si existen duplicados, fallará sin resolverlos automáticamente y el administrador deberá revisarlos antes de aplicarla. El seed es exclusivamente local y no sustituye esta operación. Renombrar, archivar y restaurar cursos ahora tratan cero filas como operación no aplicada. El recorrido es seleccionar un periodo vigente o próximo ya disponible, crear un curso propio y continuar con la incorporación del padrón en BASE-05 #14.

**Evidencia y pendientes:** el usuario ejecutó `pnpm test:db` con migraciones locales aplicadas: pasaron las tres suites, incluida `supabase/qa/base_04_courses_periods.sql` con dos docentes y denegación de cambios globales. También informó que inició sesión como dos docentes, que el segundo no veía el curso del primero y que completó visualmente la creación, cambio de nombre, archivo y restauración de un curso. No se realizó una evaluación formal de usabilidad. ESLint dirigido, `pnpm typecheck` y `git diff --check` pasaron. Se añade `supabase/seed.sql` para preparar un periodo sintético en bases locales vacías, no para producción; dos ejecuciones dentro de una transacción sobre la base local con periodos existentes no alteraron filas. La configuración OAuth desplegada sigue pendiente en BASE-03 #12 y la revisión de experiencia en BASE-07 #16. La importación de cursos archivados sigue en BASE-05 #14. La carga automática del seed en una base vacía no se ha ejecutado y la operación administrativa en un entorno real no se ha probado. La revisión independiente de BASE-04 sigue pendiente; BASE-03 #12 figura cerrada en GitHub, aunque mantiene pendientes de verificación desplegada. No se marca aceptada. Este seguimiento solo se actualizó localmente, no en GitHub.

### BASE-05 · Validar e incorporar el padrón de alumnos

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#2-periodos-cursos-e-importación). Reutilizar importación de padrón; contrastar validación de filas en servidor, duplicados normalizados, resultado por lote, cursos archivados y RPC antigua aún publicada.

**Rol:** R1 · **Revisor:** R4 · **Milestone:** M1 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** BASE-04

**GitHub:** [#14](https://github.com/NickSalA/portfolio-course/issues/14) · **Asignado:** @NickSalA · **Revisión propuesta:** @fabrizio25504

- [ ] Verificar la carga CSV/XLSX y los campos realmente admitidos; el archivo incorpora alumnos, no notas.
- [ ] Mostrar filas válidas, incompletas, repetidas y existentes con razones comprensibles.
- [ ] Confirmar la vinculación al curso indicado y evitar duplicados al repetir la carga.
- [ ] Probar archivo mixto, vacío y referencias a otro curso.

**Aceptación:** los conteos y rechazos coinciden con el conjunto sintético; repetir no crea autorizaciones o matrículas adicionales.

**Documentación:** formato de entrada, reglas de validación y resultados de prueba.

**Seguimiento local de implementación:** se conserva la lectura CSV/XLSX y las migraciones `0034` y `0035` validan cada fila, devuelven resultados individuales y restauran la creación de cursos propios durante la importación. Los cursos archivados no admiten importaciones. Las autorizaciones existentes, incluso inactivas, no se modifican ni reactivan; la reactivación sigue siendo una operación explícita. La revisión de compatibilidad conserva las RPC antiguas y añade una RPC versionada para los resultados por fila; los clientes antiguos conservan su comportamiento previo, incluida la reactivación de autorizaciones. La importación crea autorizaciones, no notas ni matrículas directamente; la vinculación de identidad y matrícula sigue en BASE-06 #15.

**Formato y reglas:** encabezados `Curso` y `Email` o `Correo institucional`; en el importador de curso fijo se usa el curso de la pantalla y se ignora la columna `Curso`. Son opcionales `Nombre`, `Apellido paterno`, `Apellido materno` y `Matrícula`. Se procesan las hojas con encabezados válidos; las posiciones del resultado corresponden al lote, no al número de fila física. Se normalizan espacios y mayúsculas del correo; las filas sin curso o correo, con correo inválido o curso archivado se rechazan individualmente. Las repeticiones normalizadas dentro del lote se identifican y las existentes se conservan sin cambios.

**Evidencia y pendientes:** se añadió `supabase/qa/base_05_import_students.sql` para lote mixto, repetición, vacío, cursos ajenos y archivados, identidad y conservación de datos. El usuario aplicó la migración `0034` en Supabase local mediante `npx supabase migration up --local` y ejecutó `pnpm test:db`: pasaron las cuatro suites, incluida BASE-05 con resultados por fila, aislamiento, idempotencia y conservación de datos; los fixtures se revirtieron. Tras preparar `0035`, el usuario volvió a ejecutar `npx supabase migration up --local`, que informó que la base local estaba actualizada, y `pnpm test:db`: pasaron las cuatro suites, incluida la prueba actualizada de creación de cursos. Esto no acredita el comportamiento en un entorno remoto. Pasaron `pnpm typecheck`, ESLint dirigido y `git diff --check`. El usuario confirmó visualmente que funciona el nuevo importador tras restaurar la creación de cursos y que cumplen los casos de CSV/XLSX, archivo vacío, repetición y referencias a otros cursos. Tras los cambios de revisión se requiere volver a ejecutar la migración `0036`, las pruebas SQL y los recorridos visuales de los diálogos; la prueba de concurrencia también sigue pendiente. La evaluación formal de usabilidad sigue en BASE-07 #16. El responsable considera aceptable que un docente importe en otro curso propio; el aislamiento frente a cursos de otros docentes sigue siendo obligatorio. La comprobación integral de vinculación y revocación corresponde a BASE-06 #15. No se declara aceptada la issue. Este seguimiento se actualizó solo localmente, no en GitHub.

### BASE-06 · Vincular autorización y matrícula a la cuenta correcta

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#1-acceso-autorización-y-matrícula). Validar curso e identidad del vínculo matrícula/autorización y revocación coherente. Probar sincronización antes/después del login y selección conservada tanto con grupo autorizado nulo como no nulo.

**Rol:** R3 · **Revisor:** R1 · **Milestone:** M1 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** BASE-03, BASE-05

**GitHub:** [#15](https://github.com/NickSalA/portfolio-course/issues/15) · **Asignado:** @MathiMomos · **Revisión propuesta:** @NickSalA

- [ ] Verificar coincidencia de identidad y autorización activa del curso.
- [ ] Probar autorización anterior y posterior al primer inicio de sesión.
- [ ] Comprobar que repetir la vinculación no duplica matrícula ni elimina la selección de grupo.

**Aceptación:** solo la cuenta correspondiente se vincula al curso; alumno no autorizado queda sin datos académicos y sincronizaciones posteriores conservan la pertenencia acordada.

**Documentación:** reglas de vinculación y pruebas de ambos órdenes de eventos.

**Seguimiento local de BASE-06**. `0037` vincula solo autorizaciones activas, conserva el grupo de las matrículas existentes y separa los vínculos históricos contradictorios de los cursos válidos. Las pruebas SQL de ambos órdenes de incorporación y dos sesiones simultáneas pasaron. El inicio real con Google sigue pendiente. La suite general se detiene por una comprobación de permisos que también falla con `0036` sin el cambio de BASE-06. Seguimiento de ese caso en BASE-05 #14, a cargo de @NickSalA, y de cupos concurrentes en GRP-03 #20. [Evidencia](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md#base-06-15--vinculación-de-autorización-y-matrícula).

**Revisión del PR #60**. `0038` sincroniza el número del padrón conservando el grupo y el número anterior si el padrón lo omite. Las pruebas SQL de BASE-06 pasaron. [Evidencia de la revisión](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md#revisión-del-pr-60).

### BASE-07 · Revisar la experiencia de acceso y contexto académico

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#interfaces-y-recorrido-visible). Ejecutar navegación por rol y revisar contexto, vacíos y errores. Hay interfaces identificadas en código, no verificadas visualmente; distinguir existencia, descubrimiento, funcionamiento y usabilidad.

**Rol:** R2 · **Revisor:** R4 · **Milestone:** M1 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** BASE-03, BASE-04

**GitHub:** [#16](https://github.com/NickSalA/portfolio-course/issues/16) · **Asignado:** @RobertoPizarro · **Revisión propuesta:** @fabrizio25504

- [ ] Verificar ingreso, cierre de sesión y navegación docente/alumno existentes.
- [ ] Hacer visibles el curso seleccionado y los estados de acceso, carga y error.
- [ ] Mantener mensajes claros sin revelar cursos o registros ajenos.

**Aceptación:** ambos actores reconocen su contexto y pueden continuar su recorrido; una sesión sin autorización no aparenta acceso a un curso.

**Documentación:** recorrido y representación de pantallas actualizada.

**Seguimiento local de implementación:** se conservó la autenticación OAuth, la autorización académica (`authorizeCurrentUser`) y el selector de periodo/curso existentes, corrigiendo únicamente las brechas comprobadas: barra móvil docente con cierre de sesión, Periodos y Ajustes; conservación de `?period=` y `?course=` entre módulos docentes; periodo visible en el detalle de curso; estados dedicados `not-found.tsx`, `error.tsx` y `student/loading.tsx` con mensajes neutros en español; distinción entre error de consulta y lista vacía en `getStudentDashboard`; alerta para `error=forbidden` en alumno; mensajes en español ante fallos OAuth/signOut; enlace de salto al contenido en alumno; y retiro de `groups` del placeholder `[module]`.

**Evidencia y pendientes:** pasaron `pnpm lint`, `pnpm typecheck`, `pnpm test` (6 archivos / 20 pruebas), `pnpm build`, `pnpm test:db` (8 suites), la verificación en navegador local con identidades sintéticas y el ingreso real con Google OAuth en local (rechazo sin autorización y entrada docente tras asignar rol en Studio) (`docs/automatizaciones/gestion-evaluacion-grupal/evaluacion.md#base-07-16--experiencia-de-acceso-y-contexto-académico`). Quedan pendientes la prueba de `error.tsx` ante fallo de runtime, la revisión integral de accesibilidad (`QA-01 #42`), decidir con R1 el retorno a `next` tras sesión vencida y la comprobación en entorno desplegado. Este seguimiento se actualizó solo localmente, no en GitHub.

### BASE-08 · Preparar configuración y prueba de aviso por correo

**Antecedentes BASE-01:** [Contraste de referencia](../03-calidad-y-operacion/inventario-capacidades-base-01.md#6-descargas-reclamos-y-correo). No se encontró aviso académico implementado; correo de Supabase Auth no equivale al aviso de reclamos. Preparar proveedor y política de fallo/reintento sin duplicar REC-06.

**Rol:** R5 · **Revisor:** R1 · **Milestone:** M1 · **Prioridad:** Alta · **Estado:** In review · **Bloqueado por:** Ninguno

**GitHub:** [#17](https://github.com/NickSalA/portfolio-course/issues/17) · **Asignado:** @Forex549 · **Revisión propuesta:** @NickSalA

- [x] Elegir y documentar el medio de envío compatible con el entorno, requisitos de remitente, costo y límites si corresponde.
- [x] Preparar destinatario de prueba autorizado y credenciales fuera del repositorio (`portfolio-coursse/.env.local` con `SMTP_USER`, `SMTP_PASS` y `MAIL_TEST_TO`, y ejecutar `pnpm test:mail`).
- [x] Acordar aviso breve con enlace y tratamiento de error, sin contenido académico o texto del reclamo.

**Aceptación:** configuración de prueba disponible o bloqueo explícito con responsable antes de M3; el envío real ligado al reclamo se implementa en REC-06, no se duplica aquí.

**Documentación:** variables de ejemplo sin valores secretos en [`portfolio-coursse/.env.example`](../../portfolio-coursse/.env.example) y condiciones de operación en [aviso-por-correo.md](../03-calidad-y-operacion/aviso-por-correo.md).

**Avance y evidencia (local, no sincronizado con GitHub):**

- Se contrastó con el código actual: no existía cliente SMTP ni variables de correo; se incorporó `nodemailer` (`lib/mail/config.ts`, `lib/mail/notice-template.ts`, `lib/mail/send-test-notice.ts` y `scripts/test-mail.mjs`).
- Pruebas unitarias con transporte simulado ejecutadas (`vitest run`): `portfolio-coursse/tests/unit/mail-config.test.ts` (6/6 aprobadas) y `test-harness.test.ts` (2/2 aprobadas); `eslint` y `next typegen && tsc --noEmit` sin errores.
- Prueba de envío SMTP en vivo ejecutada con `corepack pnpm test:mail` usando credenciales locales en `.env.local` (fuera de Git): correo de prueba enviado con éxito; destinatario y `messageId` omitidos por privacidad.
- Pendiente de seguimiento: revisión del PR en GitHub por R1 (`@NickSalA`) y conexión al flujo real de reclamos en `REC-06` (`#36`).

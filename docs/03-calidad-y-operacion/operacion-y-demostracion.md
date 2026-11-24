# Operación y demostración reproducible (`QA-03`)

> **Propósito:** permitir que cualquier integrante del equipo reproduzca el recorrido completo del sistema con datos sintéticos, distinguiendo con claridad lo que se ejecuta en local, lo que depende de servicios externos y el Plan B con evidencia previa verificada. No contiene secretos ni datos académicos reales.

Referencias relacionadas: [arranque local](entorno-de-pruebas-supabase.md) · [aviso por correo](aviso-por-correo.md) · [controles operativos](controles-operativos.md) · [registro de evaluación](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md).

---

## 1. Requisitos y configuración de prueba (sin secretos)

1. **Herramientas base:** Git, Node.js 22+, pnpm `11.20.0`, Docker y Supabase CLI (para base de datos local).
2. **Variables de entorno locales** (en `portfolio-coursse/.env` y `portfolio-coursse/.env.local`, ambos excluidos de Git; ver plantilla en [`portfolio-coursse/.env.example`](../../portfolio-coursse/.env.example)):
   - **Aplicación y Supabase local:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
   - **OAuth local (`.env`):** `CLIENT_ID`, `CLIENT_SECRET` (provistos por R1 fuera de Git).
   - **Correo docente (`BASE-08` / `REC-06`):** `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` (_App Password_), `MAIL_FROM`, `MAIL_TEST_TO` (solo pruebas aisladas), `NEXT_PUBLIC_APP_URL`.
3. **Verificación rápida de preparación** (desde `portfolio-coursse/`):
   ```bash
   pnpm demo:check
   ```
   Este comando comprueba la presencia de variables sin imprimir secretos y verifica que los módulos y pruebas unitarias sintéticas estén disponibles.

---

## 2. Alcance ejecutable en local vs. dependencias externas

| Capacidad | Dónde se ejecuta | Dependencia externa | Limitaciones y responsable |
| --- | --- | --- | --- |
| Pruebas unitarias, lint, tipos y build (`pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`) | 100 % local | Ninguna | No sustituyen pruebas SQL ni recorrido visual en navegador. Responsable: cada autor / R4. |
| Migraciones `0001`–`0054` y suite SQL (`pnpm test:db`) | Local con Docker | Docker + Supabase CLI | Requiere Docker en ejecución; no ejecutar `db reset` contra entornos remotos. Responsable: R3 / R4. |
| Inicio de sesión real con Google | Local + externo | Google OAuth (`CLIENT_ID`/`CLIENT_SECRET`) | Requiere `http://localhost:3000` y conectividad a Google. Responsable: R1. |
| Aviso por correo al docente (`BASE-08` / `REC-06`) | Local + externo | Servidor SMTP (Gmail / Mailtrap) | `status = 'sent'` acredita aceptación SMTP, **no entrega en buzón ni lectura**. Si falla SMTP, el reclamo persiste en BD y puede reintentarse desde `/teacher/claims`. Responsable: R5. |
| Despliegue remoto / producción (Vercel / Supabase productivo) | Externo | Proveedores remotos | **No verificado ni modificado** en las pruebas locales. Responsable: R1. |

---

## 3. Tratamiento de fallos de correo sin perder reclamos

1. Al crear un reclamo nuevo (`REC-02`), el trigger `tr_create_claim_notification` (`0054`) crea una fila única en `public.claim_notifications` con estado `pending`.
2. Si faltan variables SMTP (`MAIL_CONFIG_INCOMPLETE`), falta correo docente (`MAIL_RECIPIENT_MISSING`) o falla la conexión SMTP (`MAIL_SEND_FAILED`), el error técnico se guarda sin exponer `SMTP_PASS` ni contenido académico y **el reclamo permanece registrado y visible** para el alumno y el docente.
3. En `/teacher/claims`, el docente responsable visualiza el estado técnico del aviso y dispone del botón **«Reintentar aviso por correo»** (`retryClaimNoticeAction`). Una vez registrado `sent`, no se envían avisos duplicados.
4. No existen correos al alumno, recordatorios automáticos ni escalamiento.

---

## 4. Conjunto sintético y guion de demostración paso a paso

Utilizar exclusivamente cuentas sintéticas (`@example.test` en pruebas SQL o cuentas de prueba locales; **nunca** datos reales de alumnos o notas reales):

- **Actores:** Docente A (curso A), Docente B (curso B), Alumno 1 (inicia en Grupo A1, realiza T1 y luego cambia a Grupo A2 para T2; movimientos de puntos `+3` activo y `-1` anulado), Alumno 2 (permanece en Grupo A1), Alumno 3 (ingresa a Grupo A1 después de T1).
- **Recorrido demostrable en vivo (con Docker + Supabase local + `pnpm dev`):**
  1. **Preparación (`BASE-04`–`BASE-07`, `GRP-01`):** Docente A selecciona periodo `2026-II`, abre curso A, configura número de grupos (`2`), capacidad (`2`) y ventana abierta en hora `America/Lima`.
  2. **Selección e historia (`GRP-02`–`GRP-06`):** Alumno 1 y Alumno 2 eligen Grupo A1; Docente A fija fecha de `T1` (`performed_at`); luego Alumno 1 cambia a Grupo A2 y Docente A fija fecha de `T2`.
  3. **Registro y corrección (`EVA-01`–`EVA-03`):** En `/teacher/grades`, Docente A registra `10` para A1 en `T1` y `18` para A2 en `T2` (dejando `T2` de A1 pendiente y probando un `0` explícito distinto de vacío).
  4. **Consulta inmediata (`EVA-04`–`EVA-05`):** Alumno 1 entra a `/student` y verifica `T1 = 10` (de su grupo histórico A1), `T2 = 18` (de A2) y saldo de puntos `+3` (con `-1` anulado excluido del saldo). Alumno 3 (unido luego a A1) no ve `T1`.
  5. **Reclamos y aviso (`REC-01`–`REC-06`):** Alumno 1 presenta reclamo grupal sobre `(A1, T1)` y reclamo individual sobre su movimiento de puntos. Docente A abre `/teacher/claims` (directamente o desde el enlace `/teacher/claims?claim=<id>` del aviso), verifica estado técnico del correo (y reintento si se simuló fallo SMTP), pulsa **«Iniciar revisión»** y emite **«Enviar respuesta final»** motivada, comprobando que el caso queda cerrado sin reapertura y que la nota/puntos no cambiaron automáticamente.
  6. **Exportación XLSX por curso (`EXP-02`–`EXP-03`):** Desde `/teacher/grades` o `/teacher/courses/[coursePublicId]`, Docente A pulsa **«Exportar resultados del curso (.xlsx)»**, abre el archivo `Resultados_*.xlsx` y verifica columnas acordadas (`Nombre`, `Correo`, `T1`, `T2`, `Promedio base`, `Saldo`, `Puntos aplicados`, `Excedente`, `Promedio ajustado`), celdas vacías para pendientes, `0` numérico, atribución histórica de Alumno 1 y saldo intacto al repetir la descarga.
  7. **Aislamiento (`BASE-03`):** Docente B no ve cursos, reclamos ni puede descargar el XLSX del curso A.

---

## 5. Alternativa de demostración (Plan B con evidencia real previa)

Si durante una presentación falla Docker, la red, Google OAuth o el servidor SMTP externo, ejecutar el Plan B **aclarando explícitamente al público que se trata de evidencia real previa y no de una ejecución en vivo**:

1. Ejecutar localmente (sin red ni Docker):
   ```bash
   cd portfolio-coursse
   pnpm demo:check
   pnpm test
   ```
2. Mostrar los resultados reales registrados y versionados en [evaluacion.md](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md) (pruebas SQL previas de `BASE-03`–`EVA-04`, pruebas unitarias y binarias XLSX de `EXP-02`/`EXP-03`, y despacho/fallo simulado de `BASE-08`/`REC-06`).
3. Mostrar el código de las migraciones `0049`–`0054` y rutas compiladas (`/api/teacher/courses/[coursePublicId]/export`, `/teacher/claims`) como evidencia de implementación, indicando de forma transparente qué recorridos requieren entorno Docker/OAuth/SMTP activo.


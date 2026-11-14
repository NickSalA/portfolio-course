# Configuración y operación del aviso por correo (BASE-08)

> **Alcance:** preparación de infraestructura y prueba aislada de aviso por correo con **Nodemailer** (`BASE-08`, `#17`). El envío real ligado a la creación de reclamos corresponde a **`REC-06` (`#36`)** y no se duplica aquí.

## 1. Medio de envío elegido

* **Librería:** `nodemailer` (cliente SMTP estándar en Node.js / Next.js).
* **Proveedor recomendado para desarrollo y demo:** **Gmail SMTP** (`smtp.gmail.com`, puerto `465`, TLS implícito `SMTP_SECURE=true`) usando una **Contraseña de aplicación** de Google (*App Password*).
* **Costo y límites:**
  * Sin costo adicional con una cuenta Gmail estándar.
  * Límite de envío aproximado de Gmail para cuentas personales: ~500 correos/día (suficiente para pruebas y operación del curso).
  * Requiere verificación en dos pasos activa en la cuenta emisora para generar la *App Password*; no usar la contraseña principal de Google.
  * Compatible con cualquier otro servidor SMTP estándar (ej. Mailtrap en pruebas o dominio institucional) cambiando `SMTP_HOST`, `SMTP_PORT` y `SMTP_SECURE`.

## 2. Variables de entorno (sin secretos en el repositorio)

Las variables de ejemplo están documentadas en [`portfolio-coursse/.env.example`](../../portfolio-coursse/.env.example):

* `SMTP_HOST`: servidor SMTP (`smtp.gmail.com` por defecto).
* `SMTP_PORT`: puerto SMTP (`465` por defecto).
* `SMTP_SECURE`: `true` para TLS implícito en puerto `465` (`false` para STARTTLS en `587`).
* `SMTP_USER`: correo de la cuenta emisora.
* `SMTP_PASS`: contraseña de aplicación o secreto SMTP (solo en `.env.local` o variables del entorno de despliegue, **nunca** en Git).
* `MAIL_FROM`: dirección remitente visible (si se omite, toma `SMTP_USER`).
* `MAIL_TEST_TO`: correo destinatario autorizado para pruebas aisladas de `BASE-08`.
* `NEXT_PUBLIC_APP_URL`: URL base de la aplicación (`http://127.0.0.1:3000` en local) para construir el enlace del aviso.

## 3. Formato del aviso y tratamiento de errores

Implementado en [`portfolio-coursse/lib/mail/notice-template.ts`](../../portfolio-coursse/lib/mail/notice-template.ts) y [`portfolio-coursse/lib/mail/send-test-notice.ts`](../../portfolio-coursse/lib/mail/send-test-notice.ts):

* **Privacidad:** el correo contiene únicamente un texto genérico y un enlace relativo validado (`/teacher` en prueba, `/teacher/...` en `REC-06`). **No incluye** nombres de alumnos, notas, puntos ni el texto del reclamo.
* **Resiliencia:** `readMailConfig`, `verifyMailTransport` y `sendTestNotice` devuelven resultados estructurados (`{ ok: true, ... }` o `{ ok: false, errorCode, errorMessage }`) sin lanzar excepciones no controladas ni exponer `SMTP_PASS`. En `REC-06`, esto permitirá persistir el reclamo aunque falle el envío del correo.

## 4. Cómo ejecutar la prueba de envío real en local

1. Copiar o completar `portfolio-coursse/.env.local` con `SMTP_USER`, `SMTP_PASS` (*App Password* de Gmail) y `MAIL_TEST_TO` (destinatario autorizado).
2. Ejecutar desde `portfolio-coursse/`:

```bash
pnpm test:mail
```

## 5. Estado de verificación

* **Pruebas unitarias automatizadas (con transporte simulado):** `portfolio-coursse/tests/unit/mail-config.test.ts` (6/6 aprobadas: lectura de configuración, plantilla sin datos académicos, envío exitoso simulado y manejo de error sin fuga de credenciales).
* **Prueba de envío SMTP en vivo (`pnpm test:mail`):** ejecutada con credenciales locales en `.env.local` (ignorado por Git); envío exitoso al destinatario de prueba `gianca.0603@gmail.com` (`messageId=<03bbabb5-05e3-e2e0-705b-50b97b003477@gmail.com>`).
* **Alcance restante:** la integración con la creación de reclamos corresponde a `REC-06` (`#36`).


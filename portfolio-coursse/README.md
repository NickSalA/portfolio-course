# Plataforma académica y portafolio

Aplicación Next.js para un portafolio público y una plataforma académica privada para docentes y alumnos.

## Modelo de acceso

- Los docentes gestionan cursos, grupos y alumnos.
- Los alumnos no tienen registro público.
- El alumno inicia sesión mediante Google OAuth de Supabase.
- Iniciar sesión no concede acceso por sí solo: el correo debe haber sido cargado previamente por un docente y tener una matrícula activa.
- Los alumnos pueden consultar su curso, su grupo si aplica y su historial de puntos en modo de solo lectura.
- Los cursos pueden funcionar con grupos o sin grupos.

## Supabase

La primera migración se encuentra en:

```text
supabase/migrations/0001_academic_platform.sql
```

Incluye perfiles, cursos, grupos opcionales, alumnos autorizados por CSV, matrículas, movimientos de puntos, creación automática de perfiles al autenticarse y políticas RLS iniciales. Al iniciar sesión por primera vez, el correo del alumno autorizado se vincula automáticamente con sus matrículas activas. Las tablas académicas usan claves numéricas internas y un `public_id` UUID separado para referencias externas; los IDs internos no deben exponerse en la interfaz.

El campo `reason` de los movimientos de puntos es opcional: el docente puede asignar puntos con o sin una explicación.

Copia `.env.example` como `.env.local` y completa las credenciales del proyecto Supabase:

```bash
cp .env.example .env.local
```

Configura Google como proveedor OAuth en Supabase. La aplicación deberá validar además que el correo esté presente en `course_students`; pertenecer al dominio institucional no es suficiente.

## Desarrollo

```bash
pnpm install
pnpm dev
```

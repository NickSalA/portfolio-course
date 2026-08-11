<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Reglas del proyecto

## Propósito

Este proyecto combina dos áreas separadas:

1. Un portafolio público para la persona docente/profesional.
2. Una plataforma académica privada para gestionar cursos, alumnos, grupos y puntos adicionales.

No tratar el proyecto como la plantilla genérica de Next.js ni como un portafolio aislado.

## Arquitectura base

- Frontend: Next.js con App Router, React y TypeScript.
- Backend y base de datos: Supabase/PostgreSQL.
- Autenticación: Supabase Auth usando Google OAuth.
- Los datos académicos deben permanecer en Supabase; no usar WordPress ni otra base de datos externa.
- Mantener separadas las responsabilidades de UI, acceso a datos, autenticación y reglas de negocio.
- La autorización académica debe tener un módulo profundo detrás de una interfaz pequeña; las rutas OAuth no deben duplicar consultas ni reglas de autorización.
- La ruta OAuth debe coordinar autenticación y redirección; la decisión de acceso debe vivir en el módulo de autorización y en PostgreSQL/RPC.
- Preferir Server Components para lectura de datos y acciones server-side para mutaciones.
- Los componentes de cliente solo deben usarse cuando se necesite interacción, estado local o APIs del navegador.

## Configuración y secretos

- No leer `process.env` directamente en componentes, rutas o clientes de Supabase.
- Centralizar las variables en `lib/env.ts` y consumirlas desde ese módulo.
- Mantener `.env.local` fuera del control de versiones.
- Nunca exponer `service_role` ni secretos privados en el navegador.
- Solo las variables `NEXT_PUBLIC_*` pueden utilizarse en código cliente.
- Si se añade una variable nueva, actualizar `.env.example` y `lib/env.ts`.

## Usuarios y acceso

- Los alumnos no tienen registro público.
- Los alumnos acceden únicamente mediante Google con su cuenta institucional.
- Pertenecer al dominio institucional no concede acceso por sí solo.
- El correo debe haber sido cargado previamente por el docente mediante CSV.
- La matrícula debe estar en estado `active` para permitir el acceso académico.
- Los docentes deben estar autorizados mediante su perfil y tener `role = teacher`.
- Un usuario autenticado pero no autorizado debe cerrar sesión y recibir un mensaje claro.
- No confiar en validaciones del frontend para autorización; validar siempre en servidor y mediante RLS.

## Modelo académico

- Un curso pertenece a un periodo académico, identificado por códigos como `2025-I` o `2025-II`.
- No duplicar `period_id` en grupos, matrículas o movimientos: esas entidades heredan el periodo a través del curso.
- Un curso puede funcionar con grupos o sin grupos.
- `group_id` debe ser nullable cuando el curso no utilice grupos.
- `authorized_students` representa alumnos cargados desde CSV antes de su primer inicio de sesión.
- `course_students` representa matrículas reales vinculadas a perfiles autenticados.
- Un alumno no puede elegir cursos arbitrariamente.
- La asignación del curso la controla el docente durante la importación; la selección del grupo puede hacerla el alumno durante una ventana definida por el docente.
- Fuera de la ventana de selección, el alumno no puede cambiar de grupo.
- El docente puede corregir o cambiar el grupo mediante una operación administrativa.
- Los límites de grupo deben validarse en PostgreSQL, no solo en la interfaz.
- Las operaciones sensibles que puedan sufrir concurrencia deben implementarse mediante funciones SQL/RPC o transacciones seguras.
- La importación CSV, la sincronización de autorizaciones y la asignación de grupos deben exponerse como operaciones de dominio idempotentes, no como una colección de inserciones desde la UI.

## Identificadores

- Las tablas académicas usan claves primarias numéricas internas cuando no necesitan ser expuestas.
- Usar `public_id` UUID separado para URLs, APIs o referencias externas.
- No mostrar IDs internos secuenciales en la interfaz ni utilizarlos como identificadores públicos.
- `profiles.id` debe continuar siendo el UUID de `auth.users.id`.

## Puntos adicionales

- Cada asignación se guarda como un movimiento en `point_transactions`.
- El historial es visible para el alumno en modo de solo lectura.
- El docente puede crear, consultar y gestionar movimientos de sus cursos.
- El alumno nunca puede crear, editar ni borrar sus puntos.
- `reason` es opcional: una asignación puede tener motivo o quedar sin explicación.
- No borrar movimientos históricos para corregirlos; preferir movimientos de ajuste o reversión.

## Seguridad Supabase

- Todas las tablas académicas deben tener Row Level Security habilitado.
- Un docente solo puede acceder a sus propios cursos, grupos, matrículas y puntos.
- Un alumno solo puede consultar sus propias matrículas y movimientos.
- Las políticas RLS son parte de la funcionalidad, no una mejora opcional.
- Las consultas del cliente nunca deben sustituir las políticas RLS.
- El trigger de creación de perfil debe mantenerse pequeño y limitado a sincronizar el usuario autenticado y sus matrículas autorizadas.

## Código y cambios

- Mantener cambios pequeños, enfocados y consistentes con el código existente.
- No añadir dependencias si puede resolverse con herramientas ya instaladas.
- Antes de editar un archivo, leer su contenido y respetar las instrucciones de Next.js del bloque generado.
- No modificar ni eliminar datos, migraciones o cambios del usuario sin autorización explícita.
- Toda nueva tabla, índice, función o política debe añadirse mediante una migración versionada en `supabase/migrations`.
- Actualizar la documentación cuando cambie el flujo de acceso, el modelo de datos o la configuración.
- Ejecutar diagnósticos y, cuando sea posible, lint/build después de cambios relevantes.

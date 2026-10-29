# Aplicación académica y portafolio

Aplicación Next.js para un portafolio público y una plataforma académica privada para docentes y alumnos.

## Modelo de acceso

- Los docentes gestionan cursos, grupos, alumnos y evaluaciones según su autorización.
- Los alumnos no tienen registro público y acceden con Google OAuth mediante Supabase.
- Autenticarse no concede acceso académico por sí solo: los alumnos deben estar autorizados y tener matrícula activa; los docentes requieren el rol `teacher` en su perfil.
- Los cursos pueden funcionar con grupos o sin grupos.
- Las políticas RLS y las comprobaciones del servidor protegen el acceso; no se debe confiar solo en validaciones del navegador.

## Requisitos

- Node.js 22 o compatible con Next.js 16.
- pnpm `11.20.0` (indicado en `packageManager`).
- Docker y Supabase CLI para ejecutar el backend local.

## Desarrollo local

Para el primer arranque, seguir la **[guía de inicio del equipo y Supabase local](../docs/03-calidad-y-operacion/entorno-de-pruebas-supabase.md)**. Parte de la configuración compartida ya preparada e incluye dependencias, variables privadas, arranque, migraciones y cuentas locales de prueba. No es necesario recrear el cliente Google ni modificar `config.toml`.

Desde este directorio, con Docker iniciado:

1. Instalar dependencias con `pnpm install --frozen-lockfile`.
2. Crear `.env` privado con `CLIENT_ID` y `CLIENT_SECRET` del cliente Google de desarrollo. Supabase CLI los necesita antes de iniciar; no basta con ponerlos solo en `.env.local`.
3. Ejecutar `supabase start` y consultar `supabase status` sin publicar su salida completa.
4. Crear `.env.local` con la URL y clave **publicable locales**:

    ```dotenv
    NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<clave-publicable-local>
    ```

5. En un primer arranque, ejecutar `supabase db reset --local --no-seed`. **Borra los datos locales**; `--no-seed` evita cargar el `seed.sql` que la configuración referencia pero aún no existe. No apuntar a un entorno remoto.
6. Ejecutar `pnpm dev` y abrir `http://localhost:3000`. Studio local normalmente está en `http://127.0.0.1:54323`.
7. Preparar los permisos de las cuentas de prueba según la guía: iniciar sesión con Google no concede automáticamente el rol docente o la autorización de alumno.

Para cambios posteriores del esquema, revisar `supabase migration up --local` antes de resetear y perder datos. Usar `http://localhost:3000` conforme a la configuración existente y consultar al responsable si falla el ingreso con Google. No compartir archivos de entorno productivos ni publicar secretos.

## Comprobaciones

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:db
pnpm test:e2e
pnpm build
```

`pnpm test:db` ejecuta las pruebas SQL de capacidades y RLS con `psql` dentro del contenedor local de Supabase; requiere Docker y Supabase iniciado con las migraciones actuales. No necesita la CLI de Supabase instalada en el PATH ni ejecuta pgTAP. `pnpm test:db:pending` ejecuta por separado los requisitos pendientes y actualmente debe fallar. `pnpm test:e2e` también requiere Supabase local iniciado con las migraciones actuales. La configuración de Playwright rechaza cualquier `NEXT_PUBLIC_SUPABASE_URL` cuyo host no sea `localhost` o `127.0.0.1`; no se deben ejecutar pruebas destructivas contra producción. La instalación inicial de Playwright puede requerir `pnpm exec playwright install chromium`.

Para cada ejecución del proceso académico, registra en `../docs/automatizaciones/gestion-evaluacion-grupal/evaluacion.md` la fecha, versión o PR, entorno local, fixture sintético, resultado esperado y observado, y referencias seguras a errores o señales. No copies claves, correos reales, nombres reales ni calificaciones en logs o evidencia pública. Un check aprobado demuestra únicamente el comportamiento que ejecutó; no prueba por sí solo producción, monitoreo, respaldos o mejora frente al proceso manual.

GitHub Actions ejecuta las comprobaciones configuradas para PR; el build de CI usa valores públicos ficticios y no necesita secretos de Supabase. Los detalles del flujo de revisión, Conventional Commits y semantic-release están en [`../CONTRIBUTING.md`](../CONTRIBUTING.md). La documentación general del proyecto y del trabajo final está en [`../docs/README.md`](../docs/README.md).

## Base de datos

Las migraciones versionadas están en `supabase/migrations/`. Toda modificación de esquema, función, índice o política debe añadirse en una migración nueva; no edites migraciones ya aplicadas. Consulta la documentación del repositorio para conocer el modelo de datos, las políticas y el estado comprobado de las pruebas y controles operativos.

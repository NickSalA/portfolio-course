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

Desde este directorio:

```bash
pnpm install
supabase start
supabase status
```

Crea `.env.local` (no está versionado) y configura la URL y la clave **publicable locales** que muestra `supabase status`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<clave-publicable-local>
```

Aplica las migraciones locales y ejecuta Next.js:

```bash
supabase db reset
pnpm dev
```

La app estará disponible en `http://localhost:3000` y Supabase Studio local normalmente en `http://127.0.0.1:54323`. Comprueba que la configuración de OAuth local usa el callback `http://127.0.0.1:54321/auth/v1/callback`. No uses credenciales de producción para las pruebas locales ni compartas secretos.

## Comprobaciones

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:db
pnpm test:e2e
pnpm build
```

`pnpm test:db` y `pnpm test:e2e` son pruebas de integración: requieren Supabase local iniciado y restablecido con las migraciones actuales. La configuración de Playwright rechaza cualquier `NEXT_PUBLIC_SUPABASE_URL` cuyo host no sea `localhost` o `127.0.0.1`; no se deben ejecutar pruebas destructivas contra producción. La instalación inicial de Playwright puede requerir `pnpm exec playwright install chromium`.

Para cada ejecución del proceso académico, registra en `../docs/automatizaciones/gestion-evaluacion-grupal/evaluacion.md` la fecha, versión o PR, entorno local, fixture sintético, resultado esperado y observado, y referencias seguras a errores o señales. No copies claves, correos reales, nombres reales ni calificaciones en logs o evidencia pública. Un check aprobado demuestra únicamente el comportamiento que ejecutó; no prueba por sí solo producción, monitoreo, respaldos o mejora frente al proceso manual.

GitHub Actions ejecuta las comprobaciones configuradas para PR; el build de CI usa valores públicos ficticios y no necesita secretos de Supabase. Los detalles del flujo de revisión, Conventional Commits y semantic-release están en [`../CONTRIBUTING.md`](../CONTRIBUTING.md). La documentación general del proyecto y del trabajo final está en [`../docs/README.md`](../docs/README.md).

## Base de datos

Las migraciones versionadas están en `supabase/migrations/`. Toda modificación de esquema, función, índice o política debe añadirse en una migración nueva; no edites migraciones ya aplicadas. Consulta la documentación del repositorio para conocer el modelo de datos, las políticas y el estado comprobado de las pruebas y controles operativos.

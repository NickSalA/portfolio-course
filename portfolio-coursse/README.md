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
pnpm exec next typegen
pnpm exec tsc --noEmit
pnpm build
```

GitHub Actions ejecuta estas comprobaciones para PR hacia `main`; el build de CI usa valores públicos ficticios y no necesita secretos de Supabase. Los detalles del flujo de revisión, Conventional Commits y semantic-release están en [`../CONTRIBUTING.md`](../CONTRIBUTING.md). La documentación general del proyecto y del trabajo final está en [`../docs/README.md`](../docs/README.md).

## Base de datos

Las migraciones versionadas están en `supabase/migrations/`. Toda modificación de esquema, función, índice o política debe añadirse en una migración nueva; no edites migraciones ya aplicadas. Consulta la documentación del repositorio para conocer el modelo de datos, las políticas y el estado comprobado de las pruebas y controles operativos.

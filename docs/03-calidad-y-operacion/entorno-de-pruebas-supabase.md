# Arranque local para integrantes del equipo

La configuración compartida de Supabase y Google ya fue preparada por el responsable del proyecto. **No necesitas crear otro cliente OAuth, ejecutar `supabase init` ni modificar `config.toml`.** Solo debes preparar tu entorno privado y levantar los servicios en tu computadora.

Cada integrante utiliza una base local independiente. No copies credenciales de producción ni compartas tu cuenta Google.

## 1. Requisitos

Tener instalados Git, Node.js 22, pnpm **11.20.0**, Docker y Supabase CLI. Docker debe estar iniciado. Si falta la CLI, utiliza un [método oficial de instalación](https://supabase.com/docs/guides/local-development/cli/getting-started).

Solicita al responsable los valores de desarrollo de **`CLIENT_ID` y `CLIENT_SECRET`**, por un medio privado seguro.

## 2. Obtener el proyecto e instalar dependencias

Si todavía no lo tienes:

```bash
git clone https://github.com/NickSalA/portfolio-course.git
cd portfolio-course/portfolio-coursse
pnpm install --frozen-lockfile
```

Si ya lo clonaste, usa tu copia y actualiza la rama según [el flujo del equipo](../../CONTRIBUTING.md), sin sobrescribir cambios propios.

**Desde aquí, todos los comandos se ejecutan en `portfolio-course/portfolio-coursse/`.**

## 3. Colocar las credenciales de desarrollo

Crea `.env` junto a `package.json` con los valores que te pase el responsable:

```dotenv
CLIENT_ID=REEMPLAZAR_POR_EL_VALOR_RECIBIDO
CLIENT_SECRET=REEMPLAZAR_POR_EL_VALOR_RECIBIDO
```

La configuración existente ya los utiliza. Deben estar en `.env`, no únicamente en `.env.local`. No los pegues en `config.toml`, Git, Issues ni capturas. El secreto nunca debe tener prefijo `NEXT_PUBLIC_`.

## 4. Levantar Supabase y conectar la aplicación

Con Docker iniciado:

```bash
supabase start
supabase status
```

El primer arranque puede descargar imágenes. Cuando termine, toma de `supabase status` la URL y la **clave publicable local**. No compartas la salida completa: puede incluir claves privilegiadas.

Crea tu `.env.local` junto a `package.json`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=REEMPLAZAR_POR_TU_CLAVE_PUBLICABLE_LOCAL
```

Usa los valores de tu instancia, no los del Supabase productivo del responsable. No uses una clave `service_role` o secreta en esta variable pública.

## 5. Preparar la base e iniciar la aplicación

Para el primer arranque:

```bash
supabase db reset --local --no-seed
pnpm dev
```

**El reset borra los datos de tu base local**, incluidos usuarios y roles de prueba. Se omite el seed porque actualmente no existe `supabase/seed.sql`; las migraciones sí se aplican. No utilices `--linked` ni una URL remota para este paso.

Abrir:

| Servicio              | Dirección                |
| --------------------- | ------------------------ |
| Aplicación            | `http://localhost:3000`  |
| Supabase Studio local | `http://127.0.0.1:54323` |

Usa el puerto 3000 previsto por la configuración. Si está ocupado y Next.js elige otro, libera el puerto antes de probar el inicio de sesión. Si aparece un bloqueo de Google o un error de redirección, comunícalo al responsable: no hace falta rehacer la configuración compartida por tu cuenta.

## 6. Preparar tus cuentas locales de prueba

Los permisos y datos de la base del responsable **no se copian a tu computadora**. Iniciar sesión con Google tampoco concede automáticamente acceso docente.

### Docente

1. Intenta iniciar sesión con tu cuenta de prueba. Si Google completa el ingreso, el usuario y su perfil se crean aunque la aplicación te rechace por falta de autorización.
2. Abre **Studio local**, en `http://127.0.0.1:54323`.
3. Localiza el usuario en Authentication y su mismo identificador en `public.profiles` mediante Table Editor.
4. Cambia **solo el perfil de tu cuenta de prueba** a `role = teacher` y guarda.
5. Inicia sesión de nuevo y abre `http://localhost:3000/teacher`.

Es una preparación administrativa de tu base local, no un cambio en producción ni una forma pública de asignarse permisos. Si no aparece el perfil, revisa el fallo de ingreso o de migraciones antes de crear registros manualmente.

### Alumno

1. Con el docente local, prepara un periodo y curso e incorpora al alumno con el correo exacto de su cuenta Google de prueba.
2. Usa otro perfil del navegador o una sesión separada para iniciar sesión como alumno.
3. Comprueba su acceso al curso. Una cuenta no autorizada debe ser rechazada.

No conviertas todas las cuentas en docentes para evitar errores: necesitas comprobar ambos tipos de acceso. Las funciones disponibles dependerán de lo implementado en la rama que ejecutes.

## 7. Próximos días de trabajo

Con Docker iniciado, desde la carpeta de aplicación:

```bash
supabase start
pnpm install --frozen-lockfile
supabase migration up --local
pnpm dev
```

Aplica las migraciones nuevas sin resetear cada vez. Si fallan, revisa la causa antes de borrar tus datos. No edites migraciones ya aplicadas ni dejes cambios de esquema únicamente en Studio.

- Si cambias `.env.local`, reinicia `pnpm dev`.
- Para detener Supabase local, usa `supabase stop`.
- Un reset obliga a preparar de nuevo tus cuentas y datos de prueba.
- Por Git compartimos código y migraciones, no los datos de las bases locales.

## 8. Comprobaciones y ayuda

Comprobaciones disponibles, según lo que hayas modificado:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:db
pnpm test:e2e
pnpm build
```

Las pruebas de base y navegador requieren Supabase local. Si Playwright pide el navegador, ejecuta `pnpm exec playwright install chromium`. No se dan por aprobadas las comprobaciones solo porque sus comandos existan.

| Problema                            | Revisión rápida                                                                     |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| `supabase: not found`               | Instalar la CLI y comprobar el PATH                                                 |
| Docker no responde                  | Iniciar el motor y revisar permisos/recursos                                        |
| Falta `CLIENT_ID` o `CLIENT_SECRET` | `.env` dentro de `portfolio-coursse/`, con los valores recibidos                    |
| Error de Google o redirección       | Usar `localhost:3000` y avisar al responsable si persiste                           |
| Cuenta sin acceso académico         | Revisar rol docente local o autorización activa del alumno                          |
| Error de `seed.sql`                 | Usar `supabase db reset --local --no-seed` solo si aceptas borrar los datos locales |
| No aparecen datos de un compañero   | Es normal: las bases son independientes                                             |

Antes de subir cambios, comprueba que `.env` y `.env.local` sigan excluidos de Git. No incluyas secretos ni datos reales de alumnos en evidencias.

Esta guía describe el arranque esperado; los fallos concretos deben registrarse sin publicar credenciales. No sustituye la comprobación del entorno en cada computadora.

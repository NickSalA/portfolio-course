# Cómo aislar las pruebas de Supabase

**Estado actual:** según el responsable, Vercel se conecta a Supabase productivo. Hay una
instancia local de Supabase accesible desde `portfolio-coursse/`; su configuración está junto a
las migraciones. Se ejecutó `db reset --local` y se aplicaron las migraciones `0001`–`0029`
en la base local. La prueba con identidades sintéticas en
[`group_grades_rls.sql`](../../portfolio-coursse/supabase/tests/group_grades_rls.sql) pasó;
producción no fue modificada. No se ha creado un
proyecto alojado de pruebas. La instancia local y las credenciales de producción son distintas.

## Opción 1: Supabase local para desarrollo y pruebas repetibles

Es el primer paso recomendado para probar SQL, RLS, importaciones y casos excepcionales sin
arriesgar la base productiva. Requiere Docker, Node.js y la CLI de Supabase. Desde
`portfolio-coursse/` (donde está `supabase/migrations/`):

```sh
npx --no-install supabase status
```

La configuración `supabase/config.toml` ya existe en `portfolio-coursse/` y la CLI reconoce
la instancia local desde ese directorio: no hace falta ejecutar `init` ni mover migraciones.
`status` confirma el servicio, **no** que las migraciones del repositorio estén aplicadas.
Para recrear desde cero una base **local** y aplicar las migraciones se puede usar
`npx --no-install supabase db reset --local`, pero **borra los datos locales**: hacerlo solo
tras comprobar que no hay datos de prueba que preservar. No ejecutarlo contra proyectos remotos.
Si alguna migración falla, registrar el error y corregirlo antes de afirmar que la base local
reproduce el esquema esperado.

Configurar `portfolio-coursse/.env.local` para apuntar a los valores locales de
`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, comprobando qué nombre de
clave pública entrega la versión de la CLI. Ese archivo está ignorado por Git: nunca usar allí
credenciales productivas para pruebas destructivas. Las variables de `.env` apuntan al
Supabase remoto: son claves de acceso a ese proyecto, **no** las credenciales del cliente OAuth
de Google. El inicio de sesión con Google del remoto funciona porque el proveedor se configuró
en aquel proyecto; el `config.toml` local no configura Google. Para probar Google OAuth sobre el
Supabase local se necesita un cliente OAuth de pruebas y redirects locales aprobados; SQL/RLS e
importaciones se pueden probar con identidades de prueba sin copiar alumnos reales.

## Opción 2: proyecto Supabase de pruebas para el equipo y previews

Crear un **proyecto Supabase distinto** desde el panel, con otro identificador y credenciales.
Antes de enlazar la CLI o aplicar migraciones, verificar dos veces que el identificador pertenece
a pruebas y no a producción. Revisar la compatibilidad de las migraciones con una base vacía y
aplicarlas solo al proyecto de pruebas; nunca copiar tablas de alumnos ni claves del productivo.
Configurar Google OAuth de pruebas si se necesita probar el login. Establecer URLs de retorno
permitidas para el entorno de pruebas, limitadas a dominios que controla el equipo.

En Vercel, asociar las variables `NEXT_PUBLIC_SUPABASE_URL` y
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` del proyecto de pruebas al entorno **Preview**, y mantener
las variables productivas únicamente en **Production**. Verificar la configuración de ramas,
previews y redirects antes de invitar al equipo a probar. La clave pública puede usarse en el
cliente; `service_role` y otros secretos privilegiados **nunca** deben incluirse en variables
`NEXT_PUBLIC_*`, repositorio, capturas o logs. Crear usuarios, periodos y cursos sintéticos en
el proyecto de pruebas. Un segundo proyecto alojado puede tener límites o costos según el plan
de Supabase; confirmar condiciones antes de crearlo.

## Orden recomendado

1. Empezar con Supabase local para repetir migraciones y probar permisos con datos sintéticos.
2. Agregar el proyecto de pruebas alojado solo cuando se necesiten previews de Vercel y pruebas
   compartidas de OAuth de extremo a extremo.
3. Conectar GitHub Actions a verificaciones y al entorno aislado, nunca a la base productiva de
   forma predeterminada. Conservar evidencias anonimizadas de pruebas para el trabajo final.

Ningún comando de esta guía debe ejecutarse con un proyecto remoto productivo enlazado por error;
los comandos de reinicio de datos se limitan explícitamente a `--local`.

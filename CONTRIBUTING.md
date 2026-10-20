# Contribuir

## Flujo de trabajo

La [constitución](.specify/memory/constitution.md) define el flujo Git Flow. La organización y revisión del equipo están en [Equipo y flujo de trabajo](docs/04-gestion/equipo-y-flujo-de-trabajo.md).

1. El trabajo se rastrea en Issues y, cuando corresponda, en el GitHub Project del equipo.
2. Crea una rama desde `develop` con un nombre descriptivo: `feature/teacher-dashboard` para funciones o `bugfix/oauth-callback` para correcciones regulares. Si `develop` o sus protecciones no están configuradas en el remoto, coordina su preparación; no sustituyas el flujo por cambios directos a `main`.
3. Mantén el cambio enfocado. No incluyas `.env.local`, claves ni otros secretos.
4. Antes de abrir el PR, ejecuta desde `portfolio-coursse/`:

    ```bash
    pnpm lint
    pnpm exec next typegen
    pnpm exec tsc --noEmit
    pnpm build
    ```

5. Abre un PR hacia `develop`, completa la plantilla y vincula la Issue con `Closes #<número>` cuando exista una Issue real.
6. El propietario del repositorio revisa y aprueba el PR. CI debe pasar antes de integrar.
7. Para funciones y correcciones regulares usa **Squash and merge** hacia `develop`. El título del PR debe seguir Conventional Commits para que el mensaje resultante conserve el significado del cambio.
8. Prepara versiones en `release/<version>` desde `develop`; tras validar, intégralas mediante PR en `main` y sincroniza de vuelta a `develop`, conservando el historial de cambios que necesita semantic-release. Las correcciones urgentes usan `hotfix/<nombre>` desde `main` y se integran en `main` y `develop`.

No se integra directamente a `main` ni a `develop`. Antes de operar el flujo, verifica ramas, protecciones y cobertura de los workflows para los destinos correspondientes; este documento no acredita que estén configurados.

## Mensajes Conventional Commits

Formato:

```text
<tipo>(<ámbito opcional>): <descripción imperativa>
```

Tipos habituales:

- `feat`: funcionalidad nueva; genera versión minor.
- `fix`: corrección; genera versión patch.
- `perf`: mejora de rendimiento; genera versión patch.
- `refactor`, `docs`, `test`, `build`, `ci`, `chore`: cambios que no generan versión por sí solos.

Un cambio incompatible debe incluir `!` (`feat(api)!: ...`) o un pie `BREAKING CHANGE: ...`; semantic-release genera una versión major.

Ejemplos de títulos de PR:

```text
feat(auth): add teacher login
fix(student): preserve selected group
chore(ci): add pull request checks
```

## Versiones y releases

Al integrar a `main`, GitHub Actions ejecuta semantic-release. Si los commits desde el release anterior indican un cambio de versión, crea un tag `vX.Y.Z` y publica un GitHub Release con notas generadas automáticamente. No cambies la versión manualmente.

## Cambios de Supabase

Toda modificación de esquema, función o política debe agregarse como migración nueva en `portfolio-coursse/supabase/migrations/`. No edites migraciones ya aplicadas y nunca incluyas credenciales de producción en el repositorio.

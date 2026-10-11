# Contribuir

## Flujo de trabajo

1. El trabajo se rastrea en Issues y, cuando corresponda, en el GitHub Project del equipo.
2. Crea una rama desde `main` con un nombre descriptivo, por ejemplo `feat/teacher-dashboard` o `fix/oauth-callback`.
3. Mantén el cambio enfocado. No incluyas `.env.local`, claves ni otros secretos.
4. Antes de abrir el PR, ejecuta desde `portfolio-coursse/`:

    ```bash
    pnpm lint
    pnpm exec next typegen
    pnpm exec tsc --noEmit
    pnpm build
    ```

5. Abre un PR hacia `main`, completa la plantilla y vincula la Issue con `Closes #<número>`.
6. El propietario del repositorio revisa y aprueba el PR. CI debe pasar antes de integrar.
7. Usa **Squash and merge**. El título del PR debe seguir Conventional Commits: semantic-release usa ese título como mensaje de commit para decidir si corresponde una nueva versión.

No se integra directamente a `main`.

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

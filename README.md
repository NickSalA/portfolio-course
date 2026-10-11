# Plataforma académica y portafolio

Aplicación web con Next.js para un portafolio público y una plataforma académica privada para docentes y alumnos. La plataforma organiza cursos, grupos, matrículas, evaluaciones y puntos; Supabase gestiona autenticación y datos.

## Estructura del repositorio

- [`portfolio-coursse/`](portfolio-coursse/): aplicación, migraciones y configuración local de Supabase.
- [`docs/`](docs/): documentación del proyecto, decisiones, calidad, operación y entregables del curso.
- [`.github/`](.github/): plantillas y workflows de GitHub Actions.
- [`CONTRIBUTING.md`](CONTRIBUTING.md): flujo de ramas, PR, Conventional Commits y releases.

## Desarrollo local

Consulta [`portfolio-coursse/README.md`](portfolio-coursse/README.md) para instalar dependencias, configurar las variables locales y ejecutar la aplicación.

## Calidad y colaboración

Los PR hacia `main` ejecutan CI: lint, typecheck y build. Al integrar cambios en `main`, semantic-release puede crear una versión y un GitHub Release según los mensajes Conventional Commits. La publicación de una versión no implica despliegue de la aplicación.

Antes de trabajar, revisa [`CONTRIBUTING.md`](CONTRIBUTING.md) y la [documentación del proyecto](docs/README.md). La configuración de protección de ramas y aprobaciones se administra en GitHub; no queda definida únicamente por los archivos del repositorio.

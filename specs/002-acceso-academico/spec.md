# Especificación de BASE-03 · Acceso académico por recurso

**Rama** `feature/base-03-acceso-academico`
**Fecha** 2026-11-18
**Entrada** [Issue #12](https://github.com/NickSalA/portfolio-course/issues/12), [ficha BASE-03](../../docs/backlog/01-base-y-acceso.md) y [antecedentes BASE-01](../../docs/03-calidad-y-operacion/inventario-capacidades-base-01.md).

## Escenarios y pruebas

### US1 · Ingresar con la identidad y el alcance correctos (P1)

Un alumno con identidad de Google verificada, matrícula y autorización vigentes puede consultar sus propios recursos. El docente responsable puede consultar y modificar los recursos de sus cursos según los permisos del módulo. Una persona sin sesión, con otra identidad o sin autorización no obtiene datos académicos.

**Prueba independiente** Dos docentes, cursos separados y alumnos autorizados y no autorizados. Validar los casos permitidos y denegados por página y por acceso directo. Incluir identificadores coincidentes y distintos.

### US2 · Revocar y restaurar el acceso (P1)

El docente responsable puede desactivar o restaurar una autorización y su matrícula en una sola operación. La siguiente consulta del alumno revocado queda denegada aunque conserve su sesión. Los vínculos inconsistentes quedan fuera del acceso.

**Prueba independiente** Una sesión con acceso pierde el acceso tras la baja y lo recupera tras la reactivación válida. Un docente ajeno no puede modificar la autorización.

### US3 · Consultar opciones de grupo con privacidad (P2)

El alumno autorizado ve capacidad y ocupación de las opciones elegibles de su curso. Los nombres de integrantes solo se muestran en la ventana de selección. La respuesta omite sus correos. Elegir grupo mantiene los controles de titularidad, ventana y cupo.

**Prueba independiente** Verificar resumen y detalles antes, durante y después de la ventana. Verificar el rechazo de un alumno revocado y que una selección válida siga funcionando.

### Casos límite

- Una sesión de otro método, una identidad ambigua o un correo que ya no coincide con el verificado carece de acceso académico.
- Una autorización vigente permite comprobar la propia fila antes de la primera sincronización. Una matrícula ausente, revocada o inconsistente no concede acceso al curso.
- Los nombres vacíos se omiten y la ventana incluye el instante de apertura y excluye el de cierre.

## Requisitos

- **FR-001** Separar identidad de Google, rol docente, titularidad del curso y vigencia del acceso del alumno.
- **FR-002** Aplicar el alcance en la aplicación, en las consultas directas y en las operaciones de base de datos para cursos, grupos, matrículas, padrón, evaluaciones y puntos.
- **FR-003** Rechazar vínculos incoherentes nuevos o modificados y preservar los registros anteriores para revisión.
- **FR-004** Actualizar autorización y matrícula en una sola operación y aplicar la baja desde la siguiente solicitud.
- **FR-005** Restringir las opciones de grupo al curso propio y limitar la información de los compañeros a nombres durante la ventana.

### Entidades

Identidad verificada, perfil docente, curso, autorización del padrón, matrícula, grupo, evaluación y movimiento de puntos.

## Criterios medibles

- **SC-001** Los casos válidos de alumno y docente acceden a sus recursos y los casos denegados devuelven cero recursos ajenos.
- **SC-002** La primera solicitud posterior a una baja carece de acceso y las reactivaciones válidas conservan matrícula y grupo.
- **SC-003** Ninguna respuesta de opciones contiene correos de compañeros y no hay nombres fuera de la ventana.

## Alcance

La administración de periodos sigue en #13, el ciclo de incorporación y resincronización en #15, el diseño del recorrido de grupos en #21 y las notas estudiantiles históricas en #27. El entorno desplegado se verifica por separado antes del despliegue.

# BASE-06 #15 · Vinculación de autorización y matrícula

**Rama** `feature/base-06-vinculacion-matricula` · **Base** `a433807` · [Issue #15](https://github.com/NickSalA/portfolio-course/issues/15)

## Escenarios y pruebas

### US1 · Acceder al curso autorizado (P1)

El estudiante con Google verificado obtiene una matrícula en su curso cuando el padrón ya contiene su autorización activa. Si llega antes que el padrón, el primer ingreso queda sin acceso académico. Después de incorporarlo, el siguiente inicio de sesión vincula su cuenta. El panel también puede sincronizar una sesión válida que ya tiene acceso a otro curso.

**Prueba independiente** Ejecutar ambos órdenes de eventos con identidades sintéticas. Confirmar que un correo distinto o una autorización inactiva dejan al estudiante sin acceso.

### US2 · Conservar la matrícula al sincronizar (P1)

La sincronización repetida conserva la matrícula y su grupo. Si el padrón indica A y el alumno eligió B, se conserva B. También se mantiene el estado sin grupo de una matrícula existente. La primera matrícula sigue admitiendo la preasignación actual.

**Prueba independiente** Repetir la sincronización por sesión, recarga y dos solicitudes simultáneas. Probar el grupo del padrón nulo y no nulo.

### US3 · Tratar matrículas antiguas y revocaciones (P1)

Un vínculo antiguo faltante se completa solo si la coincidencia de curso y cuenta es inequívoca y la autorización está libre. Los vínculos contradictorios se conservan para revisión y quedan excluidos del acceso. Una contradicción en un curso no impide acceder a otro curso autorizado. Tras una baja no se recupera acceso por resincronizar. La restauración explícita válida conserva la matrícula y el grupo.

## Requisitos y aceptación

- **FR-001 / SC-001** Usar la identidad académica aprobada en #12 y el padrón de #14. Solo la cuenta correspondiente obtiene matrícula para cada autorización activa.
- **FR-002 / SC-002** Conservar una matrícula por curso y cuenta aunque se repita la sincronización o haya dos solicitudes simultáneas. Conservar su identificador y su grupo.
- **FR-003 / SC-003** Completar vínculos faltantes inequívocos, mantener los contradictorios sin acceso y verificar que la revocación y la restauración válidas se respetan.
- **FR-004 / SC-004** Registrar pruebas de los dos órdenes de incorporación con resultados esperados y observados.

## Entidades y alcance

Cuenta verificada, autorización del padrón, curso, matrícula y grupo. Los cupos concurrentes al preasignar grupos se siguen en GRP-03 #20. BASE-03 conserva la regla de acceso y el estado de verificación de Google desplegado.

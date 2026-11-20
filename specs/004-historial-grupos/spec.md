# GRP-02 #19 · Historial de pertenencia a grupos

**Rama** `feature/grp-02-historial-grupos` · **Base** `059f01a` · [Issue #19](https://github.com/NickSalA/portfolio-course/issues/19)

## Escenarios y pruebas

### US1 · Conservar pertenencia a lo largo del tiempo (P1)

Cuando se crea, cambia, desactiva o reactiva una matrícula, su estado queda registrado junto con el cambio. El mismo grupo se conserva al resincronizar una matrícula que no cambió de estado. Los intervalos no se solapan y los grupos pertenecen al curso de la matrícula.

**Prueba independiente** Crear una matrícula sin grupo, asignarle A, pasarla a B, darla de baja y reactivarla. Consultar cada estado antes, después y justo en el instante de cambio.

### US2 · Consultar con autorización (P1)

El docente responsable consulta una matrícula en un instante conocido y obtiene el grupo, la ausencia de grupo, la baja o el estado desconocido. La migración registra el estado comprobable de las matrículas existentes desde su aplicación. Para una fecha anterior o un vínculo antiguo inconsistente, devuelve historial desconocido.

**Prueba independiente** Consultar como docente responsable, docente ajeno, alumno y sesión ausente.

### US3 · Preservar grupos y notas (P1)

Reducir la cantidad de grupos conserva los grupos que mantienen historial, notas, matrículas o autorizaciones. Se pueden eliminar los grupos excedentes sin referencias.

**Prueba independiente** Reducir un curso con un grupo vacío con historial, otro con notas y otro sin referencias.

## Requisitos y aceptación

- **FR-001** Capturar los cambios de matrícula y su historial en la misma transacción.
- **FR-002** Distinguir los estados con grupo, sin grupo, inactivo y desconocido desde el corte temporal acordado.
- **FR-003** Proteger el curso y la identidad de la matrícula, prevenir solapamientos y evitar modificaciones o lecturas directas del historial por actores ajenos.
- **FR-004** Conservar los grupos necesarios para explicar resultados cuando se ajusta la capacidad.
- **SC-001** Los cambios exactos, la resincronización, el rollback y las solicitudes simultáneas producen intervalos coherentes sin duplicados.
- **SC-002** Los casos positivos y denegados proporcionan resultados distintos y verificables por actor, curso e instante.

## Entidades y alcance

Matrícula, curso, grupo, nota grupal y estado temporal. GRP-06 #23 resuelve participantes por actividad. EVA-04 #27 aplica permisos a los resultados históricos del alumno. La coordinación de cupos sigue en GRP-03 #20.

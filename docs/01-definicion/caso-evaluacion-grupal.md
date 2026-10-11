# Caso del trabajo final: gestión de evaluación grupal

**Estado:** caso elegido y contexto acordado; los requisitos pendientes deben concretarse en
`/speckit-specify`. Esta página no es la especificación ni afirma que todo el flujo esté terminado.

## Situación y objetivo

Un docente de la UNMSM llevaba notas en una hoja XLSX y registraba por separado grupos y puntos.
Al inicio del curso, durante las primeras semanas, recibe del SUM un XLSX de alumnos. La
plataforma carga esos alumnos, permite que se organicen en grupos y ya tiene una interfaz docente
para definir evaluaciones y registrar notas **por grupo**. Se busca reducir registros dispersos y
controlar la asignación de notas de cada evaluación a los grupos pertinentes. Los puntos son
individuales pero **no** son notas. La interfaz del alumno no presenta notas grupales; el
permiso de lectura directa de `0028` se retira en `0029`, aún sin aplicación verificada por
entorno (véase el [modelo de datos](../02-diseno/modelo-datos.md)).

## Límite del proceso a evaluar

- **Entrada:** alumnado autorizado y grupos del curso; la carga inicial CSV/XLSX del SUM prepara
  estos datos, pero el archivo no contiene notas y no se importan calificaciones desde XLSX.
- **Operación central:** el docente identifica los grupos de su curso, define la evaluación y
  registra la calificación de cada grupo. Deben verificarse autorización, curso, grupo y rango de
  la nota; solo el docente responsable del curso puede modificarla. Los errores deben
  comunicarse y no atribuir notas a cursos equivocados.
- **Salida observable:** notas registradas por grupo y evaluación, visibles al docente; medir
  completitud, tiempo y errores frente al proceso anterior en XLSX. La exportación de datos
  docentes está prevista para después; no es una capacidad existente.
- **Eventos y excepciones que se deben especificar:** elección de grupo en la ventana habilitada,
  cambio administrativo fuera de ella, corrección de una nota y fallo de guardado. Debe quedar
  claro qué efectos tienen sobre notas pasadas, reintentos y evidencia de ejecución.

## Cambios de grupo y pertenencia histórica

La regla acordada es que un alumno conserva las notas obtenidas con su grupo anterior y participa
en las evaluaciones posteriores con el nuevo grupo, incluso si el docente aprueba el traslado
después de la ventana de elección. **Cuenta el grupo al que pertenecía el alumno el día en que se
realizó la actividad**, no el grupo al que pertenece al guardar o corregir la nota. Si el docente
corrige la nota de un grupo anterior para aquella actividad, la corrección alcanza a quienes la
realizaron con ese grupo, aunque hoy pertenezcan a otro.

Para el caso excepcional en que un alumno merece una nota distinta de la de su antiguo grupo,
en una etapa posterior el docente responsable del curso podrá realizar una
**corrección individual justificada** de esa evaluación. La nota
grupal sigue siendo la regla general; la corrección excepcional no convierte los puntos en notas
ni implica un módulo general de calificación individual. Al diseñarla, registrar el motivo y
preservar la nota grupal original para explicar el resultado final. No forma parte de la primera
entrega. Estas reglas todavía no están implementadas: el esquema
actual solo guarda el grupo actual de la matrícula y la nota por grupo/evaluación, sin fecha de
actividad, historial de membresía ni correcciones individuales. La propuesta técnica y sus casos
de prueba están en el [modelo de datos](../02-diseno/modelo-datos.md).

## Evaluación pendiente

Usar datos sintéticos o anonimizados y una misma actividad con un número comparable de grupos
para medir tiempo, completitud, correcciones y casos excepcionales. Registrar línea base manual,
resultados de pruebas, manejo de fallos y evidencia de monitoreo en el futuro
`docs/automatizaciones/<nombre-del-proceso>/evaluacion.md`. La propuesta de métricas está en
[indicadores y CI/CD](../03-calidad-y-operacion/indicadores-y-ci-cd.md); todavía no hay mediciones
que presentar como resultados.

Referencias de implementación existente:
[pantalla de notas](../../portfolio-coursse/app/teacher/grades/page.tsx),
[acciones de notas](../../portfolio-coursse/app/teacher/grades/actions.ts),
[esquema de notas](../../portfolio-coursse/supabase/migrations/0028_group_evaluations_and_grades.sql)
y [modelo de datos resumido](../02-diseno/modelo-datos.md).

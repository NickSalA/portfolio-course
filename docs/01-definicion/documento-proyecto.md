# Documento del proyecto

## Propósito

Desarrollar una plataforma de gestión académica para el registro y seguimiento de las evaluaciones grupales en los cursos del docente del caso de estudio. El origen es la identificación manual de integrantes y anotación repetitiva de una misma nota en XLSX, junto con la necesidad de consulta individual de resultados durante el ciclo.

El [caso vigente](caso-evaluacion-grupal.md) reúne las reglas acordadas. El [backlog](../04-gestion/backlog-y-responsabilidades.md) organiza lo que debe especificarse, verificarse o desarrollarse. La [evaluación](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md) conserva evidencia y limitaciones; una regla acordada no equivale a una función operativa.

## Visión de producto

| Área         | Alcance objetivo                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| Acceso       | Docentes responsables de sus cursos y alumnos autorizados; autenticación separada de autorización      |
| Organización | Periodos, cursos, incorporación del padrón y matrícula vinculada al alumno correcto                    |
| Grupos       | Número y capacidad definidos por el docente; elección y cambios estudiantiles con ventana y cupo       |
| Registro     | Notas grupales 0–20, participantes por actividad, correcciones y pendientes                            |
| Consulta     | Puntos y notas correspondientes visibles al guardar, sin otra publicación                              |
| Reclamos     | Grupal por evaluación o privado por movimiento de puntos; recorrido final con respuesta docente        |
| Comunicación | Correo de aviso al docente por reclamo nuevo, sin contenido académico                                  |
| Exportación  | XLSX por curso, notas históricas por alumno y aplicación individual de puntos como supuesto del equipo |

La ventana puede reabrirse para todo el curso; no se diseña una excepción individual de selección. Los cambios no reasignan resultados pasados. La nota de cada actividad y el acceso a su reclamo corresponden a quienes participaron en ella.

Los puntos y las notas grupales siguen siendo registros distintos. El supuesto de exportación contempla aplicar puntos individualmente a trabajos de igual peso, con máximo de 20, sin alterar notas base ni consumir puntos al descargar. La regla completa y sus pendientes están en el caso; no se atribuye como una instrucción confirmada por el profesor.

No se reciben trabajos ni se administran sus plazos, no se integra con el SUM ni se exportan actas oficiales. El portafolio público existe en el repositorio, pero no forma parte del proceso académico seleccionado.

## Aplicación y referencia técnica

`portfolio-coursse/` contiene una aplicación Next.js con React y TypeScript; Supabase proporciona autenticación y PostgreSQL. Se mantiene una sola aplicación, sin justificar un servicio independiente por el mero hecho de añadir automatizaciones. Las normas de ingeniería están en la [constitución](../../.specify/memory/constitution.md).

Las interfaces de registro, importación, grupos y puntos son referencias de implementación candidata, no aceptación integral del producto objetivo. El panel estudiantil y la política de notas conservan el alcance previo sin consulta de notas. La presencia de una descarga XLSX no acredita atribución histórica ni el cálculo acordado de puntos. El [estado actual](../03-calidad-y-operacion/estado-actual.md) diferencia configuración, evidencia previa y trabajo pendiente.

El responsable ha referido Vercel como entorno de despliegue; no se inspeccionó su configuración ni producción en esta actualización documental. Existen configuración local y scripts de pruebas; su operación se debe comprobar de forma aislada antes de cerrar historias.

## Fuentes y precedencia de alcance

Las reglas nuevas se consolidaron a partir del relato y decisiones del responsable en el [plan de refinamiento](../../development/PLAN-REFINAMIENTO-PARTE-I.md). El material académico está en [development](../../development/README.md). La documentación de dominio de `docs/` refleja estos acuerdos; el código y la evidencia conservan su estado real.

Las especificaciones en `specs/001-manage-group-evaluation/` y las históricas en `portfolio-coursse/docs/` requieren revisión donde difieran del alcance acordado. No se implementarán selectivamente reglas contradictorias: primero se sincronizan artefactos y criterios de aceptación mediante el backlog, preservando la evidencia previa como histórica.

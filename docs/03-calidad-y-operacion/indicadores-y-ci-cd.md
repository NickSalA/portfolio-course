# Indicadores y estado de CI/CD

## Alcance y fuentes

El proyecto completo comprende **registro y seguimiento de evaluaciones grupales**: registro docente, consulta inmediata de resultados propios, reclamos, aviso al docente y exportación XLSX por curso, con funciones de apoyo de padrón, acceso y grupos. El XLSX del SUM carga alumnos al inicio del curso; no importa calificaciones ni la exportación integra el sistema con el SUM.

Los [objetivos completos](../../development/02-objetivos.md) y los [acuerdos vigentes](../../development/PLAN-REFINAMIENTO-PARTE-I.md) tienen prioridad sobre reglas anteriores incompatibles. El [caso de docs/01](../01-definicion/caso-evaluacion-grupal.md) necesita actualización y el trabajo pendiente debe recogerse en el [backlog](../04-gestion/backlog-y-responsabilidades.md). Las especificaciones externas antiguas requieren sincronización posterior; no se modifican aquí ni acreditan las ampliaciones como implementadas.

## Indicadores propuestos para la evaluación

Son propuestas de evaluación, no mediciones obtenidas ni metas numéricas aprobadas. Separar la calidad de PR y releases del funcionamiento académico.

| Indicador                                | Procedimiento y evidencia previstos                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tiempo de registro                       | Medir el mismo conjunto de evaluaciones y grupos con un procedimiento manual simulado y con la plataforma; comparar tiempos observados bajo condiciones equivalentes.                                                                                                                                                                            |
| Correspondencia entre nota e integrantes | Contrastar resultados con los participantes previstos de cada actividad, incluso tras cambios de grupo y correcciones posteriores.                                                                                                                                                                                                               |
| Consulta restringida e inmediata         | Tras confirmar el registro, comprobar que cada alumno consulta sus puntos y sus notas históricas sin publicación adicional; probar también la denegación de notas ajenas y que el grupo actual no concede acceso al historial de otros.                                                                                                          |
| Seguimiento de reclamos                  | Comprobar un reclamo por grupo/evaluación, presentación y consulta por participantes históricos y docente; un reclamo por movimiento de puntos propio, privado con el docente; estados Pendiente → En revisión → Respondido, respuesta final motivada, sin duplicados, réplica ni reapertura. La corrección favorable es expresa, no automática. |
| Aviso al docente                         | Registrar generación y envío del aviso por cada nuevo reclamo, destinatario y enlace, sin notas, puntos ni texto del reclamo. Distinguir envío, entrega y lectura; un fallo de correo no elimina el reclamo.                                                                                                                                     |
| Exactitud de la exportación XLSX         | Comparar resultados por alumno y curso con cálculos esperados; comprobar atribución histórica, puntos, pendientes y redondeo según las reglas siguientes.                                                                                                                                                                                        |
| Integridad y recuperación                | Contrastar registros esperados/guardados, rechazos de casos inválidos y reintentos sin duplicación; documentar errores y recuperación por escenario.                                                                                                                                                                                             |

### Reglas de cálculo que deben probarse

La aplicación académica de puntos es un **supuesto de trabajo del equipo, no confirmado por el profesor**. La distribución es automática y todos los trabajos tienen igual peso. Cada punto aumenta una unidad de nota individual donde exista margen, hasta 20 por trabajo, sin modificar notas grupales base ni resultados de compañeros. Los puntos se aplican una sola vez en el cálculo; no se suma el saldo completo a cada trabajo ni otra vez al promedio. El excedente sin margen no tiene efecto adicional y se conserva.

Para notas completas y saldo no negativo:

- Puntos aplicados = mínimo entre el saldo y la suma de márgenes hasta 20.
- Promedio ajustado = (suma de notas base + puntos aplicados) / número de trabajos.

Exportar no consume ni modifica el saldo. Repetir la exportación con iguales entradas mantiene los resultados académicos. Una nota pendiente permanece vacía, no equivale a cero; si faltan notas del conjunto incluido, no se presenta un promedio final ajustado completo. El promedio se redondea únicamente al final a dos decimales. No se necesita mostrar una distribución por trabajo para calcularlo. Quedan pendientes saldo negativo, movimientos incluidos, precisión de notas y columnas definitivas; no inventar reglas para cerrar esos casos.

### Protocolo y límites de la comparación

Preparar datos sintéticos o anonimizados, definir resultados esperados antes de ejecutar y registrar lo observado, diferencias, versión, fecha y entorno. Incluir cambios de grupo, notas pendientes, ceros explícitos, trabajos en 20, excedentes, reclamos duplicados, accesos ajenos y fallos de correo/guardado.

Para tiempos, acordar participantes, repeticiones, entradas, número de grupos, tareas, preparación y forma de resumir las mediciones. La reducción de tiempo es una hipótesis del equipo: no hay línea base histórica aportada ni dificultad temporal cuantificada y confirmada por el profesor. El procedimiento manual simulado no se presentará como desempeño anterior real del docente.

El seguimiento se contrasta con criterios funcionales de los escenarios: no existe una línea base histórica de consultas o reclamos que permita afirmar reducciones. No se fijan una mejora del 50 %, un umbral de dos segundos ni otras metas numéricas como acuerdos. “Inmediata” significa disponibilidad al confirmar el registro, sin una publicación posterior; no es una garantía de latencia medida.

## CI/CD: configuración observada y verificación pendiente

Inspección estática de los [workflows](../../.github/workflows/ci.yml), el [release](../../.github/workflows/release.yml) y el [paquete](../../portfolio-coursse/package.json):

| Elemento           | Configuración existente                                                                                                                                                                      | Lo que no demuestra                                                                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CI                 | PR y push a `main`; Node.js 22, pnpm 11.20.0, instalación con lockfile, lint, `next typegen`, `tsc --noEmit` y build desde `portfolio-coursse/`. El build usa URL local y clave placeholder. | No acredita checks aprobados, conexión a una base real, migraciones aplicadas, RLS correcta ni pruebas del proceso. No configura eventos para `develop`. |
| Release            | Push a `main`, instalación con lockfile y ejecución de semantic-release con `GITHUB_TOKEN`.                                                                                                  | No acredita release publicado, despliegue Vercel ni dependencia del resultado de CI; no declara esa espera.                                              |
| Scripts de pruebas | `test` (Vitest), `test:e2e` (Playwright) y `test:db` (Supabase), además de lint, typecheck y build.                                                                                          | Declarar comandos no prueba su ejecución, cobertura o aprobación. Los workflows actuales no invocan esos scripts de pruebas.                             |

Esta revisión no ejecutó los checks ni verificó runs remotos. La aplicación se reporta en Vercel según el responsable; previews, integración de ramas, secretos, protección y despliegues requieren comprobación independiente.

### Mejoras y evidencia pendientes

1. Ejecutar CI y conservar resultados por PR/versión. Configurar revisión cruzada y checks requeridos tras verificar su funcionamiento; si se adopta `develop`, ajustar los eventos explícitamente.
2. Incorporar pruebas del proceso y RLS en entorno aislado: lectura histórica propia permitida, acceso ajeno denegado, registro, reclamos, correo y exportación. Mantener revisión docente de reglas académicas.
3. Verificar previews con Supabase de prueba, variables separadas y sin secretos privilegiados expuestos a PR no confiables. Documentar cómo se autorizan releases, migraciones y despliegues, y si release debe esperar CI.
4. Registrar checks aprobados/fallidos, pruebas realmente ejecutadas y despliegues comprobados por separado de los indicadores académicos. Un pipeline verde no demuestra que una evaluación real se registró correctamente.
5. Completar señales, alertas y recuperación según los [controles operativos](controles-operativos.md), y reunir evidencia anonimizada en la [evaluación del proceso](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md).

CI/CD es un control de calidad complementario, no el proceso principal a evaluar. No afirmar calidad de producción ni eficacia del proyecto a partir de la mera existencia de YAML o scripts.

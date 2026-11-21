# Hoja de ruta: controles y evidencia operativa

**Estado:** controles propuestos y evidencia de ejecución pendiente. La inspección estática confirma workflows de CI y release; no demuestra checks aprobados, monitoreo, alertas, respaldos ni recuperación operativos. No se ha verificado la configuración de Vercel ni de Supabase productivo.

## 1. Alcance y prioridad de las reglas

Los controles cubren el proyecto completo de **registro y seguimiento de evaluaciones grupales**, no solo el guardado docente. Rigen los [acuerdos vigentes](../../development/PLAN-REFINAMIENTO-PARTE-I.md) y los [objetivos del proyecto](../../development/02-objetivos.md) frente a exclusiones anteriores incompatibles. El [caso de docs/01](../01-definicion/caso-evaluacion-grupal.md) requiere actualización y las tareas deben reflejarse en el [backlog y responsabilidades](../04-gestion/backlog-y-responsabilidades.md). Esa sincronización queda pendiente; las especificaciones externas antiguas no se consideran confirmación de las reglas nuevas ni se modifican aquí.

## 2. Separar pruebas de producción

- Preparar Supabase local para migraciones, RLS y pruebas repetibles con datos sintéticos. No ejecutar pruebas destructivas ni `db reset` contra producción.
- Para previews compartidos, utilizar un proyecto Supabase de prueba, separar claves y verificar variables y redirects de OAuth. Asignar responsable de variables y migraciones; registrar el entorno en el PR sin secretos ni identificadores sensibles.

**Criterio de salida:** ejecutar migraciones desde cero y pruebas de autorización en un entorno aislado, y verificar que la preview no apunta a producción.

## 3. Checks y pruebas del proceso

El [workflow CI](../../.github/workflows/ci.yml) configura instalación con lockfile, lint, generación de tipos de Next.js, TypeScript y build desde `portfolio-coursse/`, en PR y push a `main`. El [workflow de release](../../.github/workflows/release.yml) configura semantic-release en push a `main`. Su existencia no acredita ejecución exitosa, protección de ramas ni despliegue. Los [scripts del paquete](../../portfolio-coursse/package.json) incluyen pruebas unitarias, E2E y de base de datos, pero CI no las invoca actualmente.

Añadir y ejecutar pruebas representativas antes de declarar cobertura:

- **Permisos e historia:** permitir al estudiante consultar inmediatamente, tras confirmar el registro y sin publicación separada, sus puntos y las notas de las actividades en las que participó. Probar autorización en servidor/RLS, no solo ocultación en UI. Negar notas ajenas y acceso por mera pertenencia actual a otro grupo; un cambio de grupo conserva los resultados históricos propios. Solo el docente autorizado del curso modifica notas y puntos.
- **Registro:** comprobar curso, evaluación, grupo, pertenencia histórica y rango de nota de 0 a 20, correcciones y reintentos sin duplicación. Distinguir nota pendiente vacía de cero registrado. Resolver con revisión docente las ambigüedades temporales, sin inventar un traslado directo docente adicional.
- **Reclamos:** permitir un único reclamo por grupo/evaluación a cualquiera de los participantes históricos y su consulta por esos participantes y el docente. El reclamo sobre un movimiento de puntos propio es único y privado entre alumno y docente. Probar **Pendiente → En revisión → Respondido**, decisión final motivada, sin duplicado, réplica ni reapertura. Una respuesta favorable requiere corrección docente expresa, no cambia automáticamente notas o puntos.
- **Correo:** cada nuevo reclamo genera aviso al docente responsable con enlace y sin notas, puntos ni texto del reclamo. Comprobar acceso autorizado al abrir el enlace y distinguir generación, envío, entrega y lectura. Si falla el correo, el reclamo permanece registrado; la recuperación detallada sigue pendiente. No añadir avisos al alumno, recordatorios ni escalamiento.
- **Exportación XLSX por curso:** verificar atribución histórica por alumno y cálculo con puntos como **supuesto de trabajo del equipo, no confirmado por el profesor**: aplicación automática, trabajos de igual peso, una unidad de nota por punto con margen y máximo de 20 por trabajo, sin reutilizar el saldo en cada trabajo o añadirlo otra vez al promedio. No alterar notas base ni resultados de compañeros; conservar el excedente sin efecto adicional. Exportar no consume ni modifica puntos y con iguales entradas conserva resultados académicos. Las notas pendientes permanecen vacías y, si faltan notas, no se presenta un promedio final ajustado completo. Redondear solo al final a dos decimales. Saldo negativo, movimientos incluidos, precisión de notas y columnas definitivas requieren definición previa a cerrar las pruebas.

**Criterio de salida:** conservar resultados por escenario con esperado/observado, versión/PR, fecha y entorno; demostrar casos permitidos y denegados, fallos y recuperación sin datos personales. Registrar los checks realmente ejecutados, no inferirlos del YAML.

## 4. Señales y alertas del proceso

- Definir eventos estructurados para registro/corrección de notas y puntos, reclamos, aviso al docente y exportación: resultado, categoría de error, instante e identificador de correlación/reintento no personal. Evitar nombres, correos, notas, puntos, motivos privados, texto de reclamos y secretos en logs públicos. Conservar trazabilidad académica y decisiones en almacenamiento de acceso restringido según el tipo de registro.
- Habilitar captura de errores del servidor y de base de datos con retención y acceso restringidos. Acordar responsable, canal y umbrales de alerta después de observar ejecuciones; no inventar tasas actuales ni confundir alertas técnicas con el correo funcional de reclamo.
- Conciliar registros esperados y guardados por curso/evaluación, participantes históricos, duplicados y resultados exportados. Aplicar el protocolo de [indicadores](indicadores-y-ci-cd.md); un check de CI no prueba que las notas reales llegaron a su destino.

**Criterio de salida:** provocar fallos y éxitos en pruebas, localizar señales sin datos sensibles y verificar la recepción de una alerta por el responsable, con fecha y resultado.

## 5. Respaldos, restauración y respuesta a incidentes

- Antes de cambiar producción, verificar el plan de Supabase: existencia, frecuencia, retención, alcance y restauración de respaldos. Definir quién puede recuperar y documentar accesos fuera del repositorio; no asumir respaldos por usar el proveedor.
- Acordar periodicidad, retención, objetivo de pérdida máxima de datos (RPO) y tiempo de recuperación (RTO). Mantener datos personales y secretos fuera de evidencias públicas.
- Ensayar restauración solo en entorno aislado. Verificar cursos, evaluaciones, participación histórica, notas, movimientos de puntos, reclamos y respuestas, integridad y permisos de consulta. Una copia generada no acredita restauración.
- Documentar detección, contención, aviso al responsable, alcance, restauración/conciliación y causa. Incluir guardados parciales, reintentos sin duplicados y estado del aviso por correo.

**Criterio de salida:** constancia de restauración con fecha, entorno, tiempo, resultado y discrepancias; RPO/RTO acordados y responsable identificado.

## 6. Evidencia para el trabajo final

Registrar diseño, pruebas, señales, errores y conclusiones en la [evaluación del proceso](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md). La comparación temporal será contra un procedimiento manual **simulado**, no una línea base histórica real del docente. El seguimiento se evalúa contra escenarios funcionales esperados, sin inventar una línea base de reclamos. Hasta contar con comprobaciones, indicar controles y resultados como pendientes; no anunciar disponibilidad, porcentajes de mejora ni éxito operativo.

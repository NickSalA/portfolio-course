# Hoja de ruta: controles y evidencia operativa

**Estado:** propuesta para el equipo. El responsable confirmó que todavía no dispone de
monitoreo, alertas, respaldos o procedimientos de recuperación adicionales documentados. No se
ha verificado la configuración de Vercel ni de Supabase productivo. Nada de lo siguiente está
implantado o medido por el hecho de estar descrito aquí.

## 1. Separar pruebas de producción

- Preparar Supabase local para migraciones, RLS y pruebas repetibles siguiendo la
  [guía de entorno aislado](entorno-de-pruebas-supabase.md); usar solo datos sintéticos.
- Cuando se necesiten previews compartidos, crear otro proyecto Supabase, limitar sus claves a
  Vercel Preview y verificar variables y redirects antes de probar OAuth. No ejecutar pruebas
  destructivas ni `db reset` contra producción.
- Asignar una persona responsable de las variables y migraciones de cada entorno; registrar en
  el PR qué proyecto de pruebas se utilizó, sin incluir identificadores sensibles ni claves.

**Criterio de salida:** ejecutar las migraciones de cero y las pruebas de autorización en un
entorno aislado, y verificar manualmente que una preview no apunta a la base productiva.

## 2. Checks de integración y pruebas del proceso

- Crear un workflow de GitHub Actions para PR hacia `develop` y `main`: instalar con el lockfile,
  ejecutar `pnpm lint`, `pnpm exec tsc --noEmit` y `pnpm build` en `portfolio-coursse/`. Usar
  variables públicas **del entorno de prueba** solo si el build las requiere; no proporcionar
  secretos privilegiados a PR de terceros. Configurar protección de ramas y checks requeridos
  después de verlos funcionar.
- Añadir pruebas automatizadas representativas: migraciones en Supabase local, RLS por rol y
  curso (alumno sin `SELECT` sobre notas, docente autorizado solo para su curso), validación de
  rango y pertenencia, reintentos y fallos de guardado. Para la extensión de
  notas, cubrir los [casos de traslado y corrección](../02-diseno/modelo-datos.md). Mantener una
  revisión manual del docente para las reglas académicas, no solo checks técnicos.
- Guardar resultados de checks y pruebas con versión/PR, fecha, entorno y datos anonimizados;
  distinguir evidencia de calidad del código de evidencia de ejecución de evaluaciones.

**Criterio de salida:** un PR de prueba falla si se rompe una validación o permiso, y otro pasa
con la corrección; los resultados quedan accesibles al equipo sin datos personales.

## 3. Señales y alertas del proceso de notas

- Definir eventos estructurados para intentar registrar/corregir una nota: evaluación y curso
  identificados de forma no personal, resultado (éxito/rechazo/error), categoría del error,
  instante y un identificador de correlación/reintento. Evitar nombres, correos, motivos de
  excepciones individuales, calificaciones o secretos en logs públicos. Mantener la razón y
  trazabilidad de correcciones en almacenamiento académico con permisos docentes.
- Habilitar en el proveedor que el equipo elija la captura de errores del servidor y de base
  de datos, con retención y acceso restringidos. Establecer responsable, canal y umbral de
  alerta para fallos de guardado, fallos repetidos de autenticación/autorización y errores de
  migración; acordar umbrales tras observar la línea base, no inventar tasas actuales.
- Conciliar por curso y evaluación la cantidad de grupos previstos frente a notas guardadas;
  revisar faltantes y duplicados, y medir tiempos/correcciones con el protocolo de
  [indicadores](indicadores-y-ci-cd.md). No usar un check de CI como prueba de que las notas
  reales llegaron a su destino.

**Criterio de salida:** en pruebas, provocar un guardado fallido y uno exitoso, localizar sus
señales sin datos sensibles y demostrar que la alerta llega a la persona responsable; guardar
fecha y resultado de la comprobación.

## 4. Respaldos, restauración y respuesta a incidentes

- Antes de cambiar el esquema productivo, revisar el plan de Supabase contratado: confirmar si
  hay respaldos, frecuencia, retención, alcance y posibilidad de restauración. Definir quién
  puede iniciar una recuperación y dónde guardar la documentación de acceso fuera del repo. No
  asumir que un respaldo existe solo por usar Supabase.
- Definir una política acorde con el riesgo y el plan disponible: periodicidad y retención,
  objetivo máximo de pérdida de datos (RPO) y tiempo de recuperación (RTO), con aprobación del
  equipo/docente. Mantener datos de alumnos y secretos fuera de repositorios y evidencias públicas.
- Ensayar restauración en un **proyecto aislado**, verificar integridad de cursos, evaluaciones,
  notas y autorizaciones, permisos RLS y capacidad de reanudar el servicio. Nunca usar producción
  para ensayos destructivos ni dar por probada una restauración solo por generar una copia.
- Escribir un procedimiento breve: detectar, detener cambios si procede, avisar al responsable,
  registrar el alcance y la hora, restaurar/reconciliar y documentar la causa y acciones. Incluir
  respuesta a un guardado parcialmente fallido o repetido sin duplicar registros.

**Criterio de salida:** constancia de una restauración de prueba con fecha, entorno, tiempo,
resultado y discrepancias; RPO/RTO acordados y responsable de activación identificado.

## 5. Evidencia para el trabajo final

Al implementar el flujo, registrar diseño, pruebas ejecutadas, métricas comparadas con una línea
base manual, errores, señales y conclusiones en
`docs/automatizaciones/<nombre-del-proceso>/evaluacion.md` según la
[constitución](../../.specify/memory/constitution.md). Hasta tener ejecuciones comprobadas,
reportar cada control como **pendiente**; no anunciar disponibilidad ni porcentajes de éxito.

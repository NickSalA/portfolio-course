# Indicadores y opciones de CI/CD

**Estado:** propuestas para especificar y validar con el docente; no son funcionalidades,
mediciones ni pipelines implementados. La aplicación está en Vercel según el responsable, pero el
repositorio no contiene actualmente CI ni pruebas automatizadas configuradas.

## KPIs candidatos para el proceso académico

El flujo principal elegido es la [gestión de evaluación grupal](../01-definicion/caso-evaluacion-grupal.md):
organizar alumnos en grupos y registrar sus notas por evaluación para el docente. El XLSX del
SUM se recibe al inicio del curso para cargar alumnos; **no** importa calificaciones. Medir el
flujo académico por separado de la calidad de los PR y despliegues.

| Indicador                      | Cálculo y evidencia sugeridos                                                                                                                 | Para qué sirve                                                    |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Tiempo por curso/evaluación    | Mediana de minutos para identificar grupos y registrar notas en el XLSX/registro manual frente a la plataforma, con igual cantidad de grupos. | Medir trabajo repetitivo ahorrado.                                |
| Correcciones o duplicados      | Número de notas o asignaciones de grupo que requieren corrección / total registrado, con motivos clasificados.                                | Medir validación y errores.                                       |
| Cobertura de registro          | Grupos con la nota esperada registrada / grupos que debían recibirla en la evaluación.                                                        | Detectar omisiones.                                               |
| Tiempo de conciliación         | Minutos para verificar que grupos, notas y puntos corresponden al curso y a sus alumnos frente a las fuentes originales.                      | Medir la reducción de registros dispersos.                        |
| Reintentos sin duplicación     | Reintentos que producen el estado esperado sin registros duplicados / reintentos probados.                                                    | Demostrar control y recuperación.                                 |
| Casos excepcionales detectados | Casos inválidos detectados y comunicados / casos inválidos previstos en un conjunto de prueba.                                                | Evaluar manejo de errores; especificar los casos antes de probar. |

Para comparar, emplear tareas equivalentes, un volumen conocido y datos sintéticos o
anonimizados; repetir las mediciones y registrar número de casos, condiciones y método. Un
objetivo **tentativo** es reducir el tiempo mediano por operación al menos un 50 % y detectar el
100 % de los casos inválidos definidos en la batería de pruebas. El docente y el equipo deben
confirmar si esos umbrales son realistas tras medir la línea base; no presentarlos como logros.

## CI/CD recomendado para Git Flow + Vercel

1. **PR a `develop`:** usar GitHub Actions para instalar dependencias con lockfile y ejecutar
   `pnpm lint`, comprobación TypeScript y `pnpm build` desde `portfolio-coursse/`. Una vez
   incorporadas pruebas reales, ejecutar también pruebas unitarias y de integración. Proteger
   `develop` con revisión y checks requeridos. `pnpm build` necesitará variables públicas de
   Supabase válidas para el entorno de prueba; no exponer credenciales privilegiadas a PR no
   confiables.
2. **Vista previa:** si la integración Git–Vercel está activada, usar previews de PR para revisar
   interfaz y flujos con un proyecto Supabase de prueba aislado. Confirmar esa integración antes
   de documentar previews como algo existente.
3. **Release a `main`:** validar el PR desde `release/<version>`, aplicar migraciones de forma
   controlada sobre el entorno correcto, etiquetar la versión y desplegar producción en Vercel
   solo desde `main` con aprobaciones y secretos separados. Confirmar antes cómo está conectado
   Vercel a ramas de Git y qué medidas de recuperación existen.
4. **Calidad de PR:** establecer checks obligatorios de lint, tipos, build y, cuando existan,
   pruebas sobre reglas de notas, cambios de grupo y RLS. Medir PR con checks aprobados / PR
   integrados y fallos detectados antes de integrar. Revisar manualmente reglas académicas y
   migraciones; ningún pipeline garantiza que nunca se integre un defecto.
5. **Evidencia y monitoreo del proceso:** conservar resultados de checks, pruebas, despliegues y
   errores de ejecución, además de un resumen anonimizado de la gestión de notas. Un check verde
   prueba la calidad de código evaluada por esos checks; **no** demuestra que la asignación real
   de notas se ejecutó bien. El proceso académico necesita su propia evidencia y señales de
   errores/resultado.

Es recomendable comenzar con CI de lint, tipos y build, y agregar pruebas automatizadas del
proceso elegido y RLS en un entorno aislado antes de hablar de cobertura o calidad de producción.
En este trabajo, CI/CD se plantea como práctica de calidad de la automatización académica,
no como el caso principal. Aunque la guía permite presentar CI/CD como proyecto independiente,
crear un workflow de GitHub Actions no demuestra automáticamente que la gestión de notas esté
automatizada, monitoreada y evaluada. No existen aún estos checks ni métricas implementadas. La secuencia de implementación,
alertas y verificación de respaldos/restauración se detalla en
[controles operativos](controles-operativos.md).

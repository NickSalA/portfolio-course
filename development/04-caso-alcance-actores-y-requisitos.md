# 4. Caso de aplicación, alcance, actores y requisitos

## 4.1 Proceso de inicio a fin

1. El docente autenticado prepara un periodo y un curso bajo su responsabilidad.
2. Importa desde el XLSX/CSV institucional una relación de alumnos; revisa filas válidas, inválidas, repetidas y existentes.
3. El sistema autoriza y vincula únicamente identidades coincidentes con el curso.
4. El docente crea grupos y habilita una ventana de selección.
5. El alumno autorizado selecciona un grupo con cupo; fuera de la ventana solo el docente puede efectuar un traslado administrativo.
6. Cada selección o traslado conserva un intervalo temporal de pertenencia.
7. El docente define una evaluación grupal y su instante de realización.
8. Registra una nota entre 0 y 20 para cada pareja grupo-evaluación del mismo curso.
9. Si corrige una nota, el sistema conserva el cambio y aplica la atribución al grupo histórico de la actividad.
10. El docente concilia los grupos esperados frente a notas y excepciones.
11. La evidencia anonimizada permite explicar éxitos, rechazos, fallos y reintentos.

## 4.2 Actores

- **Docente:** administra únicamente sus cursos, importa alumnado, gestiona grupos, evaluaciones, notas, correcciones y conciliación.
- **Alumno:** se vincula a cursos autorizados, consulta su grupo vigente y puntos, y selecciona grupo dentro de la ventana. No consulta notas grupales en esta entrega.
- **Sistema:** autentica, autoriza, valida, conserva historia, evita duplicados, comunica estados y produce evidencia segura.

## 4.3 Priorización MoSCoW resumida

### Must

Autenticación con Google; autorización por rol y curso; preparación de periodos/cursos; importación y matrícula controladas; grupos con historia; evaluaciones con instante; notas 0–20; corrección trazable; reintentos sin duplicación; vistas restringidas; separación entre puntos y notas; pruebas con datos sintéticos; evidencia y comparación con línea base.

### Should

Vista previa detallada de importación, filtros de conciliación, alertas de fallos repetidos y verificación de recuperación en entorno aislado.

### Could

Búsqueda avanzada, resumen visual, descarga de evidencia anonimizada y ayudas contextuales.

### Won't

Exportación oficial, corrección individual, notificaciones, panel administrativo separado, nuevos tipos de nota, respaldo automático no verificado, funciones generales de LMS, importación de notas y pruebas destructivas en producción.

## 4.4 Historias de usuario

| Historia | Prioridad | Resultado independiente |
|---|---:|---|
| US1 Preparar curso y alumnado | P1 | Importación mixta, autorización y matrícula sin duplicados ni cruces de curso. |
| US2 Organizar grupos con historia | P1 | Selección/traslado con intervalos no solapados y resolución temporal. |
| US3 Registrar y corregir notas | P1 | Nota única, rango válido, reintento idempotente y corrección auditable. |
| US4 Consultar y conciliar | P2 | Vista docente de completos/faltantes/excepciones y vista estudiantil restringida. |
| US5 Evaluar frente al proceso manual | P2 | Mediciones comparables, repetidas y documentadas sin inventar mejoras. |

## 4.5 Requisitos funcionales agrupados

- **Identidad y acceso (FR-001–FR-005):** autenticación Google, autorización diferenciada, propiedad del curso, comprobación en servidor y RLS.
- **Importación y matrícula (FR-006–FR-010):** validación por fila, reejecución sin duplicados, vinculación por identidad autorizada y matrícula única.
- **Grupos e historia (FR-011–FR-017):** gestión por curso, ventana, traslado docente, intervalos atómicos y resolución por instante y zona horaria.
- **Evaluaciones y notas (FR-018–FR-027):** instante académico, impacto de cambios, nota única 0–20, coherencia de curso, reintentos, correcciones y exclusión de la excepción individual.
- **Puntos y vistas (FR-028–FR-032):** separación semántica, anulación no destructiva y visibilidad por actor.
- **Estados y evidencia (FR-033–FR-039):** estados explícitos, eventos relevantes, señales seguras, auditoría restringida, conciliación y etiquetado honesto del nivel de evidencia.

## 4.6 Requisitos no funcionales

Seguridad por mínimo privilegio; privacidad; integridad transaccional; accesibilidad de teclado y formularios; objetivo de rendimiento medible; recuperación ante resultados inciertos; observabilidad correlacionable; mantenibilidad por PR acotados; entornos aislados; conservación de la arquitectura base.

## 4.7 Casos críticos

### Válidos

- notas límite 0 y 20;
- selección de grupo dentro de ventana y con cupo;
- traslado docente con instante explícito;
- corrección del grupo anterior después de un traslado;
- repetición exacta de una operación ya confirmada.

### Inválidos

- nota vacía, no numérica, menor que 0 o mayor que 20;
- grupo y evaluación de cursos distintos;
- alumno no autorizado;
- docente ajeno;
- selección fuera de ventana;
- reutilización del mismo ID de operación con otro contenido.

### Excepcionales

- concurrencia por el último cupo;
- fallo antes o después de la confirmación;
- actividad y traslado el mismo día;
- cambio de fecha con atribuciones afectadas;
- historial previo imposible de reconstruir;
- ausencia de señal operativa.

La respuesta ante incertidumbre es marcarla y revisarla; nunca inventar pertenencias o fechas históricas.

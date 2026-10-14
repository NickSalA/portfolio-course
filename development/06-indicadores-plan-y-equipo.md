# 6. Indicadores propuestos, plan de implementación y equipo

## 6.1 Protocolo de evaluación previsto

En Parte II se comparará el proceso manual y la plataforma con la misma actividad, el mismo volumen de grupos y un conjunto sintético o anonimizado. Se prevén al menos tres repeticiones completas por método, salvo limitación justificada. Antes de medir se fijarán volumen, zona horaria, condiciones y matriz de casos. Ninguna mejora se declara antes de ejecutar el protocolo.

## 6.2 Indicadores propuestos

| Indicador | Cálculo previsto | Evidencia necesaria |
|---|---|---|
| Tiempo por evaluación | Mediana de minutos desde disponer de datos hasta concluir registro y conciliación. | Cronometraje por repetición, volumen y condiciones. |
| Completitud | Grupos con nota válida o excepción explícita / grupos esperados. | Conteo conciliado y faltantes. |
| Correcciones o duplicados | Registros corregidos y duplicados / operaciones confirmadas. | Historia y reporte de duplicados. |
| Tiempo de conciliación | Minutos para verificar curso, actividad, grupos, notas y separación de puntos. | Inicio, fin y discrepancias. |
| Reintentos sin duplicación | Reintentos con un único estado final correcto / reintentos ejecutados. | Correlación entre fallo, reintento y estado. |
| Detección de excepciones | Casos inválidos detectados / casos inválidos planificados. | Matriz de casos y resultado observado. |

La reducción del 50 % de la mediana de tiempo y la detección del 100 % de casos definidos son **metas tentativas**, no resultados. La meta de dos segundos para el 95 % de confirmaciones interactivas también requiere medición local con volumen acordado.

## 6.3 Plan resumido por fases

| Fase | Resultado | Estado al revisar `tasks.md` |
|---|---|---|
| 1. Base de pruebas y evidencia | Inventario, dependencias de prueba, fixtures, configuración y comandos. | T001–T006 marcadas como completadas en el backlog; su evidencia final debe revisarse antes de citarla. |
| 2. Fundamentos | Libro de operaciones, idempotencia, resultados tipados, señales y autorización. | Pendiente. |
| 3. US1 Preparación | Curso, importación, autorización y matrícula verificables. | Pendiente. |
| 4. US2 Historia de grupos | Intervalos, selección, traslado, cupo y resolución temporal. | Pendiente. |
| 5. US3 Notas | Actividad fechada, integridad, reintento y correcciones. | Pendiente. |
| 6. US4 Conciliación | Completos, faltantes, excepciones y vista estudiantil restringida. | Pendiente. |
| 7. US5 Evaluación | Protocolo, ejecuciones manuales/plataforma e indicadores. | Pendiente. |
| 8. Validación transversal | Accesibilidad, rendimiento, privacidad, suites y cierre documental. | Pendiente. |

Las 74 tareas completas permanecen en `specs/001-manage-group-evaluation/tasks.md`; en el cuerpo del PDF basta este resumen y una referencia al anexo.

## 6.4 Dependencias

La fase fundamental depende de la base de pruebas y bloquea las mutaciones de negocio. La historia de grupos es requisito para atribuir notas históricas. La conciliación depende de grupos y notas. Las plantillas de medición pueden prepararse temprano, pero las mediciones solo se ejecutarán sobre comportamiento estable.

## 6.5 Organización de cinco integrantes

| Integrante | Responsabilidad primaria | Resultado principal |
|---|---|---|
| Integrante 1 | Coordinación y dominio | Alcance, preparación, reglas y reconciliación de requisitos. |
| Integrante 2 | Aplicación y experiencia | Flujos, estados, accesibilidad y pruebas de navegador. |
| Integrante 3 | Datos y seguridad | Migraciones, funciones, integridad, RLS e historia. |
| Integrante 4 | Calidad y automatización | Fixtures, pruebas SQL/unitarias/E2E y CI. |
| Integrante 5 | Operación y documentación | Señales, protocolo, mediciones y entregables. |

Los rótulos son vacantes hasta que el equipo registre nombres. Una responsabilidad primaria no crea silos. Cada issue debe tener responsable y revisor distintos; nadie aprueba su propio PR.

## 6.6 Flujo de trabajo y terminado

Se usa Git Flow: ramas `feature/*` o `bugfix/*` parten de `develop`, pasan por PR revisado y regresan a `develop`; las versiones se preparan en `release/*` y llegan a `main` después de validación. Los commits siguen Conventional Commits.

Una tarea se considera terminada solo si sus criterios se ejecutaron en un entorno aislado, el PR fue revisado, los checks aplicables aprobaron y la evidencia registra fecha, versión, entorno, datos y resultado. La existencia de código o documentación no es suficiente.

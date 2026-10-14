# Automatización y control de la gestión de evaluación grupal

## Documento de trabajo para el informe de Parte I

> **Estado:** borrador académico derivado de la especificación, el diseño y el diagnóstico del repositorio. Describe propuestas y trabajo pendiente; no presenta métricas de mejora ni implementación completa como resultados.

## Carátula pendiente

- Universidad: Universidad Nacional Mayor de San Marcos
- Curso: [completar]
- Título: Automatización y control de la gestión de evaluación grupal
- Docente: [completar]
- Integrantes: [completar]
- Periodo y fecha: [completar]

## Índice propuesto

1. Introducción
2. Objetivos
3. Marco teórico
4. Caso de aplicación
5. Arquitectura y modelo de datos
6. Seguridad y controles
7. Indicadores y plan de implementación
8. Organización del equipo
9. Estado actual y brechas
10. Conclusiones
11. Recomendaciones
12. Bibliografía
13. Anexos

## 1. Introducción

Un docente de la UNMSM gestionaba las calificaciones en XLSX y mantenía por separado la composición de grupos y los puntos individuales. Al inicio del curso recibe del SUM un archivo con alumnos, que sirve para preparar el padrón autorizado, no para importar notas. La dispersión obliga a conciliar manualmente curso, grupos y evaluaciones y dificulta explicar una calificación cuando un alumno cambia de grupo.

Este trabajo diseña una automatización controlada dentro de la aplicación Next.js, Supabase y PostgreSQL existente. El proceso comprende preparación del curso, incorporación de alumnos, organización temporal de grupos, definición de evaluaciones, registro y corrección de notas grupales y conciliación docente. Automatizar significa aquí aplicar reglas, permisos, estados, validaciones, tratamiento de fallos, reintentos y evidencia; no solo digitalizar una pantalla.

La Parte I desarrolla el análisis, alcance, arquitectura, modelo de datos, estrategia de pruebas, indicadores y organización. La Parte II deberá implementar, ejecutar pruebas y comparar el desempeño con el método manual. Por ello, metas y controles pendientes se presentan como propuestas.

## 2. Objetivos

### Objetivo general

Diseñar una automatización controlada para la evaluación grupal que integre preparación, grupos históricos, notas y conciliación, y que aplique seguridad, integridad, trazabilidad y recuperación dentro de la arquitectura existente.

### Objetivos específicos

- modelar actores, límites, reglas y excepciones del proceso;
- conservar la pertenencia al grupo correspondiente al instante de cada actividad;
- validar notas de 0 a 20 y coherencia de curso;
- separar autenticación de autorización académica;
- evitar duplicados mediante operaciones idempotentes;
- preservar correcciones y evidencia;
- diseñar pruebas con datos sintéticos y entorno aislado;
- definir indicadores comparables y distribuir el trabajo entre cinco integrantes.

## 3. Marco teórico

La gestión de procesos incluye identificación, modelado, análisis, rediseño, implementación y monitoreo (Dumas et al., 2018). Así, automatizar un proceso académico implica expresar reglas y estados, no únicamente trasladar el XLSX a una interfaz. La transformación digital universitaria también involucra capacidades, personas y gobierno de datos (Benavides et al., 2020; OECD, 2023).

La evaluación grupal presenta problemas de atribución. La literatura de evaluación por pares muestra que el método y los criterios influyen en los resultados (Falchikov & Goldfinch, 2000; Lejk & Wyvill, 2001). Este proyecto no calcula una nota individual desde puntos: mantiene la nota grupal y conserva el contexto histórico; la excepción individual se reserva para una etapa posterior.

La integridad se respalda con restricciones, relaciones y transacciones. La idempotencia permite que un reintento conserve un único efecto pretendido (Fielding et al., 2022). En seguridad, autenticar no equivale a autorizar: RBAC organiza permisos por roles (Sandhu et al., 1996), pero también se debe comprobar la responsabilidad concreta sobre el curso. Servidor y RLS aplican defensa en profundidad y mínimo privilegio (Joint Task Force, 2020).

La trazabilidad académica conserva valores anterior y nuevo, responsable e instante; las señales operativas solo contienen identificadores y categorías no sensibles. Las pruebas combinan base de datos, unidad y navegador (Bertolino, 2007). WCAG 2.2 guía teclado, foco, etiquetas y errores. La Ley N.º 29733 exige finalidad, proporcionalidad y seguridad en el tratamiento de datos, por lo que las pruebas usarán datos sintéticos.

## 4. Caso de aplicación

El docente prepara el curso, importa alumnado, crea grupos y habilita una ventana de selección. Cada pertenencia se representa como un intervalo temporal. La evaluación registra su instante académico. El docente guarda una nota por grupo y evaluación; el sistema comprueba rango, propiedad y coherencia de curso. Una corrección conserva historia y se atribuye a quienes pertenecían al grupo en la fecha de la actividad. Finalmente se concilian grupos esperados, notas y excepciones.

Son actores el docente, el alumno y el sistema. El docente opera solo sobre sus cursos. El alumno accede a cursos autorizados, grupo vigente y puntos, pero no a notas grupales. El sistema aplica validaciones, conserva historia y comunica estados.

Las capacidades Must incluyen autenticación, autorización, importación, matrícula, grupos históricos, evaluaciones fechadas, notas 0–20, correcciones, reintentos, vistas restringidas, pruebas y evidencia. Quedan fuera exportación oficial, correcciones individuales, notificaciones, nuevos tipos de nota, LMS general y pruebas destructivas en producción.

Los casos críticos incluyen notas límite, traslados antes o después de una actividad, actividad y traslado el mismo día, último cupo concurrente, cambio de fecha, fallo con respuesta incierta y acceso cruzado. Los datos históricos ambiguos se marcan para revisión; no se inventan.

## 5. Arquitectura y modelo de datos

La solución mantiene una sola aplicación. React recoge datos y presenta estados; las acciones de servidor autentican y orquestan; PostgreSQL aplica invariantes y RLS. Esta división evita un servicio adicional sin necesidad demostrada.

El modelo actual conserva solo el grupo vigente. La propuesta añade: historia temporal de pertenencias, instante de actividad, auditoría inmutable de correcciones, libro de operaciones idempotentes, conciliaciones y excepciones grupales. Una matrícula no puede tener intervalos solapados; grupo y evaluación deben pertenecer al mismo curso; la nota está entre 0 y 20; los puntos permanecen separados.

La migración será aditiva. Los datos históricos solo se reconstruyen cuando existe evidencia; las evaluaciones legadas sin fecha deben revisarse. Los grupos necesarios para explicar resultados no se eliminan físicamente.

## 6. Seguridad y controles

El inicio de sesión Google identifica a la persona, pero el servidor debe comprobar rol y propiedad del curso. RLS restringe las filas, mientras restricciones y funciones transaccionales protegen reglas incluso fuera de la interfaz. El navegador no recibe secretos y las señales no incluyen nombres, correos ni notas.

Para Parte II se proponen pruebas SQL de RLS e integridad, pruebas TypeScript, recorridos de navegador, revisión WCAG, señales estructuradas, conciliación y CI. Respaldos y restauración requieren verificación separada del proveedor. Estos controles no se presentan como implementados por estar descritos.

## 7. Indicadores y plan

Se compararán al menos tres ejecuciones manuales y tres de plataforma con datos y volumen equivalentes. Se medirán mediana de tiempo, completitud, correcciones/duplicados, tiempo de conciliación, reintentos sin duplicación y detección de excepciones. La meta tentativa es reducir 50 % el tiempo y detectar 100 % de casos definidos; no es un resultado de Parte I.

El backlog tiene ocho fases: base de evidencia; controles fundamentales; preparación; historia de grupos; notas; conciliación; evaluación comparativa; y validación transversal. El detalle de las 74 tareas se adjunta o enlaza.

## 8. Organización del equipo

Cinco áreas distribuyen coordinación/dominio, experiencia, datos/seguridad, calidad y operación/evidencia. Cada issue tiene un responsable y un revisor distinto. Se emplean Git Flow, PR revisados, Conventional Commits y evidencia asociada. Los nombres deben sustituir a los identificadores de integrante solo después del acuerdo del equipo.

## 9. Estado actual y brechas

Se verificó localmente la aplicación de migraciones `0001`–`0029` y una prueba RLS de notas con datos sintéticos. Esta prueba negó lectura estudiantil, aisló cursos y rechazó una combinación entre cursos. No prueba producción ni el flujo completo.

Permanecen pendientes la historia temporal, la fecha académica, la auditoría de correcciones, el contrato integral de idempotencia, la conciliación, la batería completa, CI, monitoreo y mediciones. El inventario de evaluación es una línea de partida, no una evaluación final.

## 10. Conclusiones

El proceso es automatizable porque combina repetición y reglas verificables. Su núcleo no es la pantalla de captura, sino la atribución temporal y la explicación de cambios. La arquitectura actual puede resolverlo con límites profundos y sin otro servicio. Seguridad, integridad e idempotencia deben implementarse en fronteras confiables. Parte I deja una base trazable; demostrar mejoras depende de pruebas y mediciones posteriores.

## 11. Recomendaciones

Confirmar zona horaria, formato de importación, volumen y protocolo antes de implementar; priorizar historia e idempotencia; no inferir datos legados; probar RLS directamente; separar auditoría y logs; verificar recuperación antes de prometerla; medir accesibilidad y rendimiento; y derivar todo resultado de Parte II de evidencia ejecutada.

## 12. Bibliografía

Usar la lista APA 7 y las fichas de `08-bibliografia-y-fichas.md`. Comprobar páginas, ediciones, fechas de consulta y texto jurídico oficial antes del cierre.

## 13. Anexos

Incluir trazabilidad, MoSCoW, diagramas, resumen del backlog, línea de partida, evidencia RLS local e instrumentos previstos para Parte II. El inventario inicial debe rotularse expresamente como diagnóstico y no como resultado final.

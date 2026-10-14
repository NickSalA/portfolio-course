# 7. Estado actual, brechas, conclusiones y recomendaciones

## 7.1 Estado inicial comprobado

El repositorio contiene la aplicación Next.js/Supabase, migraciones SQL `0001`–`0029`, interfaces docentes y entidades para evaluaciones y notas grupales. Las migraciones indicadas se aplicaron en una instancia local y la prueba `group_grades_rls.sql` aprobó con identidades sintéticas: negó la lectura estudiantil, aisló cursos de docentes distintos, permitió la modificación del responsable y rechazó inserciones entre cursos.

Esta evidencia es local. No prueba despliegue remoto ni aplicación de las migraciones en producción. La migración `0029` está versionada para retirar el acceso estudiantil a notas, pero debe aplicarse y verificarse en cada entorno antes de afirmar ese comportamiento fuera del local.

## 7.2 Capacidades presentes pero no concluyentes

Existen flujos candidatos de autenticación, periodos, cursos, importación, matrícula, grupos, puntos y notas. Su presencia no demuestra aceptación integral. El inventario inicial clasifica varias capacidades como `present-unverified` y debe citarse como diagnóstico, no como evaluación final.

## 7.3 Brechas principales

- No existe todavía una historia temporal completa de pertenencia a grupos.
- Las evaluaciones actuales no disponen del instante académico requerido para atribución histórica.
- Las correcciones de notas sobrescriben el valor sin auditoría completa.
- El reintento no posee aún un contrato integral de idempotencia y resultado incierto.
- La conciliación de grupos esperados y calificados no está implementada.
- No existe batería automatizada integral ni CI versionada en el estado documentado.
- No hay mediciones de tiempo, completitud, rendimiento o mejora frente al método manual.
- Monitoreo, alertas, respaldos, restauración y configuración productiva no fueron verificados.

## 7.4 Conclusiones de Parte I

1. El caso es apto para automatización porque contiene tareas repetitivas, reglas verificables, actores definidos y excepciones observables.
2. La dificultad central no es la captura de la nota, sino conservar el contexto temporal y explicar el resultado cuando cambian grupos o se corrigen calificaciones.
3. La arquitectura existente es suficiente si sus límites se profundizan: la interfaz guía, el servidor orquesta y PostgreSQL protege invariantes, historia y acceso.
4. La combinación de autorización de servidor, RLS, restricciones y transacciones ofrece defensa en profundidad; ninguna capa aislada garantiza toda la seguridad.
5. La idempotencia y la conciliación convierten el registro en un proceso recuperable y controlable, en lugar de una simple escritura de datos.
6. La evidencia disponible es parcial y local. Parte I entrega alcance y diseño; las afirmaciones de mejora requieren implementación y medición en Parte II.
7. El backlog por historias y cinco áreas permite trabajo paralelo con contratos definidos, siempre que los cambios de base precedan a las interfaces dependientes.

## 7.5 Recomendaciones

1. Confirmar antes de implementar la zona horaria institucional, formato sintético de importación, volumen de prueba y protocolo de línea base.
2. Priorizar idempotencia e historia de grupos antes de ampliar la interfaz de notas.
3. Conservar migraciones aditivas y no inventar historia para registros legados; marcar casos ambiguos para revisión docente.
4. Ejecutar pruebas directas de RLS y restricciones, no solo recorridos de interfaz.
5. Preparar desde el inicio plantillas de evidencia con fecha, versión/PR, entorno, fixture, esperado, observado y limitaciones.
6. Separar auditoría académica de logs operativos y evitar datos personales o notas en señales compartidas.
7. Configurar CI después de estabilizar los comandos locales, sin confundir checks verdes con ejecución correcta del proceso académico.
8. Verificar respaldos, retención y restauración con el proveedor antes de prometer recuperación productiva.
9. Revisar accesibilidad por teclado y formularios durante cada historia, no únicamente al cierre.
10. Actualizar el informe de Parte II solo desde evidencia ejecutada y mantener visibles las capacidades fallidas o pendientes.

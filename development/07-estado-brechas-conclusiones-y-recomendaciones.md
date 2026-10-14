# 7. Productos de Parte I, asuntos abiertos y conclusiones

## 7.1 Productos documentales disponibles

| Producto de análisis y diseño          | Artefacto identificable | Límite                                                          |
| -------------------------------------- | ----------------------- | --------------------------------------------------------------- |
| Caracterización y diagnóstico          | 01 y anexo A de 09      | Basado en relato documental, no observación de campo            |
| Objetivos, alcance y requisitos        | 02 y 04                 | No equivalen a funciones construidas                            |
| Arquitectura, modelo y controles       | 05 y anexos B–C de 09   | Consistencia de diseño, no seguridad verificada                 |
| Prototipo documental de baja fidelidad | P-01, anexo D de 09     | Representación estática; no software ni validación con usuarios |
| Plan de pruebas e indicadores          | 06 y anexos E–F de 09   | Sin ejecuciones ni valores observados                           |
| Material para informe y presentación   | 10 y guion en 06        | Requiere maquetación y elaboración del PowerPoint               |

Estos son los únicos tipos de «resultados» que se atribuyen a la semana 8. No se incluyen inventarios de migraciones, CI, despliegues o pruebas locales como resultados académicos.

## 7.2 Decisiones y datos que deben confirmarse

| Asunto                                  | Fuente y situación                                                                                   | Efecto sobre diseño y evaluación                                                                                               |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Diagnóstico del proceso manual          | Caso interno reportado; sin entrevistas o mediciones del equipo                                      | Confirmar actividades, dificultades reales y línea base antes de cuantificar beneficios                                        |
| Fecha, hora y zona horaria              | Caso habla del día de actividad; especificación propone instantes                                    | Acordar precisión y desempate cuando actividad y traslado coinciden                                                            |
| Traslados retroactivos                  | Regla de traslado existe; límites de retroactividad no están cerrados                                | Definir quién revisa impactos y qué historia puede corregirse                                                                  |
| Nota vacía y precisión                  | Código de referencia admite vacío; especificación exige nota numérica válida                         | Se propone vacío como pendiente; confirmar decimales, redondeo y corrección concurrente                                        |
| Grupos esperados y excepciones          | Diseño técnico permite conciliar con excepciones                                                     | Acordar grupos vacíos, alumnos sin grupo, grupos desactivados y autoridad para aceptar una excepción; evitar ocultar faltantes |
| Identidad y padrón                      | Fuente histórica habla de acceso institucional; autorización se vincula por correo                   | Confirmar dominios admitidos, cambios de correo y campos reales del XLSX sin difundir datos personales                         |
| Incorporación inicial por periodo/curso | Material técnico incluye importación por periodo y formularios por curso                             | Definir destino y coincidencias para evitar asociaciones al curso incorrecto                                                   |
| Exportación                             | Documentación la describe como posterior; componente `group-grades-table.tsx` contiene descarga XLSX | No equiparar descarga técnica con exportación oficial ni incorporarla como obligación del trabajo                              |
| CI y pruebas del repositorio            | Documentos de operación dicen que faltan; README y configuración técnica describen comprobaciones    | Son fuentes con actualización desigual; no trasladar su estado a resultados de Parte I ni afirmar su inexistencia              |
| Excepción individual                    | Caso la prevé para después y especificación la excluye de Parte II                                   | Mantenerla fuera de esta propuesta; reconsiderar solo con cambio de alcance explícito                                          |
| Criterio arquitectónico del curso       | Guía valora aplicar una tendencia arquitectónica                                                     | Confirmar si la aplicación full-stack con separación lógica satisface la expectativa de evaluación                             |
| Fidelidad del prototipo                 | Guía titula Parte I «Diseño y prototipo» sin detallar formato                                        | Confirmar si P-01 es suficiente o se exige maqueta visual/interactiva; no afirmar cumplimiento definitivo                      |
| Metas, calendario y equipo              | Valores técnicos candidatos, cinco áreas y semanas intermedias tentativas                            | Acordar volumen, umbrales, nombres, fechas y responsables antes de comprometerlos                                              |

La especificación externa presenta requisitos como definidos y su checklist no contiene aclaraciones abiertas; eso no demuestra confirmación académica de estos puntos. Se conservan explícitamente como asuntos por validar y no se modifica la especificación.

## 7.3 Conclusiones de análisis y diseño

1. El caso documentado permite delimitar un proceso susceptible de automatización: registro, corrección y conciliación de evaluaciones grupales. La plataforma completa aporta contexto, pero no constituye el objeto íntegro del experimento.
2. La pertenencia histórica y la fecha de actividad son necesarias en el modelo para explicar la atribución de notas ante traslados; consultar solo el grupo actual sería conceptualmente insuficiente.
3. La separación de puntos, notas, autorizaciones y matrículas evita mezclar conceptos académicos con permisos e identidades. Esa separación fundamenta los requisitos, no demuestra una mejora ya conseguida.
4. La arquitectura propuesta distribuye responsabilidades entre presentación, servidor y datos sin justificar un servicio adicional. Su adecuación operativa, seguridad y rendimiento deberán comprobarse en Parte II.
5. El diseño de estados, controles, correcciones y reintentos aborda riesgos identificados y permite formular casos de prueba. No prueba que esos riesgos estén eliminados.
6. La Parte I aporta documentos y una representación estática identificable. No establece eficacia medida, aceptación de usuarios, funcionamiento productivo ni cumplimiento definitivo del formato de prototipo requerido por el docente.

## 7.4 Recomendaciones

Confirmar primero las reglas temporales, la definición de grupos esperados y el tratamiento de excepciones. Revisar el prototipo con el docente y registrar futuras observaciones sin inventar aprobaciones. Antes de implementar, precisar contratos y criterios de aceptación; antes de medir, fijar el protocolo y las entradas equivalentes. Usar datos sintéticos, entorno aislado y evidencia con fecha, versión y limitaciones. En Parte II, reportar tanto fallos como aciertos y no confundir metas, checks de calidad o despliegues con mejoras del proceso.

Completar carátula, nombres y referencias pendientes; maquetar el informe y elaborar el PowerPoint exigido por la guía. Ninguno de estos archivos de trabajo sustituye por sí solo esos entregables finales.

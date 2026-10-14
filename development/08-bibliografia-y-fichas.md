# 8. Bibliografía y fichas de investigación

## 8.1 Criterio editorial y alcance de la verificación

La Parte I (semana 8) presenta una propuesta no implementada: análisis, diseño y prototipo. La implementación, las pruebas y la evaluación se prevén para la semana 16. Una fuente bibliográfica puede fundamentar un concepto, pero no demuestra que el proyecto ya lo aplique o que haya obtenido resultados.

**Revisión web del 14 de octubre de 2026 mediante `fetch`:** se consultaron seis fuentes oficiales. En PostgreSQL, RFC 9110 y WCAG 2.2 se comprobó el contenido pertinente; en las dos publicaciones NIST se comprobaron la ficha editorial y el resumen, no los PDF completos ni cada control. El DOI de Benavides et al. devolvió HTTP 403. Las demás candidatas no se consultaron en esta revisión: no se consideran falsas, pero tampoco verificadas.

Las referencias comprobadas se presentan en APA 7 en 8.3. Las candidatas de 8.4 quedan fuera del respaldo afirmativo del marco hasta comprobar sus metadatos y el pasaje pertinente. No se asignan niveles de calidad solo por tener DOI ni se inventan páginas leídas. En APA 7, una fecha de recuperación es pertinente para contenido cambiante sin versión archivada; no es obligatoria para toda página sin fecha.

## 8.2 Fichas de fuentes comprobadas

| Fuente y tipo                                              | URL consultada                                                     | Comprobación efectiva                                                                                                                                                 | Uso permitido y límite                                                                                                                                                    |
| ---------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PostgreSQL, _Transactions_; documentación oficial          | https://www.postgresql.org/docs/current/tutorial-transactions.html | Contenido de la sec. 3.4: agrupación de cambios de todo o nada y reversión. La página consultada corresponde a PostgreSQL 18.                                         | Fundamenta transacciones; no prueba integridad del proyecto.                                                                                                              |
| PostgreSQL, _Row security policies_; documentación oficial | https://www.postgresql.org/docs/current/ddl-rowsecurity.html       | Contenido de la sec. 5.9: restricciones por fila, políticas y excepciones para roles privilegiados. La página consultada corresponde a PostgreSQL 18.                 | Fundamenta RLS y sus límites; no acredita permisos implementados.                                                                                                         |
| Fielding et al., RFC 9110; estándar                        | https://www.rfc-editor.org/rfc/rfc9110.html                        | Editores, título y junio de 2022; sec. 9.2.2 sobre idempotencia y secs. 17.7–17.9 sobre privacidad.                                                                   | Define el efecto pretendido de solicitudes repetidas; no prescribe el mecanismo de deduplicación de notas.                                                                |
| Joint Task Force, NIST SP 800-53 Rev. 5; catálogo oficial  | https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final                 | Autor corporativo, título, septiembre de 2020, DOI y resumen sobre controles adaptables al riesgo. La ficha informa actualizaciones posteriores.                      | Respalda el contexto general de controles; AC-5, AC-6 y controles de auditoría requieren lectura específica antes de citarlos. No es certificación ni obligación peruana. |
| Kent y Souppaya, NIST SP 800-92; guía oficial              | https://csrc.nist.gov/pubs/sp/800/92/final                         | Autores, título, septiembre de 2006, DOI y resumen sobre infraestructura y procesos de gestión de registros.                                                          | Respalda la necesidad de gestionar registros; las secs. 2–4 del PDF quedan por leer para afirmaciones detalladas.                                                         |
| World Wide Web Consortium, WCAG 2.2; recomendación oficial | https://www.w3.org/TR/WCAG22/                                      | Título, versión publicada el 12 de diciembre de 2024, cuatro principios y criterios de teclado, foco, color, etiquetas, errores y estados; requisitos de conformidad. | Fundamenta criterios de diseño, no conformidad del prototipo ni de una futura implementación.                                                                             |

## 8.3 Bibliografía comprobada en APA 7

Fielding, R., Nottingham, M., & Reschke, J. (Eds.). (2022). _HTTP semantics_ (RFC 9110; STD 97). Internet Engineering Task Force. https://doi.org/10.17487/RFC9110

Joint Task Force. (2020). _Security and privacy controls for information systems and organizations_ (NIST Special Publication 800-53 Rev. 5). National Institute of Standards and Technology. https://doi.org/10.6028/NIST.SP.800-53r5

Kent, K., & Souppaya, M. (2006). _Guide to computer security log management_ (NIST Special Publication 800-92). National Institute of Standards and Technology. https://doi.org/10.6028/NIST.SP.800-92

PostgreSQL Global Development Group. (s. f.-a). _Row security policies_. Recuperado el 14 de octubre de 2026, de https://www.postgresql.org/docs/current/ddl-rowsecurity.html

PostgreSQL Global Development Group. (s. f.-b). _Transactions_. Recuperado el 14 de octubre de 2026, de https://www.postgresql.org/docs/current/tutorial-transactions.html

World Wide Web Consortium. (2024, 12 de diciembre). _Web Content Accessibility Guidelines (WCAG) 2.2_. https://www.w3.org/TR/2024/REC-WCAG22-20241212/

## 8.4 Candidatas pendientes de comprobación

Los datos siguientes proceden del borrador previo. Su presentación sigue el formato APA 7, pero no equivale a comprobar autores, título, fecha, DOI ni correspondencia entre texto y afirmación. Deben verificarse antes de incorporarlas a la bibliografía utilizada.

| Candidata                                          | Estado y comprobación necesaria                                                                                                              |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Benavides et al. (2020)                            | Intento mediante DOI: HTTP 403; pendiente contrastar autores, metadatos y texto completo.                                                    |
| Dumas et al. (2018)                                | Sin consulta en esta revisión; comprobar edición y pasajes sobre gestión por procesos.                                                       |
| OECD (2023)                                        | Sin consulta; comprobar título completo y capítulos pertinentes.                                                                             |
| Falchikov y Goldfinch (2000); Lejk y Wyvill (2001) | Sin consulta; comprobar metadatos, método y límites de la evaluación por pares. No justifican por sí solos la regla de nota grupal del caso. |
| Sandhu et al. (1996)                               | Sin consulta; comprobar metadatos y definición del modelo RBAC.                                                                              |
| Bertolino (2007)                                   | Sin consulta; comprobar publicación y pasajes sobre pruebas.                                                                                 |
| Hilton et al. (2016); Bacchelli y Bird (2013)      | Sin consulta; comprobar resultados y límites de generalización antes de atribuir beneficios.                                                 |
| Ley N.º 29733                                      | Sin consulta; comprobar enlace, texto oficial vigente, artículos pertinentes y aplicabilidad.                                                |
| Decreto Supremo N.º 016-2024-JUS                   | No se dispone de enlace específico verificado; localizar norma y PDF oficiales. La portada de El Peruano no identifica el documento.         |

Bacchelli, A., & Bird, C. (2013). Expectations, outcomes, and challenges of modern code review. En _2013 35th International Conference on Software Engineering_ (pp. 712–721). IEEE. https://doi.org/10.1109/ICSE.2013.6606617

Benavides, L. M. C., Tamayo Arias, J. A., Arango Serna, M. D., Branch Bedoya, J. W., & Burgos, D. (2020). Digital transformation in higher education institutions: A systematic literature review. _Sensors, 20_(11), Artículo 3291. https://doi.org/10.3390/s20113291

Bertolino, A. (2007). Software testing research: Achievements, challenges, dreams. En _Future of Software Engineering (FOSE ’07)_ (pp. 85–103). IEEE. https://doi.org/10.1109/FOSE.2007.25

Congreso de la República del Perú. (2011). _Ley N.º 29733, Ley de Protección de Datos Personales_. https://www.gob.pe/institucion/congreso-de-la-republica/normas-legales/243470-29733

Dumas, M., La Rosa, M., Mendling, J., & Reijers, H. A. (2018). _Fundamentals of business process management_ (2.ª ed.). Springer. https://doi.org/10.1007/978-3-662-56509-4

Falchikov, N., & Goldfinch, J. (2000). Student peer assessment in higher education: A meta-analysis comparing peer and teacher marks. _Review of Educational Research, 70_(3), 287–322. https://doi.org/10.3102/00346543070003287

Hilton, M., Tunnell, T., Huang, K., Marinov, D., & Dig, D. (2016). Usage, costs, and benefits of continuous integration in open-source projects. En _Proceedings of the 31st IEEE/ACM International Conference on Automated Software Engineering_ (pp. 426–437). ACM. https://doi.org/10.1145/2970276.2970358

Lejk, M., & Wyvill, M. (2001). Peer assessment of contributions to a group project: A comparison of holistic and category-based approaches. _Assessment & Evaluation in Higher Education, 26_(1), 61–72. https://doi.org/10.1080/02602930020022291

Ministerio de Justicia y Derechos Humanos. (2024). _Decreto Supremo N.º 016-2024-JUS_. [Entrada candidata: título completo y URL oficial pendientes de comprobación].

OECD. (2023). _OECD digital education outlook 2023: Towards an effective digital education ecosystem_. OECD Publishing. https://doi.org/10.1787/c74f03de-en

Sandhu, R. S., Coyne, E. J., Feinstein, H. L., & Youman, C. E. (1996). Role-based access control models. _Computer, 29_(2), 38–47. https://doi.org/10.1109/2.485845

### Documentación técnica por seleccionar

Las páginas de Next.js, Supabase, restricciones de PostgreSQL y herramientas de GitHub se incorporarán solo si son necesarias para explicar el diseño. Quedan pendientes de selección y consulta. Explican mecanismos técnicos, no beneficios académicos ni implementación efectiva de la propuesta.

## 8.5 Guía del curso y referencias internas de dominio

### Guía del curso 2026-2

_Automatizacion y control de software: Guía del trabajo final del curso_. (s. f.). [Guía de curso en PDF proporcionada por el usuario; sin autor identificado].

Se leyó directamente el PDF adjunto `Trabajo Final Automatizacion y Control de Software 2026-2.pdf`, mediante extracción de sus dos páginas. La p. 1 describe el propósito y las capacidades del trabajo completo; la p. 2 distingue Parte I de semana 8 y Parte II de semana 16, establece la estructura del informe final y exige informe y PowerPoint en ambas entregas. El documento no especifica la fidelidad del prototipo. No se inventan autor, institución editora ni fecha de publicación; 2026-2 identifica el curso en el nombre del archivo, no una fecha editorial comprobada.

### Fuentes internas como referencia de dominio

| Documento del proyecto                                                                                   | Función en la propuesta                                                               | Límite                                                                      |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `docs/01-definicion/caso-evaluacion-grupal.md`                                                           | Contextualizar el problema académico descrito por el proyecto.                        | No sustituye evidencia externa ni datos de evaluación.                      |
| `docs/01-definicion/glosario.md` y `specs/001-manage-group-evaluation/spec.md`                           | Rastrear actores, alcance y reglas de nota grupal, puntos individuales y pertenencia. | Es referencia de dominio; sus reglas requieren validación con responsables. |
| `docs/02-diseno/modelo-datos.md` y `specs/001-manage-group-evaluation/data-model.md`                     | Relacionar los conceptos con decisiones de diseño propuestas.                         | No acredita controles implementados, probados o eficaces.                   |
| `docs/03-calidad-y-operacion/indicadores-y-ci-cd.md` y `specs/001-manage-group-evaluation/quickstart.md` | Relacionar criterios y planificación de evaluación futura.                            | Las metas no son resultados medidos.                                        |

Estos documentos se identifican por sus rutas existentes; no se les inventan autores o fechas. Su inclusión sirve para trazabilidad interna, no para presentarlos como antecedentes académicos independientes.

## 8.6 Plantilla para nuevas fichas

| Campo                     | Contenido por registrar                                                        |
| ------------------------- | ------------------------------------------------------------------------------ |
| Tema y concepto           | Concepto concreto que se pretende fundamentar.                                 |
| Referencia APA 7          | Autores, fecha, título y publicación contrastados con la fuente.               |
| Tipo y procedencia        | Libro, artículo, estándar, norma o documentación oficial; editorial o entidad. |
| DOI/URL                   | Identificador y enlace específico consultado.                                  |
| Estado                    | Contenido comprobado, solo metadatos/resumen, acceso fallido o sin consulta.   |
| Fecha y medio de consulta | Fecha efectiva y medio utilizado; no registrar intentos fallidos como lectura. |
| Pasaje pertinente         | Página o sección realmente consultada; para cita textual, localizador exacto.  |
| Afirmación y límites      | Qué respalda y qué no permite concluir sobre el proyecto.                      |
| Aplicación al caso        | Problema, ventaja esperada, desventaja y condición de recomendación.           |
| Pendientes                | Lectura completa, actualización, metadatos o revisión de aplicabilidad.        |

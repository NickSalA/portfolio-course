# 3. Marco teórico

> **Alcance de la Parte I (semana 8):** este capítulo fundamenta una propuesta no implementada mediante análisis, diseño y prototipo. La implementación, las pruebas y la evaluación se reservan para la semana 16. Los beneficios se presentan como expectativas, no como resultados.

La estructura responde a las indicaciones de la guía PDF del curso 2026-2, leída para esta revisión (p. 2): definir el componente, explicar los problemas que aborda, sus ventajas y desventajas, cuándo recomendarlo y los conceptos relacionados. La referencia de la guía y el estado de comprobación de las fuentes se registran en el capítulo 8. Las decisiones del caso no se atribuyen a literatura pendiente de consulta.

## 3.1 Automatización y control de procesos

Para esta propuesta, la automatización consiste en trasladar tareas recurrentes y reglas explícitas de un proceso a un sistema, manteniendo la intervención humana ante excepciones. Sus componentes conceptuales son entradas, actividades, responsables, reglas, estados y salidas. El problema que se busca abordar es la dispersión de registros y la dificultad para conciliar notas y cambios de grupo.

Se espera reducir tareas repetitivas y aplicar validaciones consistentes. Como desventajas, existen costos de preparación y mantenimiento, y el riesgo de reproducir reglas incompletas o datos erróneos. Se recomienda cuando las actividades son recurrentes y sus reglas pueden acordarse; no cuando se pretende reconstruir hechos históricos sin información confiable. El libro de Dumas et al. se conserva como candidato para ampliar el fundamento de gestión por procesos, pendiente de consulta.

## 3.2 Digitalización de la gestión académica

En este caso, digitalizar significa representar y organizar información académica en medios digitales. La transformación del proceso sería un cambio más amplio en prácticas, responsabilidades y uso de esa información; disponer de una interfaz no demuestra por sí solo ese cambio. Se proponen como componentes el registro académico, los flujos docentes y las reglas de acceso.

La centralización podría facilitar consultas y conciliación, pero también genera dependencia de la disponibilidad del sistema, necesidades de capacitación y riesgos de concentración de datos. Se recomienda cuando existen registros dispersos y responsables dispuestos a acordar su gestión. Benavides et al. y OECD permanecen como fuentes candidatas para profundizar este contexto; no se presentan aquí conclusiones atribuidas a textos no comprobados.

## 3.3 Evaluación grupal y pertenencia histórica

La nota grupal representa la calificación de una actividad colectiva; los puntos individuales constituyen un registro distinto según las reglas del caso. La pertenencia histórica indica qué estudiantes integraban un grupo en el momento de una actividad, en lugar de usar únicamente su composición actual. Estos conceptos provienen del dominio del proyecto, no de una validación pedagógica de la solución.

El problema aparece cuando un cambio posterior de grupo altera la interpretación de una nota pasada. Se propone relacionar la fecha de realización de la evaluación con los periodos de pertenencia. La ventaja esperada es una atribución explicable; sus límites son la necesidad de fechas confiables y la complejidad de corregir información histórica. Se recomienda cuando los grupos pueden cambiar durante el curso. No permite inferir contribuciones individuales ni resolver la equidad de la evaluación. La corrección individual queda fuera del alcance propuesto; las fuentes sobre evaluación por pares se mantienen pendientes en el capítulo 8.

## 3.4 Integridad, transacciones e idempotencia

La integridad de datos consiste, para el diseño, en conservar registros compatibles con las reglas de rango, unicidad y relación entre entidades. Una transacción agrupa varios cambios en una operación de todo o nada, según la documentación de PostgreSQL (PostgreSQL Global Development Group, s. f.-b, sec. 3.4). Se propone usar este concepto para que un cambio de pertenencia o una corrección de nota no deje registros parciales.

La idempotencia significa que repetir una solicitud idéntica conserva el efecto pretendido de una sola solicitud (Fielding et al., 2022, sec. 9.2.2). Es útil ante reintentos por fallos de comunicación. La propuesta de evitar guardados duplicados es una adaptación al negocio, no un mecanismo exigido por el RFC ni una garantía ya implementada.

La ventaja esperada de estos controles es evitar inconsistencias y duplicados; sus costos son el diseño de reglas, el tratamiento de conflictos y la verificación posterior. Se recomiendan cuando una acción modifica registros relacionados o puede repetirse. No garantizan que una calificación sea académicamente correcta: esa responsabilidad requiere revisión docente.

## 3.5 Autenticación, autorización y mínimo privilegio

Autenticar consiste en comprobar una identidad; autorizar, en determinar qué acciones puede realizar sobre un recurso. El mínimo privilegio se adopta como principio de diseño: conceder solo el acceso necesario para una responsabilidad. En el caso propuesto, el rol de docente se combinaría con su responsabilidad sobre el curso; una sesión válida no bastaría para modificar cualquier registro.

La seguridad por filas (RLS) permite restringir qué registros pueden consultarse o modificarse mediante políticas. PostgreSQL advierte que hay roles privilegiados que pueden eludirlas (PostgreSQL Global Development Group, s. f.-a, sec. 5.9). Se propone como complemento de los controles de servidor, no como sustituto de las reglas académicas. El catálogo NIST SP 800-53 ofrece un marco general de controles adaptables al riesgo (Joint Task Force, 2020); la lectura de controles específicos sigue pendiente.

La ventaja esperada es limitar accesos indebidos. La desventaja es la complejidad de mantener permisos y políticas coherentes. Se recomienda cuando distintos responsables acceden a información de cursos diferentes; los permisos deben comprobarse en la implementación futura, no inferirse de botones ocultos en el prototipo.

## 3.6 Trazabilidad, auditoría y observabilidad

La trazabilidad es la posibilidad de reconstruir un cambio; la auditoría utiliza registros para revisar actuaciones, y la observabilidad aporta señales sobre el funcionamiento del sistema. Kent y Souppaya (2006), en el resumen oficial consultado, presentan la gestión de registros como una práctica que requiere infraestructura y procesos organizacionales, no solo una tecnología de emisión de mensajes.

Se propone distinguir el historial académico —valor anterior, nuevo valor, responsable e instante— de las señales operativas de intentos y errores. El problema abordado es la falta de explicación de una corrección o de un fallo. La ventaja esperada es facilitar revisión y diagnóstico; los costos son almacenamiento, protección, conservación y posible exposición de información personal. Se recomienda cuando las modificaciones necesitan justificación, con acceso restringido y sin divulgar notas o identidades en registros públicos.

## 3.7 Calidad, prototipo y evaluación futura

En esta propuesta, la calidad se expresa mediante criterios de aceptación relacionados con las reglas académicas, la seguridad y la facilidad de uso. Un prototipo representa pantallas y recorridos para discutir el diseño; no demuestra que la solución funcione ni que produzca mejoras. Las pruebas contrastarán posteriormente comportamientos con resultados esperados, y la evaluación analizará si la solución responde al problema planteado.

Para la semana 8 se propone describir escenarios válidos, inválidos y excepcionales. Para la semana 16 se prevé implementar, probar reglas y permisos, recorrer flujos críticos y evaluar los indicadores definidos. La ventaja de planificar estos criterios es hacer revisable la propuesta; sus límites son el tiempo de preparación y que los escenarios elegidos pueden omitir fallos. Se recomienda priorizar los recorridos con mayor impacto académico. Las referencias sobre pruebas, integración continua y revisión de código quedan como candidatas, sin atribuirles beneficios no comprobados.

## 3.8 Accesibilidad, rendimiento y privacidad

La accesibilidad busca que las personas puedan percibir, operar y comprender una interfaz, con contenido interpretable por tecnologías de asistencia. WCAG 2.2 organiza sus criterios en cuatro principios: perceptible, operable, comprensible y robusto (World Wide Web Consortium, 2024). Para la futura interfaz se proponen navegación por teclado, foco visible, etiquetas claras, errores identificables y estados que no dependan solo del color. P-01 solo representa contenido y recorrido de forma estática, por lo que no permite comprobar teclado o foco. Son criterios de diseño; no se declara conformidad WCAG sin evaluar páginas y procesos completos.

Estas medidas pueden reducir barreras de interacción, aunque requieren revisión manual y no cubren todas las necesidades de todas las personas. Se recomiendan desde el diseño de cualquier flujo académico. El rendimiento alude al tiempo de respuesta y los recursos utilizados: la respuesta visible en dos segundos para el 95 % de las acciones interactivas es una meta candidata por validar para la evaluación futura, no un estándar universal ni un resultado actual.

La privacidad se aborda como limitación del acceso y de la divulgación de información personal. Se propone trabajar con datos sintéticos y excluir secretos, correos reales y calificaciones reales de repositorios y anexos públicos. RFC 9110 advierte de riesgos de divulgación y reidentificación en registros y direcciones web (Fielding et al., 2022, secs. 17.7–17.9). Esta precaución puede limitar el realismo de las pruebas, pero se recomienda antes de utilizar datos reales. La Ley peruana N.º 29733 y el Decreto Supremo N.º 016-2024-JUS permanecen pendientes de comprobación del texto oficial y de su aplicabilidad; no se afirma cumplimiento legal.

## 3.9 Síntesis conceptual aplicada

La propuesta reúne cinco principios: acceso limitado por responsabilidad, coherencia de datos, historia explicable, reintentos sin duplicación y evidencia proporcional. Se plantea una sola aplicación como decisión de alcance, sujeta a revisión del diseño; no como arquitectura implementada ni superioridad demostrada.

Las fuentes internas de requisitos y diseño sirven para describir el dominio y rastrear decisiones (véase el capítulo 8). No son bibliografía académica independiente ni evidencia de implementación, pruebas o resultados de la Parte I.

# 3. Marco teórico

## 3.1 Automatización y control de procesos

La gestión por procesos comprende identificación, modelado, análisis, rediseño, implementación y monitoreo; por ello, automatizar no consiste únicamente en sustituir una hoja de cálculo por una interfaz (Dumas et al., 2018). Una automatización controlada debe declarar entradas, reglas, estados, resultados y excepciones. En este proyecto, el valor no reside solo en capturar notas, sino en impedir combinaciones inválidas, preservar historia y permitir conciliación.

Entre sus ventajas esperadas están la reducción de tareas repetitivas, la consistencia de validaciones y la disponibilidad de evidencia. Sus riesgos incluyen automatizar reglas incompletas, ocultar errores detrás de una interfaz, concentrar datos sensibles o producir confianza injustificada. Es apropiada cuando el proceso es recurrente, sus reglas pueden expresarse y las excepciones tienen tratamiento explícito; no debe usarse para inventar hechos históricos inciertos.

## 3.2 Transformación digital en educación superior

La transformación digital universitaria involucra procesos, personas, gobierno y capacidades institucionales, no solo herramientas aisladas (Benavides et al., 2020). La OECD (2023) también destaca que un ecosistema educativo digital requiere gobernanza, uso responsable de datos, interoperabilidad y evaluación. El caso se ubica en este contexto porque integra datos académicos dispersos y formaliza controles sobre un flujo docente real.

## 3.3 Evaluación grupal y pertenencia histórica

La evaluación de actividades colaborativas plantea tensiones entre el resultado colectivo y la responsabilidad individual. La literatura sobre evaluación por pares muestra que el diseño de criterios afecta la validez de los juicios y que no debe asumirse una atribución individual automática e infalible (Falchikov & Goldfinch, 2000; Lejk & Wyvill, 2001). El proyecto adopta la nota grupal como regla y mantiene los puntos individuales como una entidad distinta. La corrección individual queda fuera de alcance.

La pertenencia histórica es necesaria para explicar a quién alcanza una nota. Si un estudiante cambia de grupo después de una actividad, la composición actual no representa la situación académica pasada. Por ello se proponen intervalos temporales no solapados y una fecha/hora de realización por evaluación.

## 3.4 Integridad, transacciones e idempotencia

La integridad se materializa mediante restricciones de rango, unicidad y coherencia referencial. PostgreSQL permite agrupar cambios relacionados en transacciones de todo o nada, evitando aceptar estados parciales. En este caso, cerrar una pertenencia y abrir otra debe ser una sola operación; lo mismo ocurre al cambiar una nota y registrar su corrección.

La idempotencia controla reintentos. RFC 9110 define una operación idempotente como aquella cuyo efecto pretendido permanece igual cuando la misma solicitud se repite. Dado que el guardado de una nota es una operación de negocio, el diseño añade un identificador por intención y una huella del contenido: repetir la misma operación devuelve su resultado previo, mientras reutilizar el identificador con datos diferentes se rechaza.

## 3.5 Autenticación, autorización y mínimo privilegio

Autenticar identifica a la persona; autorizar determina qué puede hacer sobre un recurso. El modelo RBAC asigna permisos a roles y usuarios a roles (Sandhu et al., 1996), pero el rol general de docente no basta para modificar cualquier curso. También se debe comprobar que sea responsable del curso. NIST SP 800-53 recomienda mínimo privilegio, separación de funciones y registros protegidos.

La defensa propuesta combina controles de servidor y PostgreSQL Row Level Security. RLS restringe filas según políticas, pero no sustituye validaciones de dominio, privilegios de tabla ni pruebas frente a roles con facultad de elusión. La interfaz mejora la experiencia; no constituye el límite de seguridad.

## 3.6 Trazabilidad, auditoría y observabilidad

Un rastro académico debe conservar el valor anterior, el nuevo, el responsable y el instante de cada corrección. Esta información pertenece a tablas académicas restringidas. Las señales operativas cumplen otra función: permiten correlacionar intento, resultado y categoría de error sin divulgar nombres, correos o notas. NIST SP 800-92 señala que la gestión de logs incluye generación, almacenamiento, protección, análisis y conservación; emitir un mensaje sin gobernarlo no constituye auditoría suficiente.

## 3.7 Calidad y pruebas

Las pruebas producen evidencia sobre el comportamiento y deben cubrir casos válidos, inválidos, límites y excepciones (Bertolino, 2007). La estrategia combina:

- pruebas SQL para restricciones, RLS, transacciones e historia;
- pruebas TypeScript para parseo y mapeo de resultados;
- pruebas de navegador para recorridos críticos;
- revisión manual para reglas académicas y protocolo comparativo.

La integración continua puede acelerar retroalimentación, pero tiene costos y no garantiza calidad por su sola presencia (Hilton et al., 2016). La revisión moderna de código también favorece detección de defectos y transferencia de conocimiento (Bacchelli & Bird, 2013).

## 3.8 Accesibilidad, rendimiento y privacidad

WCAG 2.2 exige que las interfaces sean perceptibles, operables, comprensibles y robustas. Para los flujos Must se proponen teclado, foco visible, etiquetas, errores asociados y estados que no dependan solo del color. La meta interna de respuesta visible en dos segundos para el 95 % de las acciones interactivas es un criterio de evaluación del proyecto, no un estándar universal ni un resultado actual.

La Ley peruana N.º 29733 y su reglamento obligan a tratar los datos personales con finalidad, proporcionalidad y seguridad. En consecuencia, las pruebas y evidencias usarán datos sintéticos o anonimizados; secretos, correos reales y calificaciones no deben aparecer en repositorios, logs públicos ni anexos.

## 3.9 Síntesis conceptual aplicada

El diseño traduce estos conceptos en cinco principios: autorización en límites confiables, integridad transaccional, historia explicable, reintentos seguros y evidencia proporcional. La plataforma se mantiene como una sola aplicación porque un servicio adicional no resolvería una necesidad demostrada y duplicaría límites de autenticación y autorización.

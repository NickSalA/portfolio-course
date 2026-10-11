# Trabajo final: Automatización y Control de Software

Esta guía de entregables se basa en el PDF proporcionado para el curso 2026-2. No sustituye el
texto oficial ni constituye una especificación de funcionalidad. El proceso concreto y sus
indicadores deben definirse en una especificación de la automatización.

## Qué debe poder demostrarse

- Un proceso real susceptible de automatización en un contexto organizacional.
- Automatización de actividades repetitivas y aplicación de condiciones y reglas de control.
- Gestión de eventos, validación y control de la ejecución.
- Registro de evidencias y resultados; detección de errores y situaciones excepcionales.
- Mecanismos de monitoreo y evaluación de la solución mediante pruebas.
- Aplicación de buenas prácticas de ingeniería de software y justificación de la arquitectura
  usada en el caso, sin asumir que se necesita un servidor independiente.

El caso elegido es la [gestión de evaluación grupal](../01-definicion/caso-evaluacion-grupal.md)
para un docente de la UNMSM que antes registraba notas en XLSX y llevaba grupos y puntos por
separado. El XLSX del SUM se utiliza al inicio del curso para cargar alumnos, **no** para
importar notas: la carga es una entrada del flujo académico elegido. Las comprobaciones de PR y
CI/CD se proponen como controles de calidad complementarios, no como el proceso principal a
evaluar. La exportación futura y la conservación de notas ante cambios de grupo se deben
especificar y construir antes de presentarlas como resultados implementados.

## Entregas

| Momento              | Propósito                                                  | Material indicado en la guía                     |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------ |
| Semana 8 · Parte I   | Análisis, diseño y prototipo.                              | Avance, informe y presentación PowerPoint.       |
| Semana 16 · Parte II | Continuar la primera parte, implementar, probar y evaluar. | Avance final, informe y presentación PowerPoint. |

El informe final debe contener carátula, índice, introducción, objetivos, marco teórico (definición
del componente, problemas que resuelve, ventajas/desventajas, cuándo usarlo y conceptos
relacionados), caso de aplicación, resultados, conclusiones y recomendaciones, bibliografía APA 7
y anexos. La guía también valora redacción, ortografía, presentación y la aplicación de la tendencia
arquitectónica al caso, y no acepta entregas fuera de plazo.

## Relación con la documentación técnica

La constitución fija estándares de ingeniería; cada funcionalidad se define y planifica en sus
artefactos Spec Kit. El registro final en `docs/automatizaciones/<nombre-del-proceso>/evaluacion.md`
debe reflejar implementación, pruebas y resultados observados, y podrá servir de insumo para el
informe y la presentación. Los [KPIs y controles CI/CD propuestos](../03-calidad-y-operacion/indicadores-y-ci-cd.md)
son candidatos a medir y construir, no resultados existentes. **No** hay resultados ni mediciones
que documentar todavía sin pruebas realmente ejecutadas.

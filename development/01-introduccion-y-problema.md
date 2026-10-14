# 1. Introducción y planteamiento del problema

## 1.1 Introducción y perspectiva de la entrega

La gestión académica relaciona identidad, acceso autorizado, periodos, cursos, incorporación de alumnos, matrículas, grupos, puntos individuales y evaluaciones grupales. Dentro de esa visión, este trabajo selecciona un solo proceso principal: la gestión y control de evaluaciones grupales para el docente responsable del curso. Los demás módulos aportan contexto, entradas o dependencias; no se propone construir ni evaluar un LMS completo.

Esta Parte I se sitúa en la semana 8 del curso Automatización y Control de Software 2026-2. La guía distingue la entrega de diseño y prototipo, orientada a analizar el problema y diseñar la solución, de la Parte II de semana 16, destinada a implementar, probar y evaluar. Aquí se presentan diagnóstico documental, requisitos, diseño y una representación de baja fidelidad; no una solución operativa.

Se examinó documentación, especificaciones, aplicación y modelo de datos del repositorio para comprender el caso y formular la propuesta. Ese material técnico no se atribuye como implementación o evaluación de este trabajo. Tampoco se afirma que el repositorio carezca de código. No se realizaron entrevistas, observaciones de campo, pruebas de la solución académica ni mediciones para esta entrega.

## 1.2 Situación problemática reportada

Según el caso registrado en `docs/01-definicion/caso-evaluacion-grupal.md`, un docente de la UNMSM llevaba notas en una hoja XLSX y registraba por separado grupos y puntos individuales. Durante las primeras semanas recibe del SUM una relación de alumnos en XLSX para su incorporación inicial. Este archivo no contiene notas para importar. La descripción es una fuente interna del caso, no un estudio empírico independiente.

La separación de registros plantea necesidades de conciliación: relacionar curso, actividad, grupos y notas; reconocer faltantes; y explicar qué calificación corresponde a un alumno cuando cambia de grupo. Se identifican riesgos de omisiones, duplicados, valores inválidos y atribuciones equivocadas. No se conoce su frecuencia ni su costo real: esos aspectos requieren levantamiento y medición posteriores.

## 1.3 Problema central y diagnóstico

El problema consiste en gestionar y explicar las notas grupales con información relacionada que se registra por separado, especialmente ante traslados y correcciones. La regla documentada establece que cuenta el grupo al que pertenecía el alumno al realizarse la actividad, no el grupo vigente al guardar o corregir la nota. Una lista del grupo actual no basta como representación de esa historia.

| Aspecto reportado o requerido                 | Riesgo o necesidad inferida                       | Respuesta que se propone diseñar                       |
| --------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------ |
| Notas, grupos y puntos en registros separados | Conciliación manual y posible confusión semántica | Información relacionada, sin convertir puntos en notas |
| Cambios de grupo durante el curso             | Atribución retrospectiva incorrecta               | Pertenencias temporales y fecha de actividad           |
| Registro y corrección docente                 | Valores inválidos o cambios inexplicables         | Validaciones y conservación de correcciones            |
| Posibles fallos de guardado                   | Incertidumbre y repetición de cambios             | Estados explícitos y reintento seguro                  |
| Cierre de una evaluación                      | Faltantes que podrían pasar inadvertidos          | Conciliación de grupos, notas y excepciones            |

Los riesgos son hipótesis de análisis, no incidentes observados o cuantificados por el equipo.

## 1.4 Pregunta orientadora

¿Cómo diseñar una solución de automatización y control para la gestión de evaluaciones grupales que articule las entradas académicas del curso, preserve la pertenencia histórica de sus alumnos y permita registrar, corregir y conciliar notas con reglas, permisos y excepciones explícitos?

## 1.5 Frontera del trabajo

La entrada del proceso principal es un curso bajo responsabilidad docente con alumnado autorizado, matrículas y grupos identificados. Se diseña la definición de actividades, el registro y la corrección de notas grupales y la conciliación de sus resultados. La preparación del padrón y la selección de grupos se describen como dependencias, no como procesos adicionales de evaluación de eficacia.

La salida esperada es una evaluación revisada por el docente, con grupos calificados o excepciones identificadas y sin faltantes inexplicados. La validez de cerrar con excepciones debe acordarse antes de implementar. La exportación oficial, la corrección individual excepcional, los nuevos tipos de notas y las funciones generales de LMS quedan fuera de la propuesta.

## 1.6 Fuentes y límites del diagnóstico

Se contrastaron `README.md`, `docs/`, `specs/001-manage-group-evaluation/` y las fuentes pertinentes de `portfolio-coursse/`. Su alcance técnico no se traslada automáticamente al compromiso académico. Las diferencias y decisiones por confirmar se registran en 07; las fuentes externas y su grado de verificación figuran en 08.

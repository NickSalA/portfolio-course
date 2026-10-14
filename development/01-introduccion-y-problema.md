# 1. Introducción y planteamiento del problema

## Introducción

La gestión de evaluaciones grupales en educación superior combina tareas administrativas y académicas que requieren exactitud, autorización y trazabilidad. En el caso estudiado, un docente de la Universidad Nacional Mayor de San Marcos recibe al inicio del curso un archivo XLSX del SUM con la relación de alumnos. Este archivo sirve para incorporar alumnado, pero no contiene ni importa calificaciones. Antes de la plataforma, las notas se registraban en una hoja XLSX mientras la composición de grupos y los puntos individuales se controlaban por separado.

La dispersión de registros incrementa el esfuerzo de conciliación y dificulta explicar qué grupo correspondía a un alumno cuando hubo traslados. También hace necesario controlar manualmente omisiones, valores inválidos, duplicados y correcciones. La automatización propuesta no se limita a reemplazar una hoja por una pantalla: modela estados, reglas, eventos, permisos, errores, reintentos y evidencia de ejecución.

La Parte I presenta el análisis y diseño de una solución que conserva la aplicación existente basada en Next.js, Supabase y PostgreSQL. El alcance comprende la preparación del curso, incorporación y matrícula del alumnado, organización temporal de grupos, definición de evaluaciones, registro y corrección de notas grupales y conciliación docente. La implementación completa, las pruebas integrales y la comparación cuantitativa con el proceso manual corresponden a la Parte II.

## Problema central

El proceso manual mantiene información relacionada en registros separados y no ofrece por sí mismo controles confiables para:

- validar que la nota se encuentre entre 0 y 20;
- asegurar que grupo y evaluación pertenezcan al mismo curso;
- restringir la modificación al docente responsable;
- preservar la pertenencia histórica cuando un alumno cambia de grupo;
- evitar duplicaciones ante reintentos o respuestas perdidas;
- conservar el historial de correcciones;
- distinguir evaluaciones completas, faltantes y excepcionales;
- producir evidencia reproducible sin exponer datos personales.

La dificultad principal aparece cuando una actividad y un cambio de grupo ocurren en momentos distintos. La regla académica establece que la calificación corresponde al grupo al que el alumno pertenecía en el instante de la actividad, no al grupo vigente al guardar o corregir la nota. El modelo actual solo conserva el grupo presente, de modo que esa atribución histórica aún no puede demostrarse de forma íntegra.

## Pregunta orientadora

¿Cómo diseñar una automatización controlada para la evaluación grupal que reduzca registros dispersos, aplique reglas académicas y de autorización, preserve la historia de grupos y correcciones, y produzca evidencia verificable sin introducir complejidad arquitectónica innecesaria?

## Delimitación

La entrada es el alumnado autorizado y los grupos del curso; la importación inicial incorpora alumnos, pero nunca notas. La operación central es la definición de la evaluación y el registro o corrección de una nota por grupo. La salida prevista es una evaluación conciliada, visible para el docente, con todos los grupos esperados calificados o con una excepción explícita.

No forman parte de esta entrega la exportación oficial de actas, las correcciones individuales, las notificaciones, un panel administrativo separado, nuevos tipos de nota, funciones generales de LMS ni pruebas destructivas en producción.

## Fuente interna principal

Esta sección deriva de `docs/01-definicion/caso-evaluacion-grupal.md` y del alcance fijado en `specs/001-manage-group-evaluation/spec.md`.

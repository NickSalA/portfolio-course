# 2. Objetivos del trabajo académico — Parte I

## Objetivo general

Analizar el proceso de gestión de evaluaciones grupales en el caso académico documentado y proponer una solución de automatización y control, mediante la delimitación de sus requisitos, el diseño del proceso y del sistema y una representación de baja fidelidad, que sirva de base para su posterior implementación y evaluación.

## Objetivos específicos

1. Caracterizar el proceso reportado de registro de notas y organización de grupos, identificando actores, entradas, actividades repetitivas, dificultades y necesidades de control mediante un diagnóstico y un modelo del proceso.
2. Delimitar el alcance de la propuesta dentro de la plataforma académica, especificando requisitos, reglas de negocio, permisos y excepciones, y distinguiendo las dependencias de las funciones excluidas.
3. Diseñar el flujo propuesto, el modelo de información y la arquitectura de la solución, con especial atención a la pertenencia histórica a grupos, el registro y la corrección de notas y la conciliación docente.
4. Definir las validaciones, los controles y el tratamiento de errores y reintentos, y representarlos en un prototipo documental de baja fidelidad del recorrido docente, sin atribuirle funcionamiento ni validación con usuarios.
5. Formular un plan de implementación, pruebas y evaluación para la Parte II, con casos de aceptación, instrumentos de registro e indicadores cuya medición permita contrastar posteriormente la propuesta con el proceso manual.

## Correspondencia con entregables de semana 8

| Objetivo | Producto verificable en el informe                             | Sección o artefacto                   |
| -------- | -------------------------------------------------------------- | ------------------------------------- |
| OE1      | Diagnóstico documental y modelo del proceso reportado          | 01 y anexo A de 09                    |
| OE2      | Frontera, actores, requisitos y asuntos por validar            | 04 y anexo B de 09                    |
| OE3      | Flujo, arquitectura, entidades e invariantes propuestas        | 04, 05 y anexos A–C de 09             |
| OE4      | Matriz de controles, estados, errores y recorrido representado | 05 y prototipo P-01 del anexo D de 09 |
| OE5      | Cronograma, protocolo, indicadores y casos futuros             | 06 y anexos E–F de 09                 |

Los objetivos describen productos de análisis y diseño de la Parte I. Autenticar usuarios, registrar notas o conciliar evaluaciones son funciones esperadas del sistema; RLS, transacciones e identificadores de operación son decisiones de diseño; implementarlos, ejecutar pruebas y medir mejoras son actividades futuras de Parte II. Ninguno de estos últimos constituye un logro operativo de semana 8.

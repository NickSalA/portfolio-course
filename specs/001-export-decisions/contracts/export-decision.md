# Contrato propuesto de salida individual — EXP-01

Contrato documental para la futura exportación de #40; no indica una implementación ya disponible ni concede acceso.

## Fila del alumno

| Campo | Representación propuesta |
| --- | --- |
| Nombre, correo | Identifican al alumno; no añadir datos personales innecesarios. |
| Nota base por actividad | Número entre 0 y 20 con hasta dos decimales; pendiente en blanco y cero como número. |
| Promedio base | Numérico, visible con dos decimales si todas las notas existen; el cálculo usa precisión sin redondeo de presentación. |
| Saldo | Suma con signo de movimientos enteros activos, visible incluso con notas pendientes. |
| Puntos aplicados y excedente | Numéricos con signo; pueden ser fraccionarios; vacíos si el resultado completo está pendiente. |
| Promedio ajustado | Numérico con dos decimales, redondeado al final; vacío si hay una nota pendiente o no hay trabajos. |

No se presentan notas ajustadas por trabajo ni se infiere qué trabajo recibió puntos. Una nota sin atribución histórica conocida no se atribuye desde el grupo actual; el manejo concreto de esa situación pertenece a #40/GRP-06 y no se declara resuelto.

La futura descarga requiere autorización del docente responsable del curso en servidor y protección RLS para acceso directo. Deben verificarse acceso ajeno, sesión ausente y ausencia de mutaciones; no se amplía lectura estudiantil de notas. Estas garantías son requisitos futuros, no evidencia ejecutada.

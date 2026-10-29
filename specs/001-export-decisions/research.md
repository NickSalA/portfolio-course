# Investigación: EXP-01

## Capacidades actuales

**Decisión**: contrastar y reutilizar la generación XLSX cuando satisfaga el contrato; no reutilizar sin más sus datos ni declarar que existe exportación integrada.

**Fundamento**: `portfolio-coursse/components/teacher/grades/group-grades-table.tsx` exporta por grupo usando integrantes actuales y valores locales incluso no confirmados, con `-` para pendientes. `portfolio-coursse/components/teacher/points/export-points-button.tsx` exporta saldo y movimientos activos por separado y excluye anulados. Son hallazgos de lectura, no pruebas de navegación o descarga.

**Alternativa**: reconstruir ambos exportadores por defecto; descartada porque ya existe generación XLSX potencialmente reutilizable.

## Reglas numéricas indicadas por el usuario

**Decisión propuesta**: movimientos enteros; notas base de 0 a 20 con hasta dos decimales; límites ajustados 0–20; admitir aplicación parcial del último punto si el margen es fraccionario. El saldo no se consume. Anulados no participan en el saldo, pero se conserva su historia.

**Fundamento**: notas decimales pueden producir margen fraccionario. Ejemplo 19,50 y saldo +1: aplicados +0,50 y excedente +0,50. Para 0,25 y −1: aplicados −0,25 y excedente −0,75. La aplicación parcial no crea un movimiento fraccionario. R1 confirmó estos criterios y comunicó que R3 los aceptó; no se verificó una aprobación independiente en GitHub.

**Alternativa**: aplicar solo puntos completos; rechazada por el usuario para permitir completar el margen.

## Precisión y presentación

**Decisión propuesta**: no redondear valores intermedios; calcular desde notas originales. Mostrar ambos promedios con dos decimales, pero no usar el valor presentado del promedio base para calcular. El promedio final se redondea al centésimo más cercano, con empate hacia arriba: 13,505 → 13,51. R1 confirmó la visualización del promedio base con dos decimales y comunicó aceptación de R3; no se verificó aprobación independiente en GitHub.

**Fundamento**: dividir notas de dos decimales puede producir decimales adicionales o infinitos. Redondear una entrada intermedia puede alterar el resultado final.

**Alternativa**: usar el promedio base ya mostrado para calcular; descartada por riesgo de redondeo intermedio.

## Información y límites de acceso

**Decisión propuesta**: una fila por alumno con nombre y correo, notas base por actividad y columnas de promedio base, saldo, aplicados, excedente y promedio ajustado. Pendientes vacíos, saldo visible; no mostrar distribución de puntos por trabajo.

**Fundamento**: distingue cero, pendiente y ajuste individual sin atribuir una distribución no acordada. La población histórica y la fuente autorizada de datos pertenecen a #40 y GRP-06; no inferir historia de la matrícula actual.

**Alternativa**: mostrar ajustes por trabajo o incluir indiscriminadamente datos adicionales; descartada por falta de regla de distribución y minimización de datos.

## Límites de la investigación

Sin pruebas funcionales ni recorridos visuales en esta fase. El usuario se identificó como R1 (@NickSalA), confirmó las decisiones y comunicó que R3 las revisó y aceptó; falta registrar esta información en la evidencia y no se verificó una aprobación en GitHub. La discrepancia sobre actualizar especificaciones históricas no crea una dependencia adicional: se seguirá la ficha vigente de #38.

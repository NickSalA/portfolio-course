# Modelo conceptual para las decisiones de exportación

Este documento describe un contrato propuesto, no un esquema nuevo ni implementación de #39/#40.

## Alumno y actividad

- Alumno: nombre y correo; asociado a un curso.
- Actividad: identificador y nombre; su nota se atribuye según participación histórica establecida, nunca por grupo actual como sustituto.
- Nota base: valor entre 0 y 20 con hasta dos decimales, o pendiente; cero es distinto de pendiente. No se modifica con el cálculo.

## Movimiento y saldo

- Movimiento: alumno, importe entero no nulo, estado activo o anulado y registro histórico.
- Saldo: suma de movimientos activos; los anulados se excluyen pero permanecen en la historia. No se consume al exportar.

## Resultado individual propuesto

- Para `n > 0` notas completas `gᵢ`, suma `S`, saldo `B`:
    - `B ≥ 0`: margen `20n − S`; aplicados `min(B, margen)`.
    - `B < 0`: margen inferior `S`; aplicados `max(B, −S)`.
    - excedente `B − aplicados`; promedio base `S / n`; promedio ajustado `(S + aplicados) / n`.
- Las magnitudes aplicadas y excedentes pueden ser fraccionarias aunque los movimientos sean enteros. Estos valores no se persisten como movimientos.
- No redondear cálculos intermedios; mostrar promedios a dos decimales. El ajustado se redondea al centésimo más cercano con empate hacia arriba. La precisión real debe conservarse hasta este paso.
- Con alguna nota pendiente, o sin trabajos, no producir promedio completo ni dividir por cero; se mantienen vacíos promedios, aplicados y excedente, y el saldo permanece visible. R1 confirmó este caso y comunicó aceptación de R3; no se ha verificado aprobación independiente en GitHub.

## Estado de decisión

Una regla pasa de propuesta indicada por usuario a formalizada en el caso y finalmente revisada por R3. Una regla sin acuerdo o revisión requerida mantiene #38 bloqueado. No se atribuye confirmación al profesor.

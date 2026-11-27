# Especificación · EVA-01 #24 · Notas grupales

## Escenarios

### US1 · Registrar la nota del grupo

Dada una evaluación fechada con participantes históricos verificables, el docente responsable puede guardar una sola nota de 0 a 20 con hasta dos decimales. Un campo vacío conserva el estado pendiente y 0 se registra como número. La nota corresponde al grupo de la fecha de realización.

### US2 · Corregir una nota confirmada

El docente confirma el nuevo valor y explica el motivo. La corrección conserva valor anterior, nuevo, autor, hora, comentario existente y participantes originales. Cancelar, vaciar la celda o repetir el guardado sin cambiar el valor conserva el registro. Una edición desactualizada que solicita otro valor devuelve un conflicto.

### US3 · Proteger historial y permisos

El docente de otro curso, el estudiante y el visitante carecen de permiso de escritura. Si faltan fecha o evidencia histórica suficiente, se informa el bloqueo. Las notas antiguas sin atribución comprobable quedan visibles para el docente y bloqueadas para edición. La corrección de fecha conserva los destinatarios ya confirmados. Una evaluación con notas confirmadas no se puede borrar.

## Requisitos y aceptación

- **FR-01** · Unicidad por grupo y evaluación, escala 0–20, precisión de centésimas y pendiente distinto de cero.
- **FR-02** · Autorización y validación académica en servidor, con protección frente al acceso directo.
- **FR-03** · Destinatarios registrados en la primera nota, invariantes ante cambios de grupo y fecha.
- **FR-04** · Historial de correcciones y control de revisiones concurrentes.
- **FR-05** · Preservar las notas anteriores, distinguir historia desconocida y evitar borrados destructivos.

La aceptación exige pruebas con datos sintéticos, recorrido docente y revisión independiente. EVA-03 #26 amplía la matriz docente, EVA-04 #27 autoriza consulta estudiantil, EVA-07 #30 aborda recuperación de resultados inciertos y EXP-03 #40 desarrolla el XLSX histórico.

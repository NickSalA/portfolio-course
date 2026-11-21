# Decisiones técnicas

- **Eventos**. Un trigger sobre la matrícula preserva los recorridos existentes y captura las escrituras válidas de grupo y estado en la misma transacción. El bloqueo de escritura de la matrícula serializa sus transiciones.
- **Corte**. La migración toma una sola hora de corte tras excluir escrituras concurrentes sobre la matrícula. Registra únicamente estados coherentes. Si falta una base comprobable, la consulta queda desconocida.
- **Orden**. La base fija el instante con su reloj después de obtener la fila. Si el reloj produce un valor igual o anterior al inicio abierto, el siguiente límite avanza un microsegundo para mantener el orden. La fecha de una actividad sin hora pertenece a #23.
- **Conservación**. Las claves foráneas mantienen la identidad de la matrícula y del grupo por curso. La exclusión GiST impide rangos solapados. La eliminación de grupos con notas o historial queda restringida en PostgreSQL además del filtro del ajuste de capacidad.

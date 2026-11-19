# Modelo temporal

| Entidad | Regla |
| --- | --- |
| Intervalo | Matrícula, curso, cuenta, estado, grupo opcional, inicio y fin. El inicio es inclusivo y el fin exclusivo. |
| Grupo conocido | Matrícula activa con grupo del mismo curso. |
| Sin grupo | Matrícula activa con grupo nulo. |
| Inactiva | Matrícula dada de baja. El grupo previo permanece en su intervalo. |
| Desconocido | No hay intervalo probado para ese instante. |

Las matrículas y grupos referidos por el historial mantienen su identidad. Los cambios operativos usan baja o archivo, conservando las filas necesarias para explicar resultados.

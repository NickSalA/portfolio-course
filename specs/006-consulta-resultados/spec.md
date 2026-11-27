# EVA-04 #27 · Consulta estudiantil de resultados

## Escenarios

- **US1 · Nota propia.** El alumno con acceso vigente consulta la última nota si figura entre los destinatarios conservados al confirmarla. Un traslado posterior no cambia esa atribución. Una corrección aparece desde el siguiente acceso, con los mismos destinatarios.
- **US2 · Pendiente frente a cero.** Una actividad fechada con grupo histórico verificable devuelve una nota vacía si todavía no se ha registrado nota para ese grupo. El cero confirmado se devuelve como número. Las atribuciones desconocidas y las notas antiguas no verificadas se omiten.
- **US3 · Privacidad de notas y puntos.** El alumno requiere sesión académica, matrícula y autorización vigentes en el curso. El acceso presenta solo sus notas y sus puntos. La revocación impide nuevas lecturas con la sesión anterior. El docente conserva su acceso docente.

## Alcance y aceptación

La entrega cubre el contrato y su autorización en Supabase. EVA-05 #28 integra la consulta en el panel. La aceptación exige comprobar los casos autorizados y denegados en el acceso directo, sin exponer el padrón histórico ni restaurar lecturas de nota por grupo actual.

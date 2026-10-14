# 6. Plan futuro de implementación, pruebas y evaluación

## 6.1 Separación de entregas y cronograma tentativo

La guía fija dos hitos, no el calendario intermedio. La distribución siguiente es una propuesta del equipo, pendiente de acuerdo y fechas concretas.

| Momento        | Actividad y producto previsto                                                                                       | Naturaleza                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Hasta semana 8 | Diagnóstico documental, objetivos, alcance, requisitos, arquitectura, modelo, controles y prototipo documental P-01 | Parte I: análisis y diseño                                               |
| Semana 8       | Maquetar informe, preparar PowerPoint y presentar el avance                                                         | Entrega requerida; no se afirma que PDF final o PowerPoint estén creados |
| Semanas 9–10   | Confirmar reglas abiertas, preparar datos sintéticos y entorno aislado, concretar contratos y pruebas               | Plan de Parte II                                                         |
| Semanas 11–12  | Implementar pertenencias temporales, actividades fechadas y registro/corrección controlados                         | Plan de Parte II                                                         |
| Semanas 13–14  | Integrar conciliación y señales; probar permisos, fallos, concurrencia y accesibilidad                              | Plan de Parte II                                                         |
| Semana 15      | Ejecutar comparación manual/plataforma, analizar indicadores y limitaciones                                         | Plan de Parte II                                                         |
| Semana 16      | Consolidar resultados efectivamente obtenidos, informe y PowerPoint final                                           | Parte II: implementación, pruebas y evaluación                           |

La historia temporal precede a la atribución de notas y esta precede a la conciliación. Las entradas académicas se deben verificar antes del recorrido central. Los estados de tareas del repositorio no representan avance académico de esta propuesta.

## 6.2 Estrategia de pruebas prevista para Parte II

- **Datos y seguridad:** restricciones de rango y curso, autorización por actor, acceso directo a datos, intervalos, capacidad, atomicidad y correcciones.
- **Lógica de aplicación:** normalización de entradas, fechas y mapeo de errores y resultados.
- **Recorrido de usuario:** definición de actividad, registro, corrección, fallo, reintento y conciliación; consulta estudiantil restringida.
- **Revisión transversal:** teclado, foco, nombres accesibles, mensajes no dependientes del color, privacidad de señales y muestreo de tiempos.

Las pruebas usarían datos sintéticos y un entorno aislado. Para cada caso se registraría identificador, regla, entrada, resultado esperado, fecha, versión, entorno, observado y discrepancias. La matriz de 09 contiene casos diseñados, sin resultados de ejecución.

## 6.3 Protocolo comparativo propuesto

Se prevé comparar registro y conciliación manual frente al flujo propuesto con la misma actividad y volumen de grupos. La preparación de periodos y la importación inicial quedan fuera del cronometraje principal, para no mezclar el núcleo con sus dependencias. Se conservarían iguales las entradas, las reglas y los casos de excepción.

Antes de medir se acordarían volumen, zona horaria, participantes, condiciones y entrenamiento equivalente. Se proponen al menos tres repeticiones por método, alternando el orden para reducir el efecto de aprendizaje y documentando limitaciones. Una muestra pequeña no permite generalizar resultados a toda la institución. Los escenarios de fallo se analizarían además por separado para no confundir tiempo normal con recuperación.

## 6.4 Indicadores a medir, no resultados

| Indicador                       | Definición prevista                                                                                         | Instrumento futuro                               |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Tiempo total                    | Mediana de minutos de registro y conciliación por evaluación                                                | Ficha de inicio/fin, volumen y condiciones       |
| Cobertura de notas              | Grupos con nota válida / grupos esperados                                                                   | Conteo y detalle de faltantes                    |
| Atención del proceso            | (Grupos con nota válida + grupos con excepción explícita) / grupos esperados, sin doble conteo              | Conciliación; informar excepciones separadamente |
| Correcciones y duplicados       | Conteos y tasas separados por operaciones confirmadas; distinguir corrección académica de error de registro | Historia y clasificación de causas               |
| Tiempo de conciliación          | Minutos de revisión final del curso, actividad, grupos y notas                                              | Ficha de tiempos y discrepancias                 |
| Reintento seguro                | Casos reintentados con un único estado final correcto / casos de reintento ejecutados                       | Correlación de intentos y estado persistido      |
| Detección de entradas inválidas | Casos inválidos rechazados y comunicados correctamente / casos inválidos previstos                          | Matriz esperado/observado                        |
| Respuesta interactiva           | Percentil 95 del tiempo hasta confirmación visible, con volumen acordado                                    | Muestra registrada; excluir importaciones largas |

Se informaría «no aplicable» cuando un denominador sea cero. Los grupos esperados se definirían con participación histórica y las reglas acordadas, no simplemente contando grupos actuales. Las excepciones no se presentarían como calificaciones ni como éxito automático.

Las fuentes técnicas sugieren reducir 50 % la mediana de tiempo y alcanzar 2 segundos en el 95 % de confirmaciones. Se conservan solo como **metas candidatas por validar**, no compromisos comprobados. Detectar todos los casos definidos sería un criterio sobre esa batería, no garantía universal. No hay línea base ni mediciones académicas de Parte I que permitan afirmar mejoras.

## 6.5 Organización propuesta

Las fuentes contemplan cinco integrantes; nombres y asignaciones están pendientes.

| Área                      | Parte I                                      | Parte II prevista                   |
| ------------------------- | -------------------------------------------- | ----------------------------------- |
| Dominio y coordinación    | Diagnóstico, alcance y consultas al docente  | Verificación de entradas y reglas   |
| Experiencia               | Recorrido y representación P-01              | Interacciones y accesibilidad       |
| Datos y seguridad         | Modelo e invariantes                         | Persistencia y autorización         |
| Calidad                   | Casos y criterios diseñados                  | Pruebas y registro de discrepancias |
| Evidencia y documentación | Plan, bibliografía e insumos de presentación | Señales, medición e informe final   |

Se propone revisión cruzada y cambios acotados conforme a la gobernanza del repositorio. Un check técnico o un despliegue no demostraría por sí solo eficacia del proceso académico.

## 6.6 Guion de presentación de avance

Preparar un PowerPoint con: problema y fuente del caso; objetivo y frontera; actores y reglas; proceso reportado y propuesto; arquitectura y modelo; recorrido P-01; controles y excepciones; entregables de Parte I y asuntos abiertos; plan hasta semana 16. Este guion no constituye un archivo PowerPoint ni una exposición ya realizada.

# Equipo y flujo de trabajo

> **Composición confirmada:** cinco integrantes. **Organización propuesta:** responsabilidades primarias, suplencias y revisión cruzada ajustadas a los hitos M1–M4. Los nombres, usuarios y disponibilidad se completarán antes de repartir el backlog; las asignaciones de este documento no son nombramientos personales ya acordados.
>
> Relacionados: [calendario y contingencia](calendario-y-contingencia.md) · [milestones](milestones.md) · [backlog por integrante](../backlog/por-integrante.md) · [gestión del backlog](backlog-y-responsabilidades.md) · [caso vigente](../01-definicion/caso-evaluacion-grupal.md).

## Parte A. Organización del equipo

### 1. Asignación nominal

No se copian nombres, seis roles ni cargas del proyecto utilizado como referencia. La distribución deberá contrastarse con la experiencia y las horas disponibles de estas cinco personas.

| Identificador | Responsabilidad primaria propuesta             | Integrante    | Usuario GitHub | Disponibilidad semanal |
| ------------- | ---------------------------------------------- | ------------- | -------------- | ---------------------- |
| R1            | Tech Lead, facilitación, dominio e integración | Por completar | Por completar  | Por acordar            |
| R2            | Experiencia e interfaces docente y estudiantil | Por completar | Por completar  | Por acordar            |
| R3            | Datos, reglas académicas y seguridad           | Por completar | Por completar  | Por acordar            |
| R4            | Calidad, pruebas y evaluación                  | Por completar | Por completar  | Por acordar            |
| R5            | Seguimiento, comunicaciones y operación        | Por completar | Por completar  | Por acordar            |

Estos roles no son cinco departamentos ni impiden desarrollar tareas de otra área. Cada historia tendrá una persona responsable y una revisora distinta. La documentación y las pruebas del cambio son responsabilidad de su autor, con apoyo de los roles especializados.

### 2. Responsabilidades y productos

#### R1. Tech Lead y facilitador del equipo

- Mantener problema, objetivos y alcance coherentes con los acuerdos del caso.
- Facilitar la distribución semanal, revisar capacidad y gestionar dependencias y bloqueos.
- Desarrollar y verificar la preparación del curso, incorporación del padrón y vinculación de alumnos, con apoyo de R3.
- Coordinar la integración entre registro, consulta, reclamos y exportación; no asumir toda la implementación pendiente.
- Coordinar la síntesis semanal y la preparación final del informe, con aportes de todos.

**Productos principales:** decisiones y prioridades documentadas, recorrido de preparación del curso e integración demostrable. R1 no es aprobador de su propio trabajo ni debe revisar todos los PR del equipo.

#### R2. Experiencia e interfaces docente y estudiantil

- Mantener el prototipo y los recorridos de uso alineados con el alcance.
- Desarrollar las pantallas de organización de grupos, registro docente y consulta estudiantil, coordinándose con R1 y R3.
- Compartir con R5 el desarrollo de las pantallas de reclamos y exportación para evitar un único cuello de botella de interfaz.
- Atender estados de carga, vacío, pendiente, error y confirmación; navegación por teclado, etiquetas y mensajes claros.
- Aportar pruebas de sus componentes y evidencia visual con datos sintéticos.

**Productos principales:** recorridos comprensibles y accesibles para ambos actores, prototipo actualizado y pruebas de interacción correspondientes.

#### R3. Datos, reglas académicas y seguridad

- Mantener la coherencia entre curso, grupo, evaluación y participantes históricos.
- Desarrollar la conservación de pertenencias, el registro y corrección de notas y puntos y los controles de acceso.
- Definir y probar con R5 la privacidad y unicidad de reclamos y el cálculo de exportación.
- Preparar cambios de datos mediante migraciones nuevas; proteger registros originales y evitar duplicación ante reintentos.
- Revisar cambios sensibles, pero compartir conocimiento y pruebas para que ninguna integración dependa permanentemente de una sola persona.

**Productos principales:** operaciones académicas consistentes, permisos por recurso, historia preservada y pruebas de reglas y autorización.

#### R4. Calidad, pruebas y evaluación

- Organizar escenarios sintéticos, criterios de aceptación y pruebas de los recorridos completos.
- Revisar permisos, datos pendientes, grupos históricos, duplicados, reclamos y exportación con los responsables de cada función.
- Mantener comprobaciones automatizadas pertinentes con apoyo de R3 y R5, sin asumir que un check aprobado demuestra todo el proceso.
- Preparar y ejecutar con el equipo la evaluación de registro y seguimiento y consolidar sus resultados y limitaciones.
- Ayudar a reproducir defectos y verificar correcciones. Los autores siguen siendo responsables de probar sus cambios.

**Productos principales:** matriz de casos, evidencias reproducibles e indicadores observados. No se asignan porcentajes de cobertura o metas de mejora que el equipo no haya acordado.

#### R5. Seguimiento, comunicaciones y operación

- Desarrollar con R3 el recorrido de reclamos grupales e individuales: creación, estados, respuesta final y prevención de duplicados.
- Implementar el aviso por correo al docente y atender configuración, fallos y señales seguras, sin exponer información académica.
- Desarrollar con R3 la exportación XLSX, respetando las notas base y el supuesto de aplicación de puntos; compartir sus pantallas con R2.
- Apoyar a R4 en pruebas del proceso y configuración de ejecución y a R1 en la integración.
- Consolidar referencias de operación y demostración; no redactar por su cuenta toda la documentación de las demás personas.

**Productos principales:** seguimiento y exportación integrados, aviso docente verificable y documentación de su operación y limitaciones.

### 3. Responsable principal, suplencia y revisión

La siguiente matriz es una propuesta de coordinación. Un suplente conoce el recorrido y puede continuar un bloqueo; no es una persona disponible sin límite ni un revisor automáticamente independiente si también escribió el cambio.

| Recorrido o responsabilidad                | Responsable principal | Suplente/apoyo         | Revisión propuesta, si no participó en la autoría       |
| ------------------------------------------ | --------------------- | ---------------------- | ------------------------------------------------------- |
| Preparación de curso, padrón y acceso      | R1                    | R3                     | R4 y R3 para permisos                                   |
| Grupos, ventana y experiencia de selección | R2                    | R1                     | R3 para reglas y R4 para recorrido                      |
| Participación histórica, notas y puntos    | R3                    | R1                     | R4 para casos; R5 para integración                      |
| Consulta de resultados propios             | R2                    | R5                     | R3 para visibilidad y R4 para interacción               |
| Reclamos y respuesta docente               | R5                    | R2                     | R3 para privacidad/unicidad; R4 para recorrido          |
| Aviso por correo y su recuperación         | R5                    | R4                     | R1 o R3                                                 |
| Cálculo de puntos y archivo XLSX           | R5                    | R3                     | R4 para ejemplos, permisos y repetición                 |
| Pruebas integradas y evaluación            | R4                    | R1                     | Otro integrante que no sea autor del resultado revisado |
| Integración y seguimiento semanal          | R1                    | R5                     | Equipo                                                  |
| Documentación de cada función              | Autor de la función   | Suplente del recorrido | Revisor de ese cambio                                   |

Si autor y suplente desarrollan juntos, se asigna un tercer integrante para la revisión. Las decisiones académicas sobre calificaciones y reclamos pertenecen al docente usuario del sistema, no a estos roles del equipo de desarrollo.

### 4. Distribución a lo largo de M1–M4

El [calendario](calendario-y-contingencia.md) mantiene los periodos. Esta tabla describe contribuciones esperadas, no estimaciones de horas ni asignaciones irrevocables de historias.

| Rol | M1: preparación y participantes                                                     | M2: registro y consulta                                 | M3: reclamos y exportación                     | M4: evaluación y cierre                             |
| --- | ----------------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------- |
| R1  | Preparación del curso, revisión de capacidades existentes y reglas abiertas         | Integración del registro y ayuda ante bloqueos          | Integración de recorridos y control de alcance | Correcciones compartidas y síntesis del desarrollo  |
| R2  | Selección de grupos y representación de recorridos                                  | Registro y consulta de resultados                       | Interfaces de seguimiento compartidas con R5   | Accesibilidad, claridad y defectos de interacción   |
| R3  | Acceso, coherencia e historia de participación                                      | Registro, correcciones y permisos                       | Unicidad de reclamos y cálculo con R5          | Pruebas y correcciones de integridad y privacidad   |
| R4  | Casos sintéticos y comprobaciones de entradas/grupos                                | Pruebas de consulta, permisos y correcciones            | Pruebas de reclamos, aviso y XLSX              | Evaluación del proceso y evidencias                 |
| R5  | Preparar configuración de correo, recorrido de reclamos y reglas/columnas de salida | Adelantar seguimiento y cálculo con entradas sintéticas | Integrar reclamos, aviso y exportación         | Recuperación, repetición de acciones y demostración |

**Medidas para equilibrar la carga:**

- R5 concentra dos recorridos en M3: adelanta preparación y casos desde M1, con R3 en cálculo y R2 en interfaces.
- R3 no debe recibir a última hora todas las reglas de acceso: cada historia se revisa con sus casos y se comparte conocimiento con suplentes.
- R2 comparte interfaces de seguimiento con R5; no se pospone toda integración hasta que una sola persona complete las pantallas.
- R4 prepara pruebas desde M1 y cada autor aporta las suyas; no se concentra toda la calidad al llegar a M4.
- R1 también desarrolla funciones delimitadas, pero no absorbe todos los PR, la integración y el informe completo.
- El reparto se ajusta por esfuerzo estimado, dependencias y disponibilidad, no por igualar el número de Issues. Si alguien supera su capacidad, se redistribuye antes de comprometer la semana.

### 5. Coordinación semanal propuesta

R1 combina liderazgo técnico y facilitación del equipo, con funciones de planificación y desbloqueo similares a las de un Scrum Master. No se afirma que se aplica Scrum formalmente: se mantiene un ciclo semanal compatible con los hitos y la disponibilidad por confirmar.

| Momento                             | Participación                                | Resultado                                                                                               |
| ----------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Inicio de semana                    | Los cinco                                    | Objetivo del hito, trabajo preparado, responsable/revisor, dependencias y capacidad revisada            |
| Seguimiento breve durante la semana | Cada responsable; coordinación ante bloqueos | Avance, siguiente acción y bloqueo registrados, de forma asíncrona o en reunión breve según se acuerde  |
| Revisión de cambios                 | Autor y revisor distinto                     | Criterios, pruebas, documentación y observaciones resueltas antes de integrar                           |
| Cierre semanal                      | Los cinco                                    | Demostración, pruebas y documentación de lo alcanzado; pendientes e impacto sobre el hito siguiente     |
| Ajuste del plan                     | Equipo, facilitado por R1                    | Acciones de mejora con responsable; contingencia si el hito o la preparación posterior quedan en riesgo |

No se fijan días u horas de reuniones sin acuerdo. Una ausencia debe comunicarse para activar la suplencia del trabajo bloqueante y revisar la carga.

### 6. Documentación y entregables compartidos

- Cada autor actualiza los documentos y las pruebas afectados por su cambio, no únicamente al finalizar el hito.
- R1 coordina la síntesis semanal; R4 consolida resultados de pruebas; R5 aporta configuración y límites de operación de sus recorridos; R2 y R3 mantienen las descripciones que les correspondan.
- Las decisiones de alcance quedan en el caso y glosario; los resultados observados, en el [registro de evaluación](../automatizaciones/gestion-evaluacion-grupal/evaluacion.md). No se registran solo en el chat.
- Informe final, PowerPoint y ensayo se preparan después del desarrollo según el calendario, con aportes de todos. Debe reservarse ese tiempo antes de la entrega real.
- El uso de herramientas de asistencia no exime de comprender, revisar y probar el trabajo entregado. No se inventa un registro de IA obligatorio tomado de otro curso.

## Parte B. Flujo del repositorio

### 7. Normas y ramas

La [constitución](../../.specify/memory/constitution.md) es la referencia normativa. [CONTRIBUTING.md](../../CONTRIBUTING.md) explica la contribución; este documento no declara configuradas ramas o protecciones remotas que no se hayan comprobado.

| Rama                | Origen y destino                                             | Uso                                                                                       |
| ------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `main`              | Recibe versiones validadas y correcciones urgentes           | Referencia de producción                                                                  |
| `develop`           | Integra trabajo aprobado                                     | Preparación de la siguiente versión                                                       |
| `feature/<nombre>`  | `develop` → `develop` por PR                                 | Función nueva o incremento delimitado; también puede agrupar un cambio documental acotado |
| `bugfix/<nombre>`   | `develop` → `develop` por PR                                 | Corrección regular                                                                        |
| `release/<version>` | `develop` → `main`, con sincronización de vuelta a `develop` | Preparación de versión validada                                                           |
| `hotfix/<nombre>`   | `main` → `main` y `develop`                                  | Corrección urgente de producción                                                          |

No se integra directamente a las ramas compartidas ni se aprueba el PR propio. Antes de adoptar este flujo en el remoto deben comprobarse ramas, protección, destino de PR y cobertura de CI; no se asume su existencia por figurar en el documento. Una discrepancia entre configuración y norma se registra y resuelve, no se ignora.

### 8. Commits y pull requests

Formato de mensajes: `tipo(alcance): descripción imperativa`, primera línea de hasta 72 caracteres y sin punto final. Tipos permitidos: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `build`, `ci`.

Ejemplos:

```text
feat(grades): mostrar notas de las actividades del alumno
test(claims): cubrir reclamos grupales duplicados
docs(planning): actualizar criterios del hito de registro
```

Recorrido propuesto de cada cambio:

1. Acordar resultado, criterios, responsable y revisión distinta de la autoría.
2. Revisar capacidades existentes y desarrollar el incremento en una rama según el flujo vigente.
3. Ejecutar comprobaciones y pruebas pertinentes, en un entorno aislado cuando afecten datos.
4. Abrir PR con resumen, vínculo a la tarea si existe Issue, pruebas, limitaciones y documentación actualizada. No se inventan números de Issues.
5. Revisar reglas, privacidad, casos válidos/erróneos y evidencia; resolver observaciones.
6. Integrar solo con aprobación ajena y checks aplicables aprobados; actualizar estado y documentación del hito.

Los criterios de preparación y cierre de historias se mantienen en [backlog y responsabilidades](backlog-y-responsabilidades.md). Si el autor o el revisor cambia, debe quedar registrado. Secretos, datos de alumnos, notas reales y textos privados de reclamos no se adjuntan a evidencia pública.

### 9. Pruebas, CI y versiones

Los scripts disponibles y los checks realmente configurados se describen en el [estado actual](../03-calidad-y-operacion/estado-actual.md). CI de lint/tipos/build no demuestra por sí sola privacidad, exactitud del XLSX ni funcionamiento del aviso por correo; las pruebas pertinentes se ejecutan y documentan además.

Las versiones siguen SemVer conforme a la constitución. No se fijan etiquetas por hito ni una versión final arbitraria. Las migraciones tienen su secuencia independiente y deben agregarse como archivos nuevos, sin editar las ya aplicadas. Publicar una versión no equivale a desplegar la aplicación.

### 10. Acuerdos por completar antes de asignar el backlog

- Nombres y usuarios de las cinco personas y correspondencia con R1–R5.
- Disponibilidad semanal y experiencia para ajustar el reparto propuesto.
- Quién mantiene permisos del repositorio e integra PR aprobados, sin autorrevisión.
- Canal de coordinación y modalidad de los puntos de control semanales.
- Estado real de ramas, protecciones y CI respecto del flujo documentado.
- Responsables y revisores por historia, estimaciones y suplencia efectiva ante ausencias.

No se ejecutan cambios remotos, nombramientos o asignaciones automáticamente al redactar este documento.

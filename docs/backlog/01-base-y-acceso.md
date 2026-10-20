# Backlog 01 — Base, acceso e incorporación

> Convenciones e índices por rol: [README](README.md). Alcance: [caso](../01-definicion/caso-evaluacion-grupal.md). Hitos: [M1–M4](../04-gestion/milestones.md). La aplicación ya existe: verificar y completar, no crear un proyecto nuevo ni sustituir su autenticación.

### BASE-01 · Revisar capacidades existentes y concretar el trabajo restante

**Rol:** R1 · **Revisor:** R4 · **Milestone:** M1 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** Ninguno

**GitHub:** [#10](https://github.com/NickSalA/portfolio-course/issues/10) · **Asignado:** @NickSalA · **Revisión propuesta:** @fabrizio25504

- [ ] Contrastar acceso, cursos, importación, grupos, notas, puntos y descarga existente con el caso vigente.
- [ ] Identificar por recorrido qué se conserva, qué requiere corrección y qué falta, sin ejecutar pruebas destructivas en producción.
- [ ] Registrar decisiones pendientes y carga estimada por rol antes de comprometer la semana.

**Aceptación:** inventario verificable con fuentes y brechas; no se exige actualizar `specs/` ni se reconstruyen funciones aceptadas.

**Documentación:** estado actual, caso y notas de planificación; sin marcar aceptado solo por existir código.

### BASE-02 · Preparar datos sintéticos y comprobaciones aisladas

**Rol:** R4 · **Revisor:** R3 · **Milestone:** M1 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** Ninguno

**GitHub:** [#11](https://github.com/NickSalA/portfolio-course/issues/11) · **Asignado:** @fabrizio25504 · **Revisión propuesta:** @MathiMomos

- [ ] Revisar la configuración de pruebas existente y comprobar el aislamiento de los datos.
- [ ] Preparar dos docentes, cursos separados, alumnos autorizados/no autorizados, grupos y actividades de prueba.
- [ ] Incorporar participantes trasladados, puntos y notas pendientes para reutilizarlos en los demás módulos.
- [ ] Registrar comandos y resultados reales; separar fallos de infraestructura de fallos funcionales.

**Aceptación:** un compañero puede reproducir los datos y ejecutar una comprobación inicial sin secretos ni conexión destructiva a producción.

**Documentación:** instrucciones de prueba y registro de evaluación.

### BASE-03 · Verificar autenticación y acceso académico por recurso

**Rol:** R3 · **Revisor:** R4 · **Milestone:** M1 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** BASE-02

**GitHub:** [#12](https://github.com/NickSalA/portfolio-course/issues/12) · **Asignado:** @MathiMomos · **Revisión propuesta:** @fabrizio25504

- [ ] Verificar el inicio de sesión existente y la separación de identidad, rol y autorización de curso.
- [ ] Probar alumno sin autorización, docente ajeno y sesión ausente.
- [ ] Completar controles de consulta y modificación sin confiar solo en botones o rutas ocultas.

**Aceptación:** usuarios autorizados acceden a sus cursos; las operaciones ajenas se deniegan por interfaz y acceso directo. No se crea registro público ni otro mecanismo de identidad.

**Documentación:** matriz de acceso y evidencia de casos válidos y denegados.

### BASE-04 · Preparar periodos y cursos bajo responsabilidad docente

**Rol:** R1 · **Revisor:** R3 · **Milestone:** M1 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** BASE-03

**GitHub:** [#13](https://github.com/NickSalA/portfolio-course/issues/13) · **Asignado:** @NickSalA · **Revisión propuesta:** @MathiMomos

- [ ] Verificar selección y gestión de periodos y cursos existentes.
- [ ] Comprobar que las acciones afectan solo cursos del docente responsable.
- [ ] Corregir únicamente brechas demostradas y preparar un curso de ejemplo.

**Aceptación:** el docente prepara un curso para incorporar alumnos sin leer o alterar cursos de otro docente.

**Documentación:** recorrido de preparación y pruebas correspondientes.

### BASE-05 · Validar e incorporar el padrón de alumnos

**Rol:** R1 · **Revisor:** R4 · **Milestone:** M1 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** BASE-04

**GitHub:** [#14](https://github.com/NickSalA/portfolio-course/issues/14) · **Asignado:** @NickSalA · **Revisión propuesta:** @fabrizio25504

- [ ] Verificar la carga CSV/XLSX y los campos realmente admitidos; el archivo incorpora alumnos, no notas.
- [ ] Mostrar filas válidas, incompletas, repetidas y existentes con razones comprensibles.
- [ ] Confirmar la vinculación al curso indicado y evitar duplicados al repetir la carga.
- [ ] Probar archivo mixto, vacío y referencias a otro curso.

**Aceptación:** los conteos y rechazos coinciden con el conjunto sintético; repetir no crea autorizaciones o matrículas adicionales.

**Documentación:** formato de entrada, reglas de validación y resultados de prueba.

### BASE-06 · Vincular autorización y matrícula a la cuenta correcta

**Rol:** R3 · **Revisor:** R1 · **Milestone:** M1 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** BASE-03, BASE-05

**GitHub:** [#15](https://github.com/NickSalA/portfolio-course/issues/15) · **Asignado:** @MathiMomos · **Revisión propuesta:** @NickSalA

- [ ] Verificar coincidencia de identidad y autorización activa del curso.
- [ ] Probar autorización anterior y posterior al primer inicio de sesión.
- [ ] Comprobar que repetir la vinculación no duplica matrícula ni elimina la selección de grupo.

**Aceptación:** solo la cuenta correspondiente se vincula al curso; alumno no autorizado queda sin datos académicos y sincronizaciones posteriores conservan la pertenencia acordada.

**Documentación:** reglas de vinculación y pruebas de ambos órdenes de eventos.

### BASE-07 · Revisar la experiencia de acceso y contexto académico

**Rol:** R2 · **Revisor:** R4 · **Milestone:** M1 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** BASE-03, BASE-04

**GitHub:** [#16](https://github.com/NickSalA/portfolio-course/issues/16) · **Asignado:** @RobertoPizarro · **Revisión propuesta:** @fabrizio25504

- [ ] Verificar ingreso, cierre de sesión y navegación docente/alumno existentes.
- [ ] Hacer visibles el curso seleccionado y los estados de acceso, carga y error.
- [ ] Mantener mensajes claros sin revelar cursos o registros ajenos.

**Aceptación:** ambos actores reconocen su contexto y pueden continuar su recorrido; una sesión sin autorización no aparenta acceso a un curso.

**Documentación:** recorrido y representación de pantallas actualizada.

### BASE-08 · Preparar configuración y prueba de aviso por correo

**Rol:** R5 · **Revisor:** R1 · **Milestone:** M1 · **Prioridad:** Alta · **Estado:** Backlog · **Bloqueado por:** Ninguno

**GitHub:** [#17](https://github.com/NickSalA/portfolio-course/issues/17) · **Asignado:** @Forex549 · **Revisión propuesta:** @NickSalA

- [ ] Elegir y documentar el medio de envío compatible con el entorno, requisitos de remitente, costo y límites si corresponde.
- [ ] Preparar destinatario de prueba autorizado y credenciales fuera del repositorio.
- [ ] Acordar aviso breve con enlace y tratamiento de error, sin contenido académico o texto del reclamo.

**Aceptación:** configuración de prueba disponible o bloqueo explícito con responsable antes de M3; el envío real ligado al reclamo se implementa en REC-06, no se duplica aquí.

**Documentación:** variables de ejemplo sin valores secretos y condiciones de operación del aviso.

# Plataforma académica

Este contexto define el lenguaje del sistema que permite a un docente gestionar cursos, alumnos y puntos adicionales, con un portafolio público separado.

## Personas y acceso

**Docente**:
Persona autorizada para gestionar uno o más cursos, sus grupos, matrículas y movimientos de puntos.
_Avoid_: Profesor cuando se necesite distinguir el rol del usuario de su título académico.

**Alumno**:
Persona que tiene una matrícula activa en un curso y accede usando su cuenta institucional de Google.
_Avoid_: Usuario cuando se hable de su relación académica.

**Cuenta autenticada**:
Identidad verificada por Google y mantenida por Supabase Auth. No implica autorización académica.
_Avoid_: Alumno registrado.

**Alumno autorizado**:
Correo institucional cargado previamente por un docente mediante CSV, antes o después del primer inicio de sesión.
_Avoid_: Alumno registrado, usuario permitido.

## Estructura académica

**Periodo académico**:
Intervalo institucional que agrupa cursos de una edición académica. Se identifica por año y periodo (`0` para verano, `I` o `II`); su código, como `2025-0` o `2025-I`, se genera automáticamente. Sus fechas son editables y su ciclo de vida define si admite operación académica.

**Estado de periodo**:
Ciclo de vida de un periodo académico: `draft`, `upcoming`, `current` o `closed`. Las fechas no determinan automáticamente el estado.
_Avoid_: Semestre cuando se esté nombrando el periodo completo.

**Curso**:
Espacio académico administrado por un docente dentro de un periodo académico que contiene alumnos y, opcionalmente, grupos.
_Avoid_: Asignatura cuando no sea necesario reflejar terminología institucional.

**Grupo**:
Subdivisión opcional generada por el sistema para un curso a partir de la cantidad de alumnos autorizados y la capacidad definida por el docente. Se identifica por una posición visible, como `Grupo 1`, no por un nombre escrito manualmente.
_Avoid_: Equipo cuando se trate de la organización administrativa del curso.

**Ventana de selección de grupo**:
Intervalo con fecha, hora y zona horaria institucional durante el cual un alumno matriculado puede elegir o cambiar su grupo. Fuera de ese intervalo, solo una operación del docente puede modificarlo.

**Matrícula**:
Relación entre un alumno autenticado y un curso. Puede tener un grupo opcional y un estado de acceso.
_Avoid_: Inscripción cuando se hable de un registro persistente; inscripción puede usarse para la acción.

**Código de matrícula**:
Dato institucional opcional de referencia del alumno. No es su identidad de acceso ni la clave de autorización; el correo institucional identifica la autorización.

**Estado de matrícula**:
Estado que indica si una matrícula está pendiente, activa, inactiva o bloqueada.

## Puntos

**Movimiento de puntos**:
Registro inmutable de una variación de puntos asignada por un docente a una matrícula, con motivo opcional.
_Avoid_: Punto cuando se hable del registro histórico completo.

**Saldo de puntos**:
Total derivado de los movimientos de puntos de una matrícula.
_Avoid_: Puntos asignados cuando se necesite distinguir el total del historial.

## Importación

**Carga de alumnos**:
Proceso mediante el cual el docente importa un CSV dentro de un periodo y autoriza correos, datos personales y cursos. El CSV puede crear cursos que aún no existan en ese periodo.
_Avoid_: Registro de alumnos cuando el proceso también actualiza autorizaciones existentes.

**Autorización**:
Permiso previo asociado a un correo para acceder a un curso concreto. No es una sesión ni una matrícula autenticada.

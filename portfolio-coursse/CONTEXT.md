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
Intervalo institucional que agrupa cursos de una edición académica, identificado por un código como `2025-I` o `2025-II`.
_Avoid_: Semestre cuando la institución también pueda usar trimestres u otra nomenclatura.

**Curso**:
Espacio académico administrado por un docente dentro de un periodo académico que contiene alumnos y, opcionalmente, grupos.
_Avoid_: Asignatura cuando no sea necesario reflejar terminología institucional.

**Grupo**:
Subdivisión opcional de un curso con nombre y capacidad máxima. Un alumno puede elegirlo durante la ventana de selección definida por el docente.
_Avoid_: Equipo cuando se trate de la organización administrativa del curso.

**Ventana de selección de grupo**:
Intervalo durante el cual un alumno matriculado puede elegir o cambiar su grupo. Fuera de ese intervalo, solo una operación del docente puede modificarlo.

**Matrícula**:
Relación entre un alumno autenticado y un curso. Puede tener un grupo opcional y un estado de acceso.
_Avoid_: Inscripción cuando se hable de un registro persistente; inscripción puede usarse para la acción.

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
Proceso mediante el cual el docente importa un CSV y autoriza correos, datos personales, curso y grupo opcional.
_Avoid_: Registro de alumnos cuando el proceso también actualiza autorizaciones existentes.

**Autorización**:
Permiso previo asociado a un correo para acceder a un curso concreto. No es una sesión ni una matrícula autenticada.

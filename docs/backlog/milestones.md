# Issues por milestone

> Este es el índice de asignación de trabajo, no otro calendario. Periodos y contingencia: [calendario](../04-gestion/calendario-y-contingencia.md). Resultados y criterios: [milestones](../04-gestion/milestones.md). Las dependencias están en cada ficha y deben resolverse antes de aceptar su cierre; diseño y pruebas pueden adelantarse.

## M1

**GitHub:** [M1. Curso y participantes preparados](https://github.com/NickSalA/portfolio-course/milestone/1).

**16 issues.**

| Issue | Resultado | Responsable | Dependencias |
| --- | --- | --- | --- |
| [BASE-01](01-base-y-acceso.md#base-01--revisar-capacidades-existentes-y-concretar-el-trabajo-restante) | Revisar capacidades existentes y concretar el trabajo restante | R1 | Ninguno |
| [BASE-02](01-base-y-acceso.md#base-02--preparar-datos-sintéticos-y-comprobaciones-aisladas) | Preparar datos sintéticos y comprobaciones aisladas | R4 | Ninguno |
| [BASE-03](01-base-y-acceso.md#base-03--verificar-autenticación-y-acceso-académico-por-recurso) | Verificar autenticación y acceso académico por recurso | R3 | BASE-02 |
| [BASE-04](01-base-y-acceso.md#base-04--preparar-periodos-y-cursos-bajo-responsabilidad-docente) | Preparar periodos y cursos bajo responsabilidad docente | R1 | BASE-03 |
| [BASE-05](01-base-y-acceso.md#base-05--validar-e-incorporar-el-padrón-de-alumnos) | Validar e incorporar el padrón de alumnos | R1 | BASE-04 |
| [BASE-06](01-base-y-acceso.md#base-06--vincular-autorización-y-matrícula-a-la-cuenta-correcta) | Vincular autorización y matrícula a la cuenta correcta | R3 | BASE-03, BASE-05 |
| [BASE-07](01-base-y-acceso.md#base-07--revisar-la-experiencia-de-acceso-y-contexto-académico) | Revisar la experiencia de acceso y contexto académico | R2 | BASE-03, BASE-04 |
| [BASE-08](01-base-y-acceso.md#base-08--preparar-configuración-y-prueba-de-aviso-por-correo) | Preparar configuración y prueba de aviso por correo | R5 | Ninguno |
| [GRP-01](02-grupos-y-participantes.md#grp-01--configurar-número-capacidad-y-ventana-de-grupos) | Configurar número, capacidad y ventana de grupos | R2 | BASE-04 |
| [GRP-02](02-grupos-y-participantes.md#grp-02--conservar-la-historia-de-pertenencia-a-grupos) | Conservar la historia de pertenencia a grupos | R3 | BASE-03, BASE-06 |
| [GRP-03](02-grupos-y-participantes.md#grp-03--elegir-y-cambiar-de-grupo-preservando-historia-y-cupo) | Elegir y cambiar de grupo preservando historia y cupo | R1 | GRP-01, GRP-02 |
| [GRP-04](02-grupos-y-participantes.md#grp-04--completar-la-selección-de-grupo-del-alumno) | Completar la selección de grupo del alumno | R2 | GRP-03, BASE-07 |
| [GRP-05](02-grupos-y-participantes.md#grp-05--comprobar-grupos-y-participación-histórica-en-m1) | Comprobar grupos y participación histórica en M1 | R4 | GRP-04, GRP-06 |
| [GRP-06](02-grupos-y-participantes.md#grp-06--definir-actividades-y-resolver-sus-participantes) | Definir actividades y resolver sus participantes | R1 | GRP-02, BASE-04 |
| [EXP-01](05-exportacion.md#exp-01--cerrar-decisiones-del-cálculo-y-las-columnas) | Cerrar decisiones del cálculo y las columnas | R1 | BASE-01 |
| [DOC-01](07-documentacion-y-entrega.md#doc-01--consolidar-documentación-y-revisión-de-m1) | Consolidar documentación y revisión de M1 | R1 | BASE-01, BASE-06, BASE-07, BASE-08, GRP-05, EXP-01 |

## M2

**GitHub:** [M2. Registro y consulta de resultados](https://github.com/NickSalA/portfolio-course/milestone/2).

**8 issues.**

| Issue | Resultado | Responsable | Dependencias |
| --- | --- | --- | --- |
| [EVA-01](03-registro-y-consulta.md#eva-01--registrar-y-corregir-una-nota-por-grupo-y-evaluación) | Registrar y corregir una nota por grupo y evaluación | R3 | GRP-06, BASE-03 |
| [EVA-02](03-registro-y-consulta.md#eva-02--verificar-puntos-individuales-y-corrección-no-destructiva) | Verificar puntos individuales y corrección no destructiva | R1 | BASE-06 |
| [EVA-03](03-registro-y-consulta.md#eva-03--completar-la-matriz-docente-de-notas-y-pendientes) | Completar la matriz docente de notas y pendientes | R2 | EVA-01, BASE-07 |
| [EVA-04](03-registro-y-consulta.md#eva-04--autorizar-consultas-por-participación-histórica-y-titularidad) | Autorizar consultas por participación histórica y titularidad | R3 | EVA-01, EVA-02, GRP-02 |
| [EVA-05](03-registro-y-consulta.md#eva-05--mostrar-notas-y-puntos-propios-en-el-panel-del-alumno) | Mostrar notas y puntos propios en el panel del alumno | R2 | EVA-04, BASE-07 |
| [EVA-06](03-registro-y-consulta.md#eva-06--comprobar-registro-y-consulta-de-extremo-a-extremo) | Comprobar registro y consulta de extremo a extremo | R4 | EVA-03, EVA-05, EVA-07 |
| [EVA-07](03-registro-y-consulta.md#eva-07--integrar-recuperación-de-guardados-sin-duplicación) | Integrar recuperación de guardados sin duplicación | R1 | EVA-01, EVA-02, GRP-03 |
| [DOC-02](07-documentacion-y-entrega.md#doc-02--consolidar-documentación-y-revisión-de-m2) | Consolidar documentación y revisión de M2 | R2 | DOC-01, EVA-06 |

## M3

**GitHub:** [M3. Reclamos y exportación integrados](https://github.com/NickSalA/portfolio-course/milestone/3).

**11 issues.**

| Issue | Resultado | Responsable | Dependencias |
| --- | --- | --- | --- |
| [REC-01](04-reclamos.md#rec-01--modelo-permisos-y-unicidad-de-reclamos) | Modelo, permisos y unicidad de reclamos | R3 | EVA-04 |
| [REC-02](04-reclamos.md#rec-02--presentación-de-ambos-tipos-de-reclamo) | Presentación de ambos tipos de reclamo | R5 | REC-01 |
| [REC-03](04-reclamos.md#rec-03--transiciones-y-respuesta-final-docente) | Transiciones y respuesta final docente | R5 | REC-02 |
| [REC-04](04-reclamos.md#rec-04--interfaz-estudiantil-para-presentar-y-consultar) | Interfaz estudiantil para presentar y consultar | R2 | REC-02, REC-03 |
| [REC-05](04-reclamos.md#rec-05--bandeja-y-detalle-docente) | Bandeja y detalle docente | R5 | REC-03 |
| [REC-06](04-reclamos.md#rec-06--correo-docente-y-recuperación-de-fallos) | Correo docente y recuperación de fallos | R5 | REC-02, BASE-08 |
| [REC-07](04-reclamos.md#rec-07--qa-de-reclamos-y-correo) | QA de reclamos y correo | R4 | REC-04, REC-05, REC-06 |
| [EXP-02](05-exportacion.md#exp-02--cálculo-puro-de-saldo-y-promedio-ajustado) | Cálculo puro de saldo y promedio ajustado | R3 | EXP-01, EVA-04 |
| [EXP-03](05-exportacion.md#exp-03--descarga-xlsx-por-curso-con-atribución-histórica) | Descarga XLSX por curso con atribución histórica | R5 | EXP-02 |
| [EXP-04](05-exportacion.md#exp-04--qa-de-descarga-cálculo-privacidad-y-repetición) | QA de descarga, cálculo, privacidad y repetición | R4 | EXP-03 |
| [DOC-03](07-documentacion-y-entrega.md#doc-03--consolidar-documentación-y-revisión-de-m3) | Consolidar documentación y revisión de M3 | R5 | DOC-02, REC-07, EXP-04 |

## M4

**GitHub:** [M4. Sistema evaluado y cierre del desarrollo](https://github.com/NickSalA/portfolio-course/milestone/4).

**6 issues.**

| Issue | Resultado | Responsable | Dependencias |
| --- | --- | --- | --- |
| [QA-01](06-calidad-y-cierre.md#qa-01--revisar-accesibilidad-y-claridad-de-los-recorridos-integrados) | Revisar accesibilidad y claridad de los recorridos integrados | R2 | EVA-05, REC-04, REC-05, EXP-03 |
| [QA-02](06-calidad-y-cierre.md#qa-02--integrar-privacidad-integridad-y-recuperación) | Integrar privacidad, integridad y recuperación | R3 | EVA-07, REC-07, EXP-04 |
| [QA-03](06-calidad-y-cierre.md#qa-03--preparar-operación-y-demostración-reproducible) | Preparar operación y demostración reproducible | R5 | REC-06, EXP-03 |
| [QA-04](06-calidad-y-cierre.md#qa-04--evaluar-registro-y-seguimiento-con-escenarios-acordados) | Evaluar registro y seguimiento con escenarios acordados | R4 | QA-01, QA-02, QA-03 |
| [QA-05](06-calidad-y-cierre.md#qa-05--cerrar-integración-y-pendientes-del-sistema) | Cerrar integración y pendientes del sistema | R1 | QA-04 |
| [DOC-04](07-documentacion-y-entrega.md#doc-04--consolidar-resultados-y-documentación-de-m4) | Consolidar resultados y documentación de M4 | R4 | DOC-03, QA-05 |

## Entrega posterior

**GitHub:** [Entrega posterior. Informe y presentación](https://github.com/NickSalA/portfolio-course/milestone/5).

**3 issues.**

| Issue | Resultado | Responsable | Dependencias |
| --- | --- | --- | --- |
| [ENT-01](07-documentacion-y-entrega.md#ent-01--consolidar-y-maquetar-el-informe-final) | Consolidar y maquetar el informe final | R1 | DOC-04 |
| [ENT-02](07-documentacion-y-entrega.md#ent-02--elaborar-la-presentación-del-proyecto) | Elaborar la presentación del proyecto | R2 | DOC-04 |
| [ENT-03](07-documentacion-y-entrega.md#ent-03--ensayar-y-comprobar-el-paquete-de-entrega) | Ensayar y comprobar el paquete de entrega | R5 | ENT-01, ENT-02 |

## Preparación y paralelismo

- BASE-01, BASE-02 y BASE-08 pueden comenzar en paralelo. EXP-01 cierra decisiones de salida en M1; no espera a que empiece M3.
- Conservar participación histórica habilita registro, consulta, reclamos y XLSX. No ampliar permisos de lectura sin sus pruebas.
- El diseño de reclamos, contenido del aviso y casos de cálculo se adelantan con datos sintéticos durante M1–M2; la aceptación integrada corresponde a M3.
- Cada issue incorpora pruebas; QA-01–QA-05 integran la evaluación, no sustituyen las pruebas de M1–M3.
- DOC-01–DOC-04 documentan y revisan cada hito. ENT-01–ENT-03 quedan fuera de las cuatro semanas y deben reservarse antes de la entrega oficial.

# Plan · EVA-04 #27

Rama `feature/eva-04-consulta-resultados` desde `develop` en `c23ba0f`. PostgreSQL y Supabase. Separar la consulta estudiantil de la lectura docente y conservar la consulta existente de puntos. La migración 0047 de GRP-01 ya está integrada, por lo que EVA-04 usa 0048.

## Cumplimiento de la constitución

La base comprueba identidad, rol y alcance. El cambio es de solo lectura, no reconstruye notas antiguas y se verifica con datos sintéticos. La revisión independiente se solicita al abrir el PR con COPUPR.

## Diseño

- [Decisiones](research.md)
- [Modelo de datos](data-model.md)
- [Contrato](contracts/student-results.md)
- [Verificación](quickstart.md)

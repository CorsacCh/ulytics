# Migraciones de PostgreSQL

Esta carpeta contendrá los cambios versionados de la estructura de ULYTICS.

- Las tablas no deben crearse manualmente en pgAdmin.
- Cada migración debe incluir las operaciones `up` y `down`.
- Las migraciones publicadas no se editan: los cambios posteriores se agregan
  mediante una migración nueva.
- No se incluyen usuarios, contraseñas ni datos académicos reales.

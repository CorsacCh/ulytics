# Integración local de director y decano

Esta integración reúne los cambios del decano con los commits del equipo
`e03fcde` (director y gráficos) y `ec40c2b` (Swagger). La rama de revisión es
`codex/integrar-decano-director`.

## Contrato del Home del director

`GET /api/director/home` exige sesión, contraseña definitiva, rol DIRECTOR,
permiso `DASHBOARD_DIRECTOR_VER` y un ámbito PROGRAMA asociado a una carrera
existente. Todas las consultas se restringen a esa carrera en el backend.

Los parámetros opcionales son `cohorte` y `anio_medicion` (años de cuatro
dígitos). Si se omiten, cada dimensión usa su último período disponible. La
respuesta incluye los catálogos de períodos para construir los selectores.
El parámetro legado `car_codigo`, si se envía, debe coincidir con la sesión;
otro código, un array o un objeto obtiene 403.

| Campo | Fuente | Dimensión temporal |
| --- | --- | --- |
| `kpis.ingresos_totales` | `Fact_Ingreso_Cohorte.ingresos_totales` | Cohorte |
| `kpis.matricula_total` | `Fact_Matricula_Anual.matricula_total` | Año de medición |
| `kpis.retencion_1er_ano` | `Fact_Progresion_Academica.retencion_a1` | Cohorte |
| `kpis.titulacion_oportuna` | `Fact_Progresion_Academica.tasa_titulacion_oportuna` | Cohorte |
| `kpis.tiempo_promedio` | `Fact_Progresion_Academica.duracion_real_semestres` | Cohorte |
| `resumen.registros_asignaturas_informadas` | Registros de `Fact_Asignatura_Critica` con estado INFORMADO y tasa no nula | Año de medición |

Los indicadores ausentes conservan `null`, presentado como “Sin datos”. Un
cero informado sigue siendo cero. El conteo de asignaturas representa
registros por asignatura/semestre, no asignaturas únicas: no aplica un umbral
de reprobación ni vuelve a escalar porcentajes. Sin filas para el año, el
conteo es `null`; con filas pero ninguna tasa informada, es cero.

Se retiró el percentil institucional hasta contar con una definición validada
y autorización para utilizar información de otras carreras. El Home muestra
el ámbito de la cuenta en su lugar.

## Presentación y reportería

- Se conservan los gráficos y el selector Gráfico/Tabla del director.
- Los gráficos de eficiencia representan cantidades; avance curricular usa
  los porcentajes informados.
- La retención conserva huecos para valores ausentes. En la exportación usa
  los datos ya obtenidos por Reportería, evitando capturar un gráfico que
  todavía espera otra consulta.
- `ReporteriaView` combina los distintivos de tipo de vista del equipo con
  los filtros y formatos configurables del decano. Director conserva PDF y
  Excel; decano conserva su PDF con selección de carreras y períodos.
- El Home del decano y su carga de facultad permanecen integrados.
- Swagger está disponible en `/api-docs`; sus patrones de archivos funcionan
  en Windows y Linux.

## Verificación reproducible

Desde la raíz:

```sh
npm --prefix backend test
npm --prefix frontend run typecheck
npm --prefix frontend run lint
npm --prefix frontend run build
```

`backend/test/director-home.test.js` usa peticiones HTTP, autenticación y
datos ficticios, sin conectarse a PostgreSQL. Cubre ámbito, roles, permisos,
contraseña temporal, períodos, cero/ausencia y separación de las fuentes.
`backend/test/swagger.test.js` comprueba que las rutas se incluyan en el documento.

Para revisar con los contenedores locales del grupo 4:

```sh
docker compose -f docker-compose.yml -p grupo4_ulytics up -d --build --no-deps grupo4_backend grupo4_frontend
```

Abrir `http://localhost:3004` con cuentas de director y decano. Verificar
nombre de carrera/facultad, filtros independientes, estados sin datos,
alternancia Gráfico/Tabla y descarga PDF de ambos roles. Para el director,
comprobar además Excel de módulos tabulares. La revisión de publicación y el
push son pasos posteriores y separados.

## Resultados de la revisión local (2026-10-05)

- Backend: 55 pruebas aprobadas en Windows y también durante la construcción
  de la imagen Docker (Node 20/Linux).
- Frontend: TypeScript, lint y compilación aprobados; la construcción Docker
  también terminó correctamente.
- Contraste de solo lectura con PostgreSQL local: 132 comparaciones del Home
  con los endpoints de reportería para 66 carreras, sin diferencias en los
  indicadores comprobados. Se verificaron los 11 ámbitos de facultad y el
  rechazo de acceso a carreras de otra facultad.
- HTTP local: login, salud de la API y Swagger respondieron 200; el Home del
  director sin sesión respondió 401.
- Se reconstruyeron únicamente backend y frontend del proyecto
  `grupo4_ulytics`. No se ejecutaron migraciones ni se modificaron cuentas o
  datos académicos; el contenedor y el volumen de PostgreSQL se conservaron.
- La instalación de dependencias del backend informó 7 vulnerabilidades
  (3 moderadas y 4 altas). No se aplicaron actualizaciones automáticas; su
  análisis y remediación quedan pendientes.

Pendiente de revisión manual con cuentas autorizadas: navegación autenticada
de director y decano, selección de filtros, aspecto visual y contenido de los
archivos PDF/Excel descargados. Las pruebas automatizadas no sustituyen esta
revisión. La integración permanece en la rama temporal, sin push ni cambios
en la rama local `main`.

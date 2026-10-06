# ULYTICS Frontend

Frontend de ULYTICS, construido con React, TypeScript, Vite, Tailwind CSS y Recharts.

## Estructura

```text
src/
├── app/                         # Arranque y enrutamiento de la aplicación
│   └── App.tsx
├── features/
│   └── dashboards/              # Pantallas y datos propios de cada rol
│       ├── admin/
│       ├── autoridad/
│       ├── decano/
│       └── director/
├── shared/                      # Código reutilizable entre features
│   ├── components/              # Componentes visuales compartidos
│   ├── layout/                  # Layouts globales
│   └── lib/                     # Utilidades técnicas
├── globals.css                  # Tailwind y estilos globales
└── main.tsx                     # Punto de entrada de React
```

## Reglas de organización

- `app` coordina la aplicación y sus rutas; no contiene lógica específica de un rol.
- `features` contiene la lógica de presentación propia de cada dashboard.
- `shared` solo contiene componentes o utilidades que tienen más de un consumidor.
- Los datos temporales de un dashboard deben permanecer dentro de su feature.
- Las importaciones deben apuntar a la capa correcta y no crear dependencias circulares.
- La lógica de negocio y el acceso a datos pertenecen al backend, no a `src`.

## Comandos

Ejecutar desde `frontend/` o usando `npm --prefix frontend` desde la raíz:

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

El comando `typecheck` valida todos los archivos `.ts` y `.tsx` sin emitir archivos.

## Home de decanatura: resumen curricular

El Home conserva los cuatro bloques iniciales y añade:

1. **Resumen de eficiencia curricular:** alumnos regulares y cantidades por
   tramo para cada carrera de la cohorte seleccionada. No suma los tramos para
   reconstruir el total ni convierte cantidades a porcentajes.
2. **Avance curricular por carrera:** las cinco categorías porcentuales de la
   API para esa cohorte, sin promedios entre carreras ni normalización al 100%.
3. **Asignaturas informadas:** registros por carrera, código completo y semestre
   del año de medición seleccionado. Incluye código base, tasa y estado de
   origen, con filtro local por carrera. No aplica umbrales ni rankings.

La cohorte y el año de medición son independientes. El selector de años incluye
los de asignaturas aunque no exista matrícula en ese año; el gráfico histórico
de matrícula conserva únicamente sus propios años. Cero es un valor informado;
las ausencias se muestran como “Sin datos”. Los registros de asignaturas con
guiones o celdas vacías permanecen visibles y no se convierten en 0%.

Archivos implicados:

- `HomeDecano.tsx`: carga existente, selectores y composición del Home.
- `HomeCurricularDecano.tsx`: tres bloques de presentación propios del decano.
- `homeCurricular.ts`: selección, ordenación y formato, sin fórmulas académicas.
- `facultyData.ts` y `api.ts` (reutilizados sin cambios): catálogo autorizado y
  datos curriculares desde `/api/reporteria/:car_codigo/curricular`. El backend
  continúa validando que cada carrera pertenezca a la facultad de la sesión.

Los tres primeros están en `src/features/dashboards/decano/` (los componentes
en `components/`). No se modificaron el esquema, la API ni la reportería PDF.

### Pruebas

Desde la raíz del repositorio:

```sh
node --test frontend/test/home-curricular.test.mjs
npm --prefix frontend run typecheck
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix backend test
```

La prueba de frontend utiliza Vite y React ya instalados: carga TypeScript/TSX
y renderiza los componentes sin navegador, sin abrir puertos y sin conectarse a
PostgreSQL. Solo utiliza datos ficticios. Comprueba períodos independientes,
selección por carrera, valores nulos/cero, precisión de porcentajes, identidades
de asignaturas y mensajes vacíos. Resultado local: 11 pruebas aprobadas;
backend: 55 aprobadas. TypeScript, lint y compilación también aprobados.
Las 11 pruebas de frontend también pasaron dentro del contenedor (Node 20/Linux),
después de reconstruir únicamente `grupo4_frontend`.

Revisión manual: entrar como decano, abrir Home y cambiar cohorte/año por
separado; verificar que los bloques curriculares usan la cohorte y las
asignaturas el año. Probar “Todas las carreras” y una carrera específica,
incluyendo períodos sin información, y el desplazamiento de tablas en pantallas
pequeñas. La revisión visual autenticada queda pendiente con una cuenta del
usuario; las pruebas de renderizado no equivalen a esa comprobación.

## Decanatura: gráficos, tablas y PDF

Las vistas de progresión analítica y curricular permiten alternar **Gráfico / Tabla**
por apartado. Reutilizan `DataCardView` y los gráficos `EficienciaCurricular` y
`AvanceCicloFormativo`, ahora en `src/features/dashboards/components/`, también
consumidos por el director. No hay nuevas dependencias, consultas ni migraciones.

- Cohorte filtra ingresos, retención, titulación, eficiencia y avance. Año de
  medición filtra matrícula y asignaturas. Los rangos son independientes e inclusivos.
- Matrícula y titulación separan las unidades en gráficos distintos. Eficiencia
  muestra los tramos en barras y el total informado aparte, sin sumarlo de nuevo.
- Asignaturas conserva código completo y semestre. La tabla puede mostrar todas;
  para el gráfico se selecciona una asignatura. No se fusionan versiones ni se
  reclasifican asignaturas como críticas.
- Cero no equivale a ausencia. Las líneas dejan huecos en años sin datos y muestran
  puntos cuando hay un solo período. Las barras parciales incluyen una advertencia.
- Reportería permite **Tabla / Gráfico / Ambos** por indicador. El PDF separa
  carreras y asignaturas, no calcula promedios de facultad, y conserva los filtros.
  En asignaturas incluye todos los códigos del alcance seleccionado, uno por gráfico.
- Los controles quedan bloqueados durante la generación y se captura una instantánea
  de los módulos seleccionados. Las tablas se dividen en bloques con encabezados
  repetidos; se comprimen las imágenes y se evita capturar los módulos ajenos a cada bloque.

Validación desde la raíz (no requiere PostgreSQL):

```sh
node --test --test-concurrency=1 frontend/test/decanatura-graficos.test.mjs frontend/test/home-curricular.test.mjs
npm --prefix frontend run typecheck
npm --prefix frontend run lint
npm --prefix frontend run build
```

El banco visual `frontend/test/decanatura-preview.html` usa exclusivamente datos
ficticios y simula todas las peticiones de la API, incluso el registro de descargas.
No se importa desde `src/` ni se incluye en el build de producción. Para abrirlo:

```sh
npm --prefix frontend run dev -- --host 127.0.0.1 --port 3014 --strictPort
```

Visitar `http://127.0.0.1:3014/test/decanatura-preview.html`. Probar alternancia,
rangos independientes, una cohorte, ceros/null, carrera vacía, códigos de asignaturas
distintos y PDF en las tres modalidades. El PDF de prueba completo para dos carreras
con datos produjo 12 páginas y aproximadamente 1,5 MB; el tamaño depende del alcance.
Esta prueba aislada no reemplaza la revisión con sesión real, permisos y datos cargados.

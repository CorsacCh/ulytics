---
id: estructura-frontend
title: Estructura del Frontend
sidebar_position: 1
---

# Estructura del Frontend

La aplicación cliente de **ULYTICS** está construida con **React** sobre **Vite** y **TypeScript**. El código se organiza con una arquitectura modular basada en **Feature-Sliced Design**, donde cada dominio de negocio agrupa sus propias páginas, componentes, datos y tipos. Esto mantiene la presentación de cada rol separada y favorece la reutilización de piezas verdaderamente transversales.

El enrutamiento se resuelve con **React Router**, la interfaz se estiliza con **Tailwind CSS**, los iconos provienen de **Lucide React** y las visualizaciones se construyen con **Recharts**.

## Árbol de directorios

```text
frontend/src
├── app/
│   └── App.tsx
├── features/
│   ├── admin/
│   │   ├── api.ts
│   │   ├── CargaDatosPanel.tsx
│   │   ├── types.ts
│   │   └── UserManagementPanel.tsx
│   ├── auth/
│   │   ├── api.ts
│   │   ├── AuthContext.tsx
│   │   ├── ChangePasswordPage.tsx
│   │   ├── LoginPage.tsx
│   │   └── types.ts
│   └── dashboards/
│       ├── admin/
│       │   ├── components/
│       │   │   └── AdminDashboard.tsx
│       │   ├── DashboardAdmin.tsx
│       │   └── data/
│       │       └── adminData.ts
│       ├── autoridad/
│       │   ├── components/
│       │   │   ├── HistorialDescargasAutoridad.tsx
│       │   │   ├── ProgresionAnaliticaAutoridad.tsx
│       │   │   └── ProgresionCurricularAutoridad.tsx
│       │   ├── DashboardAutoridad.tsx
│       │   └── data/
│       │       ├── careerData.ts
│       │       ├── chartData.ts
│       │       ├── institucionData.ts
│       │       └── metrics.ts
│       ├── components/
│       │   └── TablaMatricula.tsx
│       ├── decano/
│       │   ├── api.ts
│       │   ├── components/
│       │   │   ├── HistorialDescargasDecano.tsx
│       │   │   ├── ProgresionAnaliticaDecano.tsx
│       │   │   └── ProgresionCurricularDecano.tsx
│       │   ├── DashboardDecano.tsx
│       │   └── data/
│       │       ├── careerData.ts
│       │       ├── criticalSubjects.ts
│       │       ├── distributionData.ts
│       │       └── metrics.ts
│       └── director/
│           ├── components/
│           │   ├── EvolucionRetencion.tsx
│           │   ├── HistorialDescargas.tsx
│           │   ├── ProgresionAnalitica.tsx
│           │   └── ProgresionCurricular.tsx
│           ├── DashboardDirector.tsx
│           └── data/
│               ├── courseProgress.ts
│               ├── criticalCourses.ts
│               ├── efficiencyData.ts
│               ├── metrics.ts
│               └── retentionData.ts
├── shared/
│   ├── assets/
│   │   └── branding/
│   │       ├── logo2_ULYTICS.jpeg
│   │       ├── logo_SACyP.jpg
│   │       ├── logo_UACh.svg
│   │       └── logo_ULYTICS.jpeg
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── DashboardHeader.tsx
│   │   │   └── KpiCard.tsx
│   │   └── Sidebar.tsx
│   └── layout/
│       └── DashboardLayout.tsx
├── globals.css
├── main.tsx
└── vite-env.d.ts
```

## Descripción de directorios y archivos

### `app/`

Configuración principal de la aplicación y definición del enrutamiento base.

- **`App.tsx`**: Define el árbol de rutas con React Router. Aplica *lazy loading* sobre las vistas de cada dashboard y concentra la lógica de navegación protegida:
  - **`EntryRedirect`**: Redirige al usuario según su estado de sesión y rol (login, cambio de contraseña obligatorio o dashboard correspondiente).
  - **`PublicOnly`**: Restringe las rutas públicas (por ejemplo, el login) cuando ya existe una sesión activa.
  - **`ProtectedRoute`**: Bloquea el acceso a rutas privadas, valida el rol requerido y fuerza el cambio de contraseña cuando corresponde.

### `features/`

Lógica agrupada por dominio de negocio (arquitectura **Feature-Sliced**). Cada submódulo expone sus páginas, componentes, datos y tipos de forma cohesionada: `auth/`, `admin/` y `dashboards/`.

#### `features/auth/`

Manejo de autenticación, gestión de sesiones y protección de rutas privadas.

- **`api.ts`**: Cliente HTTP de autenticación. Construye la URL base desde `VITE_BACKEND_URL`, centraliza las peticiones con `credentials: 'include'`, define la clase `ApiError` y emite el evento `UNAUTHORIZED_EVENT` ante respuestas `401`.
- **`AuthContext.tsx`**: Proveedor de sesión basado en React Context. Mantiene el usuario y el estado de carga, expone `useAuth()` y ofrece las operaciones `login`, `logout` y `changePassword`.
- **`LoginPage.tsx`**: Vista de inicio de sesión.
- **`ChangePasswordPage.tsx`**: Vista de cambio de contraseña obligatorio.
- **`types.ts`**: Tipos del dominio de autenticación (`RoleCode`, `AuthUser`) y el helper `roleHomePath()` que mapea cada rol a su ruta de inicio.

#### `features/admin/`

Funcionalidades exclusivas del rol **Administrador**: gestión de usuarios y carga de datos académicos. Consume los endpoints del panel de administración.

- **`api.ts`**: Funciones de acceso a datos del panel admin (`listAdminUsers`, `listAdminRoles`, `listAcademicScopes`, `listAmbitosCatalog`, `createAdminUser`, `updateAdminUserStatus`), apoyándose en `apiRequest` del módulo de autenticación.
- **`types.ts`**: Tipos del dominio administrativo (`AdminUser`, `AdminRole`, `AcademicScope`, `AmbitosCatalog`, `CreateUserPayload`) y los mapas `requiredScopeByRole` y `scopeTypeLabels` que relacionan cada rol con su ámbito académico esperado.
- **`UserManagementPanel.tsx`**: Componente de gestión de usuarios. Permite listar, crear y habilitar/deshabilitar cuentas, seleccionando rol y ámbito académico (institución, facultad o carrera) mediante selectores dinámicos.
- **`CargaDatosPanel.tsx`**: Componente de carga de datos. Gestiona la selección de un archivo Excel y el período académico, y realiza el envío `multipart/form-data` incluyendo la cookie de sesión.

#### `features/dashboards/`

Componentes y vistas principales (*layouts*) específicas para cada rol del sistema (**Decano**, **Director de Carrera**, **Autoridad Central** y **Administrador**). Cada rol sigue un patrón consistente: un *dashboard* contenedor, un subdirectorio `components/` con las secciones internas y un subdirectorio `data/` con métricas y conjuntos de datos.

- **`components/TablaMatricula.tsx`**: Componente de tabla de matrícula compartido por los dashboards de los distintos roles.

##### `features/dashboards/admin/`

- **`DashboardAdmin.tsx`**: Vista contenedora del administrador. Orquesta la navegación lateral y monta los paneles `UserManagementPanel` y `CargaDatosPanel` según la sección activa.
- **`components/AdminDashboard.tsx`**: Sección de inicio del dashboard de administración.
- **`data/adminData.ts`**: Datos y métricas de ejemplo para la vista del administrador.

##### `features/dashboards/director/`

- **`DashboardDirector.tsx`**: Vista contenedora del **Director de Carrera**. Renderiza la sección seleccionada dentro de `DashboardLayout`.
- **`components/`**: Secciones del dashboard:
  - **`ProgresionAnalitica.tsx`**: Indicadores de progresión analítica.
  - **`ProgresionCurricular.tsx`**: Indicadores de progresión curricular.
  - **`HistorialDescargas.tsx`**: Historial de descargas de reportes.
  - **`EvolucionRetencion.tsx`**: Evolución de la retención de la carrera.
- **`data/`**: Conjuntos de datos del dominio: `metrics.ts` (métricas clave), `retentionData.ts` (retención), `efficiencyData.ts` (eficiencia), `criticalCourses.ts` (asignaturas críticas) y `courseProgress.ts` (avance de cursos).

##### `features/dashboards/decano/`

- **`DashboardDecano.tsx`**: Vista contenedora del **Decano**. Conmuta entre la vista de inicio y las secciones analíticas.
- **`api.ts`**: Funciones de acceso a datos específicas del ámbito de decanatura.
- **`components/`**: Secciones del dashboard:
  - **`ProgresionAnaliticaDecano.tsx`**: Indicadores agregados de la facultad.
  - **`ProgresionCurricularDecano.tsx`**: Progresión curricular a nivel de facultad.
  - **`HistorialDescargasDecano.tsx`**: Historial de descargas de reportes.
- **`data/`**: Conjuntos de datos del dominio: `metrics.ts`, `careerData.ts` (carreras de la facultad), `distributionData.ts` (distribución) y `criticalSubjects.ts` (asignaturas críticas).

##### `features/dashboards/autoridad/`

- **`DashboardAutoridad.tsx`**: Vista contenedora de la **Autoridad Central**. Presenta indicadores de alcance institucional.
- **`components/`**: Secciones del dashboard:
  - **`ProgresionAnaliticaAutoridad.tsx`**: Indicadores de progresión analítica institucional.
  - **`ProgresionCurricularAutoridad.tsx`**: Progresión curricular institucional.
  - **`HistorialDescargasAutoridad.tsx`**: Historial de descargas de reportes.
- **`data/`**: Conjuntos de datos del dominio: `metrics.ts` (métricas institucionales), `chartData.ts` (series para gráficos), `careerData.ts` (desempeño por carrera) e `institucionData.ts` (datos institucionales).

### `shared/`

Componentes, recursos y utilidades reutilizables por más de una feature. Es el lugar para todo aquello transversal a las distintas vistas de rol.

- **`assets/`**: Recursos estáticos agrupados por temática. El subdirectorio `branding/` contiene los logotipos institucionales (`logo_ULYTICS.jpeg`, `logo2_ULYTICS.jpeg`, `logo_UACh.svg`, `logo_SACyP.jpg`).
- **`components/`**: Componentes de interfaz reutilizables.
  - **`Sidebar.tsx`**: Barra lateral de navegación. Adapta sus enlaces según el rol del usuario (opciones de administrador frente a las académicas) y expone el tipo `Section` con las secciones disponibles.
  - **`dashboard/DashboardHeader.tsx`**: Encabezado reutilizable para vistas de dashboard (título y subtítulo).
  - **`dashboard/KpiCard.tsx`**: Tarjeta de indicador (KPI) con etiqueta, valor, descripción, icono y variantes de tamaño.
- **`layout/`**: Estructuras de página reutilizables.
  - **`DashboardLayout.tsx`**: Layout común de los dashboards. Compone la barra lateral y el contenedor principal, gestiona el estado de apertura del menú (incluida la versión móvil) y delega en `Sidebar`.

### Archivos raíz de `src/`

- **`main.tsx`**: Punto de entrada y montaje de la aplicación. Obtiene el elemento `#root`, y renderiza `<App />` envuelto en `StrictMode`, `BrowserRouter` y `AuthProvider`, importando además `globals.css`.
- **`globals.css`**: Estilos globales de la aplicación. Declara las directivas base de Tailwind CSS (`@tailwind base`, `components` y `utilities`) y define las variables de color corporativas de la UACh junto con la tipografía y el fondo base.
- **`vite-env.d.ts`**: Declaraciones de tipados globales para el entorno de Vite (referencia a `vite/client`), habilitando el tipado de `import.meta.env` y de los recursos importados.

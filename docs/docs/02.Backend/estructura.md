---
id: estructura-backend
title: Estructura del Backend
sidebar_position: 1
---

# Estructura del Backend

La API REST de **ULYTICS** está construida sobre **Node.js** y **Express**, con **Sequelize** como ORM para PostgreSQL. El código fuente se organiza por responsabilidades dentro de `backend/src/`, separando la configuración, el transporte HTTP, las reglas de negocio y el acceso a datos.

Todos los archivos usan el sistema de módulos ESM (`import` / `export`), coherente con `"type": "module"` declarado en el `package.json` del backend.

## Árbol de directorios

```text
backend/src
├── app.js
├── index.js
├── config/
│   └── auth.js
├── controllers/
│   ├── admin-users.controller.js
│   ├── ambito.controller.js
│   ├── auth.controller.js
│   ├── carga.controller.js
│   ├── decanatura.controller.js
│   └── reporteria.controller.js
├── middlewares/
│   ├── academic-scope.middleware.js
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   ├── login-rate-limit.middleware.js
│   ├── upload.middleware.js
│   └── validate.middleware.js
├── persistence/
│   ├── database/
│   │   ├── config.cjs
│   │   └── database.js
│   ├── migrations/
│   ├── models/
│   └── seeders/
├── routes/
│   ├── admin-users.routes.js
│   ├── ambito.routes.js
│   ├── auth.routes.js
│   ├── carga.routes.js
│   ├── decanatura.routes.js
│   └── reporteria.routes.js
├── schemas/
│   └── auth.schemas.js
├── scripts/
│   ├── create-initial-admin.js
│   └── sync-models.js
├── services/
│   └── user.service.js
└── utils/
    ├── academic-scope.js
    ├── app-error.js
    ├── credentials.js
    └── role-scope.js
```

## Descripción de directorios y archivos

### Puntos de entrada

- **`app.js`**: Construye y exporta la instancia de Express. Registra los middlewares globales de seguridad y utilidad (`helmet`, `morgan`, `cors` con orígenes permitidos vía `ORIGIN`, `express.json` con límite de `100kb` y `cookieParser`), define el endpoint de salud `/api/health` y monta los módulos de rutas bajo el prefijo `/api/`. Al final de la cadena encadena `notFoundHandler` y `errorHandler`.
- **`index.js`**: Punto de arranque del proceso. Carga las variables de entorno, importa los modelos para registrar las asociaciones, verifica la conexión con PostgreSQL mediante `sequelize.authenticate()` y levanta el servidor en `PORT` (por defecto `4004`).

### `config/`

Configuración transversal del sistema y parámetros de seguridad derivados de variables de entorno.

- **`auth.js`**: Centraliza la configuración de autenticación: nombre de la cookie de sesión (`ulytics_session`), validación y lectura del `JWT_SECRET`, expiración del token (`JWT_EXPIRES_IN`), decisión de cookie segura (`COOKIE_SECURE`) y construcción de las opciones de cookie de sesión y de borrado.

### `controllers/`

Lógica de manejo de peticiones HTTP. Cada controlador recibe la request, delega en servicios o utilidades y construye la respuesta; no encapsula reglas de negocio complejas.

- **`auth.controller.js`**: Inicio y cierre de sesión, consulta del usuario autenticado (`me`) y cambio de contraseña.
- **`admin-users.controller.js`**: Gestión de usuarios (alta, modificación, habilitación/deshabilitación), construcción de catálogos de roles y ámbitos, y registro de auditoría.
- **`carga.controller.js`**: Ingesta y procesamiento de archivos de carga de datos académicos.
- **`reporteria.controller.js`**: Entrega de métricas e indicadores académicos.
- **`decanatura.controller.js`**: Consultas agregadas orientadas al rol Decano.
- **`ambito.controller.js`**: Exposición de ámbitos académicos.

### `middlewares/`

Interceptores de Express que se ejecutan antes o después de los controladores para validar, autorizar o transformar el flujo de la petición.

- **`auth.middleware.js`**: Verifica el JWT de la cookie de sesión, carga el usuario, construye `request.auth` (usuario, versión pública y permisos) y expone helpers como `requirePasswordChanged`, `requirePermission` y `authorize` para el control por rol o permiso.
- **`academic-scope.middleware.js`**: Carga la carrera indicada en la URL y comprueba el ámbito académico del usuario, dejando la instancia en `request.academicCareer`.
- **`login-rate-limit.middleware.js`**: Limita los intentos de inicio de sesión por cuenta (clave derivada del correo mediante hash) usando `express-rate-limit`.
- **`upload.middleware.js`**: Configura `multer` con almacenamiento en memoria y filtro de tipo para aceptar únicamente archivos Excel, con un límite de tamaño.
- **`validate.middleware.js`**: Ejecuta la validación de esquemas (Zod) sobre `body`, `params`, etc., y normaliza los datos validados antes de continuar.
- **`error.middleware.js`**: Define `notFoundHandler` (rutas inexistentes) y `errorHandler` (respuestas de error uniformes, incluyendo el tratamiento de `SequelizeUniqueConstraintError`).

### `persistence/`

Lógica de acceso a datos y modelado del dominio mediante Sequelize.

- **`database/`**: Conexión a la base de datos. `database.js` crea la instancia de `Sequelize` con dialecto `postgres` a partir de las variables de entorno; `config.cjs` aporta la configuración en formato CommonJS requerida por las herramientas de migración.
- **`models/`**: Definición de los modelos Sequelize (usuarios, roles, permisos, ámbitos académicos, auditoría, entidades académicas y tablas de hechos). El archivo `index.js` registra los modelos, declara sus asociaciones y los reexporta.
- **`migrations/`**: Migraciones versionadas que crean y evolucionan el esquema de la base de datos.
- **`seeders/`**: Datos iniciales (catálogos base como roles, permisos y ámbitos) para poblar el sistema en un entorno nuevo.

### `routes/`

Definición de los endpoints de la API. Cada archivo agrupa las rutas de un dominio y las conecta con sus controladores y middlewares correspondientes.

- **`auth.routes.js`**: `/login` (con validación previa y limitador de intentos), `/me`, `/logout` y `/change-password`.
- **`admin-users.routes.js`**: Rutas de administración de usuarios.
- **`carga.routes.js`**: Rutas de carga de datos.
- **`reporteria.routes.js`**: Rutas de reportería de indicadores.
- **`decanatura.routes.js`**: Rutas específicas de decanatura.
- **`ambito.routes.js`**: Rutas de ámbitos académicos.

### `schemas/`

Validaciones de datos de entrada basadas en esquemas (Zod), consumidas por `validate.middleware.js`.

- **`auth.schemas.js`**: Esquemas de inicio de sesión, cambio de contraseña y gestión de usuarios, incluyendo la validación del dominio de correo institucional y la normalización del email.

### `scripts/`

Utilidades ejecutables de apoyo para tareas puntuales de operación.

- **`create-initial-admin.js`**: Crea la cuenta administradora inicial aplicando las políticas de contraseña y validando el dominio institucional, y registra la acción en auditoría.
- **`sync-models.js`**: Sincroniza los modelos con la base de datos creando las tablas faltantes.

### `services/`

Lógica de negocio principal y cálculos de dominio. Concentra operaciones reutilizables que los controladores consumen.

- **`user.service.js`**: Búsqueda y serialización de usuarios, inclusión de relaciones (rol, permisos y ámbito), detección de correos duplicados y resolución del ámbito académico según el rol (institución, facultad o programa).

### `utils/`

Funciones auxiliares y helpers compartidos por varias capas.

- **`app-error.js`**: Clase `AppError` que estandariza mensaje, código de estado HTTP, código de error y detalles.
- **`credentials.js`**: Normalización de correos, validación del dominio institucional y políticas de contraseña.
- **`role-scope.js`**: Relación entre cada rol y el tipo de ámbito académico esperado, con helpers de compatibilidad.
- **`academic-scope.js`**: Regla de autorización que determina si un usuario puede consultar una carrera según su rol y ámbito.

---

:::info Nota
La carpeta `scripts/` contiene utilidades de ejecución manual (por ejemplo, la creación del administrador inicial o la sincronización de modelos) y no forma parte del enrutamiento de la API.
:::

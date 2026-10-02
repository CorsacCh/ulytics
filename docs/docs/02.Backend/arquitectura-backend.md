# Arquitectura del Backend

El backend de **ULYTICS** está construido en **Node.js** utilizando el framework **Express**. Su responsabilidad principal es proveer una API RESTful segura y escalable que comunique a la aplicación cliente con la base de datos PostgreSQL, implementando la lógica de negocio requerida para la reportería de indicadores de Progresión Académica y Curricular.

## Tecnologías Principales

- **Node.js & Express**: Entorno de ejecución y framework web.
- **Sequelize**: ORM (Object-Relational Mapping) para la interacción estructurada y segura con PostgreSQL.
- **Bcryptjs**: Encriptación y validación de contraseñas.
- **Helmet & Cors**: Configuración de seguridad HTTP y restricciones de acceso por dominios.

---

## 1. Inicialización y Configuración (App.js)

El núcleo de la aplicación (`app.js`) configura los middlewares globales, establece directivas de seguridad y define el enrutamiento base de la API.

### Middlewares de Seguridad y Utilidad
- **Helmet**: Habilitado por defecto para configurar cabeceras HTTP seguras y proteger la aplicación contra vulnerabilidades comunes.
- **Morgan**: Utilizado para el registro (*logging*) de peticiones HTTP en entorno de desarrollo.
- **CORS**: Configurado dinámicamente mediante la variable de entorno `ORIGIN` para permitir solicitudes únicamente desde dominios autorizados y habilitando el paso de credenciales (Cookies/Tokens).
- **Límites de carga**: Las peticiones entrantes en formato JSON están limitadas a `100kb` para prevenir ataques de saturación.

### Enrutamiento Base
La API expone sus módulos a través del prefijo `/api/`, delegando la lógica a rutas específicas:
- `/api/health`: Endpoint de verificación de estado (Healthcheck).
- `/api/auth`: Gestión de inicio de sesión y autenticación.
- `/api/admin`: Gestión de usuarios, roles y auditoría.
- `/api/cargas`: Manejo de la subida e ingesta de datos en lote.
- `/api/reporteria`: Obtención de métricas e indicadores académicos.
- `/api/ambitos` y `/api/decanatura`: Gestión de unidades académicas y consultas específicas de facultades.

Al final de la cadena, se ejecutan middlewares manejadores de errores (`notFoundHandler` y `errorHandler`) para capturar rutas inexistentes y excepciones no controladas.

---

## 2. Gestión de Usuarios y Permisos (Administración)

El controlador `admin-users.controller.js` maneja toda la lógica requerida por la **US-ADM-12** (Crear, modificar o deshabilitar usuarios, asignándoles rol y unidad académica).

### Flujo de Creación de Usuarios (`createUser`)
1. **Validaciones Previas**: 
   - Se valida que la contraseña temporal cumpla con las políticas de seguridad institucionales (`assertPasswordPolicy`).
   - Se verifica que el correo electrónico no esté registrado previamente.
2. **Resolución de Ámbito Académico**: Mediante `resolveCreateScope()`, el sistema vincula al usuario a un nivel de acceso específico. Para Autoridad Central el acceso es transversal, mientras que para Directores o Decanos se asocia a un código de carrera o ID de macrounidad (Facultad) específico.
3. **Transaccionalidad (ACID)**: Todo el proceso de creación se ejecuta dentro de una transacción de Sequelize (`sequelize.transaction()`). Si falla la creación del usuario o el registro de auditoría, se hace un `rollback` automático.
4. **Registro de Auditoría**: Se inserta un registro en la tabla `AuditoriaUsuario` indicando qué administrador creó la cuenta y qué rol/ámbito fue asignado.

### Flujo de Modificación de Usuarios (`updateUser`)
Este flujo incluye reglas de negocio estrictas para evitar vulnerabilidades de escalada de privilegios:
- **Prevención de auto-modificación**: Un administrador **no puede** cambiar su propio rol ni su propio ámbito académico (`CANNOT_CHANGE_OWN_ACCESS`).
- **Verificación de Compatibilidad**: Se invoca a `assertRoleScopeCompatibility` para asegurar que un rol (ej. Decano) no pueda ser asignado a un ámbito incorrecto (ej. una Carrera en lugar de una Facultad).

### Gestión de Estado (`updateUserStatus`)
Permite habilitar o deshabilitar cuentas. Como medida de seguridad obligatoria, un usuario no puede deshabilitarse a sí mismo (`CANNOT_DISABLE_SELF`). Todos los cambios de estado generan un registro automático en auditoría (`USER_ENABLED` o `USER_DISABLED`).

---

## 3. Catálogos Base
El controlador de administración también expone métodos de sólo lectura para listar configuraciones fundamentales:
- **`getRoles`**: Retorna los roles activos del sistema ordenados alfabéticamente.
- **`getScopes`**: Retorna los ámbitos académicos estructurados (Tipos, Códigos y relacionamiento Padre-Hijo) para construir los selectores dinámicos en la interfaz del Administrador.
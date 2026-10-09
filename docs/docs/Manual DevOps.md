# Manual DevOps - ULYTICS

Este documento detalla la infraestructura, configuración y rutinas de despliegue de la plataforma **ULYTICS**. Está diseñado para garantizar la correcta operación, mantenimiento y traspaso técnico del proyecto entre entornos de desarrollo local y el servidor de pruebas/producción.

> 📝 **Nota sobre la versión de Docker Compose:** en este proyecto se utiliza el binario independiente **`docker-compose`** (con guion), debido a la versión de Docker instalada. En instalaciones más recientes el mismo comando se ejecuta como `docker compose` (sin guion, como plugin de Docker). Todos los comandos de este manual usan `docker-compose`; si tu entorno tiene el plugin, basta con reemplazarlo.

---

## 1. Arquitectura de Contenedores y Redes

El ecosistema se divide en tres servicios principales:

- **Base de Datos:** `ulytics_db`
- **Backend:** `ulytics_backend`
- **Frontend:** `ulytics_frontend`

El comportamiento de estos contenedores varía drásticamente según el entorno.

### Entorno Local (`docker-compose.yml`)

- Construye las imágenes desde el código fuente local (`build: context: .`).
- Expone los puertos directamente al host para facilitar el desarrollo:
  - Frontend: `3004`
  - Backend: `4004`
  - PostgreSQL: `5434` (mapeado al `5432` interno)
- Utiliza la red aislada `ulytics_network`.

### Servidor / Producción (`docker-compose.server.yml`)

- Descarga imágenes precompiladas desde GitHub Container Registry (`ghcr.io/<organizacion>/ulytics-*`).
- **No publica ningún puerto al host.**
- La comunicación externa se maneja exclusivamente a través del proxy inverso **Caddy**, utilizando una red externa compartida con el proxy (por ejemplo, `red_proxy`).
- El tráfico se enruta así:

| Ruta       | Destino                 |
| ---------- | ----------------------- |
| `/*`       | `ulytics_frontend:3004` |
| `/api/*`   | `ulytics_backend:4004`  |

### Persistencia de Datos

En ambos entornos, los datos de PostgreSQL persisten en el volumen nombrado `ulytics_postgres_data`.

> ⚠️ **Precaución:** operar con extremo cuidado al usar comandos de detención global de Docker para no comprometer este volumen.

---

## 2. Gestión de Variables de Entorno (`.env`)

El sistema requiere **tres archivos `.env` independientes**, alojados en sus respectivos directorios. Los secretos **nunca** deben subirse al repositorio Git. En el servidor, estos archivos se deben crear y editar manualmente.

### `database/.env`

Define las credenciales maestras del motor PostgreSQL.

| Variable                              | Descripción                                                          |
| ------------------------------------- | -------------------------------------------------------------------- |
| `POSTGRES_DB`                         | Nombre de la base (ej. `ulytics`).                                   |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` | Credenciales de acceso (deben coincidir exactamente con el backend). |

### `backend/.env`

Controla la lógica de seguridad, conexión y sesiones de la API.

| Variable                     | Descripción                                                                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `DB_HOST`                    | Debe ser estrictamente `ulytics_db` (el nombre del contenedor).                                                              |
| `TRUST_PROXY_HOPS`           | `0` para desarrollo local y `1` en el servidor (para que confíe en el proxy Caddy).                                          |
| `ORIGIN`                     | URL base permitida por CORS (ej. `http://localhost:3004` en local, o `https://ulytics.ejemplo.com` en servidor).             |
| `JWT_SECRET`                 | Semilla criptográfica. Exige un string largo, complejo y único por entorno.                                                  |
| `COOKIE_SECURE`              | `false` en local o HTTP. Cambiar obligatoriamente a `true` una vez que el servidor cuente con HTTPS validado.                |
| `INSTITUTIONAL_EMAIL_DOMAIN` | Dominio autorizado (ej. `uach.cl`).                                                                                          |

### `frontend/.env`

Variables expuestas al navegador (prefijo `VITE_`). **No incluir contraseñas aquí.**

| Variable                          | Descripción                                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `VITE_APP_HOST` y `VITE_APP_PORT` | Configuración de exposición del servidor Vite (`0.0.0.0` y `3004`).                                           |
| `VITE_BACKEND_URL`                | URL absoluta apuntando a la API (en el servidor debe ser la URL pública, ej. `https://ulytics.ejemplo.com/api`). |

---

## 3. Proceso de Despliegue (`deploy.sh`)

El despliegue en el servidor está automatizado mediante el script `deploy.sh`. Este script actúa bajo un modelo de actualización segura, sin causar tiempo de inactividad innecesario ni pérdida de datos.

### Flujo de ejecución interno del script

1. **Auditoría Local:** verifica que el repositorio local no tenga cambios sin confirmar (detiene el despliegue si el `git status` no está limpio).
2. **Validación Remota:** se conecta vía SSH y comprueba que los tres archivos `.env` (`database`, `backend`, `frontend`) existan en el servidor. Si falta alguno, aborta.
3. **Transferencia y Actualización:** envía únicamente el archivo `docker-compose.server.yml` al servidor.
4. **Pull y Recreación:** descarga las últimas imágenes desde GHCR y recrea los contenedores necesarios (`up -d`). **No ejecuta un `down` previo**, lo que protege el volumen de datos.
5. **Migraciones Automáticas:** ejecuta `npm run db:migrate` y `npm run db:seed` dentro del contenedor del backend para aplicar cualquier cambio estructural en la base de datos de manera transparente.

---

## 4. Creación del Primer Administrador

El sistema cuenta con un script específico para poblar el primer usuario maestro. Este proceso se ejecuta **por única vez** al inicializar una base de datos en blanco.

### Pasos y validaciones técnicas

1. Definir temporalmente las variables `INITIAL_ADMIN_NAME`, `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD` en `backend/.env`.
2. El email debe pertenecer obligatoriamente al dominio definido en `INSTITUTIONAL_EMAIL_DOMAIN` (ej. `@uach.cl`).
3. La contraseña debe cumplir la política estricta: mínimo 12 caracteres, mayúsculas, minúsculas y números.
4. El script valida que no exista ya un rol `ADMIN`. Si pasa las validaciones:
   - Encripta la clave con Bcrypt (factor 12).
   - Asocia el ámbito `INSTITUCION`.
   - Marca el campo `debe_cambiar_password: true` (forzando el cambio en el primer login).
   - Registra la acción en la tabla de `AuditoriaUsuario`.

### Comando de ejecución

```bash
docker-compose -p ulytics run --rm --no-deps ulytics_backend npm run create:initial-admin
```

### Post-ejecución

> 🔐 Las credenciales temporales deben borrarse **inmediatamente** de `backend/.env` por seguridad.Base de datos: Ejecuta silenciosamente (vía exec -T) las migraciones (npm run db:migrate) y carga de datos iniciales (npm run db:seed) en el contenedor del backend para aplicar cambios estructurales en la base de datos de manera transparente.
# ULYTICS

ULYTICS es una plataforma web de reportería para indicadores de Progresión
Académica y Curricular de la Universidad Austral de Chile.

El repositorio contiene tres servicios:

- `grupo4_frontend`: aplicación React + Vite.
- `grupo4_backend`: API Node.js + Express + Sequelize.
- `grupo4_db`: PostgreSQL 17.

## Estado funcional actual

Ya están conectados a la API y a PostgreSQL:

- inicio y cierre de sesión mediante cookie `httpOnly`;
- cambio obligatorio de la contraseña temporal en el primer ingreso;
- redirección a la vista correspondiente a cada rol;
- autorización de rutas administrativas en el backend;
- listado, creación, habilitación y deshabilitación de usuarios;
- roles Administrador, Director, Decano y Autoridad Central;
- asociación validada entre rol y tipo de ámbito académico;
- registro de auditoría para operaciones de usuarios.

Los dashboards académicos, los períodos y la carga de datos continúan siendo
prototipos visuales. Por ahora solo existe el ámbito institucional inicial; las
facultades y carreras o programas deben cargarse con información validada antes
de poder crear usuarios Decano o Director.

## Requisitos para desarrollo local

- Docker Desktop con Docker Compose v2.
- Git.
- Puertos locales disponibles: `3004`, `4004` y `5434`.

No es necesario instalar PostgreSQL directamente en el equipo. La base de datos
se ejecuta dentro de Docker y sus datos permanecen en el volumen exclusivo
`grupo4_ulytics_postgres_data`.

## 1. Configurar los archivos de entorno

Desde la raíz del repositorio, crea los tres archivos locales a partir de sus
ejemplos:

```powershell
Copy-Item database/.env.example database/.env
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

En macOS o Linux:

```bash
cp database/.env.example database/.env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Después edita los archivos creados:

- `database/.env`: define la base, el usuario y una contraseña local segura.
- `backend/.env`: usa la misma base, usuario y contraseña; configura también un
  `JWT_SECRET` largo y aleatorio. En local conserva `TRUST_PROXY_HOPS=0` y
  `COOKIE_SECURE=false`.
- `frontend/.env`: conserva la URL local del backend, salvo que exista una razón
  explícita para cambiarla.

Los archivos `.env` contienen secretos, están excluidos de Git y nunca deben
subirse al repositorio. Las variables `VITE_*` son visibles en el navegador, por
lo que tampoco deben contener secretos.

## 2. Construir e iniciar ULYTICS

Abre Docker Desktop y, desde la raíz del repositorio, ejecuta:

```bash
docker compose -p grupo4_ulytics up -d --build
```

Comprueba únicamente los servicios del proyecto:

```bash
docker compose -p grupo4_ulytics ps
```

Direcciones locales:

- Frontend: <http://localhost:3004>
- Backend: <http://localhost:4004>
- Salud del backend: <http://localhost:4004/api/health>
- PostgreSQL para herramientas locales: `localhost:5434`

Dentro de la red de Docker, PostgreSQL continúa usando el puerto `5432` y el
nombre de host `grupo4_db`.

## 3. Preparar la base de datos

La estructura se administra mediante migraciones de Sequelize. No se deben
crear las tablas manualmente ni usar `sequelize.sync({ alter: true })`.

Con los servicios iniciados, ejecuta:

```bash
docker compose -p grupo4_ulytics exec grupo4_backend npm run db:migrate
docker compose -p grupo4_ulytics exec grupo4_backend npm run db:seed
docker compose -p grupo4_ulytics exec grupo4_backend npm run db:migrate:status
```

Las migraciones crean usuarios, roles, permisos, ámbitos y auditoría. El seed
registra los roles y permisos iniciales. Sequelize lleva un registro de lo ya
aplicado, por lo que estos comandos no deben reemplazarse por scripts SQL
manuales.

## 4. Crear el primer administrador

La creación inicial se realiza una sola vez y exige un correo terminado
exactamente en `@uach.cl`.

1. Completa temporalmente en `backend/.env`:
   `INITIAL_ADMIN_NAME`, `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD`.
2. Ejecuta:

   ```bash
   docker compose -p grupo4_ulytics run --rm --no-deps grupo4_backend npm run create:initial-admin
   ```

3. Deja nuevamente vacías las tres variables en `backend/.env`.

La contraseña inicial debe tener al menos 12 caracteres e incluir mayúscula,
minúscula y número. El usuario tendrá que cambiarla en su primer ingreso. Nunca
incluyas credenciales reales en los archivos `.env.example`.

## 5. Pruebas y compilación

Para ejecutar las pruebas del backend:

```bash
docker compose -p grupo4_ulytics exec grupo4_backend npm test
```

Para comprobar la compilación del frontend:

```bash
docker compose -p grupo4_ulytics exec grupo4_frontend npm run typecheck
docker compose -p grupo4_ulytics exec grupo4_frontend npm run lint
docker compose -p grupo4_ulytics exec grupo4_frontend npm run build
```

El comando `build` vuelve a ejecutar el chequeo de tipos antes de compilar. Estos
comandos verifican el código, pero no reemplazan las pruebas funcionales
de inicio de sesión, cambio de contraseña y autorización por rol.

## 6. Logs y detención segura

Ver los logs de un servicio:

```bash
docker compose -p grupo4_ulytics logs -f grupo4_backend
docker compose -p grupo4_ulytics logs -f grupo4_frontend
docker compose -p grupo4_ulytics logs -f grupo4_db
```

Detener los servicios sin borrar la base:

```bash
docker compose -p grupo4_ulytics down
```

No uses `down -v`, comandos `prune` ni operaciones globales de Docker: podrían
eliminar la base de datos o afectar recursos que no pertenecen al grupo 4.

## 7. Configuración del servidor

El servidor utiliza [docker-compose.server.yml](docker-compose.server.yml) y las
imágenes publicadas en GHCR. Mantiene la misma organización de entornos:

```text
grupo4/
├── docker-compose.yml
├── database/.env
├── backend/.env
└── frontend/.env
```

[.env.server.example](.env.server.example) documenta qué debe contener cada
archivo, pero no incluye credenciales válidas. Los secretos se crean y editan
directamente en el servidor; `deploy.sh` no los copia desde el repositorio.

El script [deploy.sh](deploy.sh) comprueba esos tres archivos, actualiza
exclusivamente los contenedores del proyecto `grupo4_ulytics` y aplica las
migraciones y seeds pendientes. Solo debe ejecutarse cuando exista autorización
explícita para desplegar. No realiza `down`, no borra volúmenes y no ejecuta
comandos globales de Docker. Antes de conectarse, muestra `pwd`, ejecuta
`git status` y se detiene si el repositorio local contiene cambios sin confirmar.

La guía del curso indica actualmente una dirección pública `http://`. Ese canal
no cifra el inicio de sesión ni las contraseñas temporales. Antes de usar cuentas
reales, el responsable del proxy Caddy debe confirmar HTTPS; en ese momento se
deben cambiar `ORIGIN` y `VITE_BACKEND_URL` a `https://...` y definir
`COOKIE_SECURE=true` en `backend/.env`. La configuración del servidor usa
`TRUST_PROXY_HOPS=1` porque Caddy es el único proxy conocido. Mientras HTTPS no
se confirme, el servidor compartido debe considerarse únicamente un entorno de
prueba no productivo.

## Reglas de seguridad

- No subir `.env`, contraseñas, claves SSH, tokens ni bases con datos reales.
- No incorporar la planilla académica al repositorio.
- No exponer nombres, RUT, correos u otros datos identificables de estudiantes.
- Verificar siempre `git status` y el diff antes de un commit.
- No hacer commit, push ni despliegue sin la autorización correspondiente.
- En el servidor compartido, operar únicamente sobre recursos del grupo 4.

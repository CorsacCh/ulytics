# Adaptación de la plantilla para el servidor del Taller

## Problemas que traía y cómo quedaron

| # | Problema | Arreglo |
|---|----------|---------|
| 1 | Claves (BD, passwords) escritas dentro del `docker-compose.yml`. Además `MYSQL_ROOT_PASSWORD: pf$6#...` sin comillas: Docker interpreta `$6` como variable y **trunca la contraseña**. | Todo movido a `.env` vía `env_file:`. En `env_file` los valores se toman **literales**, sin interpretar `$` ni `#`. El `.env` no se sube a git. |
| 2 | Puertos inconsistentes: backend `EXPOSE 4009` / compose `PORT=4000` / código default `4009`; frontend `EXPOSE 3009` / README dice `3000` / compose `ports: 3009`. | Unificado: **backend 4000**, **frontend 3000** en todos lados. |
| 3 | `frontend` publicaba un puerto al azar (`ports: - 3009`) y no decía en qué puerto escuchar. | El frontend escucha en `0.0.0.0:3000` (vía `VITE_APP_HOST` / `VITE_APP_PORT`). En local se publica `3000:3000`; en el servidor **no se publica** (Caddy llega por nombre). |
| 4 | `backend` sin `PORT` ni `ORIGIN` en el compose. El código necesita `ORIGIN` para CORS y `PORT` para escuchar → CORS roto / puerto incierto. | Ambas en el `.env`. |
| 5 | `hostname: test` en la BD. | Eliminado. No hacía falta: el servicio ya se resuelve por su nombre (`grupo0_db`) dentro de la red docker. |
| 6 | `networks: red_taller_software: external: true` → no existe al correr en tu PC. | El compose **local** crea su propia red `bridge`. El del **servidor** la deja `external: true` (ya existe, la creó el compose de Caddy). |
| 7 | Vite 4.5+ bloquea peticiones con Host distinto de localhost → `Blocked request. This host is not allowed.` en el subdominio. | `vite.config.js` ahora lee `VITE_ALLOWED_HOSTS` del `.env` y lo pasa a `server.allowedHosts`. |
| 8 | `vite.config.js` usaba `dotenv` y `process.env.VITE_*` para el server; frágil dentro del contenedor. | Se quitó `dotenv`. docker compose inyecta las `VITE_*` desde el `.env` y Vite las expone solo en `import.meta.env`. |
| 9 | Frontend en `node:16-bullseye` (EOL, y Vite 4.5 pide Node 18+). | `node:18-bullseye`. |
| 10 | Sin `.dockerignore`: `COPY . .` metía `node_modules` del host (otra arquitectura) y `.env` a la imagen. | `.dockerignore` en raíz y en `Frontend/`. |
| 11 | `.gitignore` raíz era `.env ` (con espacio) y `Frontend/.gitignore` **no** ignoraba `.env` → riesgo de subir claves. | `.gitignore` arreglado en ambos, con excepción para los `*.example`. |
| 12 | `Base de datos/test.sql` montado como init, pero el archivo solo hace `CREATE DATABASE` (sin tablas). Las tablas las crea Sequelize (`sync`). | Se quitó el montaje. La BD se crea con `MYSQL_DATABASE` y las tablas con `sequelize.sync()`. Si algún grupo necesita datos semilla, vuelve a montar el `.sql`. |

> Nota: hay `.DS_Store` versionados. Para sacarlos: `git rm --cached .DS_Store Backend/.DS_Store Backend/src/.DS_Store` (el `.gitignore` ya los ignora a futuro).

## Archivos nuevos / modificados

```
docker-compose.yml            # LOCAL  (build + puertos a localhost)
docker-compose.server.yml     # SERVIDOR (imágenes de GHCR, sin puertos)
.env.example                  # plantilla LOCAL
.env.server.example           # plantilla SERVIDOR
.github/workflows/build.yml   # CI: construye y publica imágenes en GHCR
deploy.sh                     # despliegue desde tu PC por SSH
.dockerignore  Frontend/.dockerignore
Frontend/vite.config.js       # allowedHosts + lectura de env
Backend/Dockerfile            # EXPOSE 4000
Frontend/dockerfile           # node:18, EXPOSE 3000
.gitignore  Frontend/.gitignore
```

---

## Cómo se usa

### 1. Local (desarrollar en tu PC)

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:3000
- API:      http://localhost:4000/api/users

### 2. Publicar las imágenes (automático)

Al hacer `push` a `main`, el workflow `build.yml` construye y sube:

- `ghcr.io/mittods/plantilla_info282-backend:latest`
- `ghcr.io/mittods/plantilla_info282-frontend:latest`

**Una vez**, en GitHub → repo → *Packages* → cada paquete → *Package settings* →
*Change visibility* → **Public**. Así el servidor puede hacer `pull` sin login.
(Alternativa: `docker login ghcr.io` en el servidor con un PAT `read:packages`.)

### 3. Preparar el servidor (una sola vez)

```bash
ssh vm166@146.83.216.166
mkdir -p ~/plantilla_grupo0
nano ~/plantilla_grupo0/.env      # pegar y completar .env.server.example
```

La red `red_taller_software` ya existe (la creó el compose de Caddy). El bloque de
`prueba.146.83.216.166.nip.io` ya está en el Caddyfile apuntando a
`grupo0_backend:4000` y `grupo0_frontend:3000`.

### 4. Desplegar desde tu PC (con VPN)

```bash
./deploy.sh
```

Copia `docker-compose.server.yml` al servidor como `docker-compose.yml` y corre
`docker compose pull && docker compose up -d`. El `.env` ya está en el servidor y no
se toca.

Verificar: http://prueba.146.83.216.166.nip.io

---

## Sobre las variables de entorno (para explicar a los grupos)

- **El `.env` va SIEMPRE en el servidor**, tanto si se construye ahí como si se
  descarga la imagen de GHCR. La imagen se sube "limpia" y el `.env` la parametriza
  al levantarla (`env_file:`).
- **No se hornean secretos en la imagen.** Quedarían en `docker history` visibles
  para cualquiera con acceso a la imagen.
- Las `VITE_*` **no son secretas** (terminan en el navegador). Acá el frontend corre
  como *dev server* (`npm run dev`), así que Vite las lee del entorno al arrancar el
  contenedor: la misma imagen sirve para local y para el servidor.

---

## Para que otro grupo use esta plantilla

Buscar y reemplazar `grupo0` → `grupoN` en `docker-compose*.yml` y en `deploy.sh`,
y en el `.env` ajustar:

- `PORT` y `VITE_APP_PORT` al número del grupo (grupo1 → `4001` / `3001`, etc.,
  según el Caddyfile)
- `DB_HOST=grupoN_db`
- `ORIGIN` y `VITE_BACKEND_URL` → `http://grupoN.146.83.216.166.nip.io`
- `VITE_ALLOWED_HOSTS` → `grupoN.146.83.216.166.nip.io`

Y en `build.yml` cambiar el nombre de las imágenes a las del repo del grupo.

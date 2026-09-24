# Guía para agentes

## Alcance

- Este repositorio contiene un frontend React/TypeScript/Vite y una API Node/Express con PostgreSQL/Sequelize.
- Conserva la separación de responsabilidades: la lógica de negocio y persistencia van en `backend/`; la presentación específica de cada rol va en `frontend/src/features/`; reutiliza `frontend/src/shared/` solo cuando haya más de un consumidor.
- Antes de editar, revisa `git status` y conserva los cambios existentes del usuario. No reviertas ni reformatees cambios ajenos al encargo.

## Comandos

Desde la raíz:

```bash
npm install
npm run dev
npm run build
npm run typecheck
```

Los scripts raíz delegan en el frontend. Para trabajar por proyecto:

```bash
cd frontend && npm install && npm run dev
cd frontend && npm run typecheck
cd frontend && npm run lint
cd frontend && npm run build
cd backend && npm install && npm run dev
cd backend && npm start
```

No hay una suite de tests configurada actualmente. Para cambios de frontend, ejecuta como mínimo `npm run typecheck` desde la raíz; añade `lint` y `build` cuando el cambio lo justifique. Para backend, valida con el comando de arranque y revisa la conexión a la base de datos cuando sea necesario.

Si Vite muestra rutas antiguas como `src/views` o `main.jsx`, comprueba el directorio de ejecución y los procesos de desarrollo activos antes de corregir código: el árbol actual usa `frontend/src/app/` y `frontend/src/main.tsx`.

## Estructura y convenciones

- `frontend/src/app/` coordina la aplicación y el enrutamiento; no pongas aquí lógica específica de un rol.
- `frontend/src/features/` contiene páginas, datos temporales y componentes propios de cada dashboard.
- `frontend/src/shared/` contiene layouts, componentes y utilidades verdaderamente compartidos.
- `backend/src/app.js` registra middleware y rutas; `backend/src/index.js` inicializa Sequelize y arranca el servidor.
- Los modelos Sequelize viven en `backend/src/persistence/models/`, los repositorios en `backend/src/persistence/repository/` y la conexión en `backend/src/persistence/database/`.
- Respeta el proyecto ESM (`"type": "module"`) en backend: usa `import`/`export`, no `require`/`module.exports` en código nuevo.
- La autenticación y el acceso a datos deben integrarse con la API; no dupliques lógica de negocio en el frontend.

## Riesgos conocidos

- Verifica rutas y casing antes de usar Docker: `docker-compose.yml` referencia `Backend/` y `Frontend/`, pero las carpetas reales son `backend/` y `frontend/`.
- Compose espera `database/.env`, `backend/.env` y `frontend/.env`; crea esos archivos localmente a partir de [`.env.example`](.env.example) sin subir secretos.
- El backend ejecuta `sequelize.sync({ alter: true })` al arrancar. Trátalo como una operación potencialmente modificadora del esquema y revisa el impacto antes de ejecutarlo contra datos importantes.
- Comprueba imports y archivos existentes antes de cambiar usuarios, papers o cargas: el backend contiene rutas y controladores en evolución, además de código antiguo con nombres de carpetas o módulos inconsistentes.
- `database/test.sql` y `backend/wait-for-db.sh` pueden contener supuestos heredados de MariaDB; la configuración activa usa PostgreSQL. No tomes esos archivos como autoridad sin verificar el flujo actual.

## Documentación de referencia

- [README raíz](README.md): Docker y flujo local documentado.
- [README del frontend](frontend/README.md): organización de features y comandos TypeScript.
- [README del backend](backend/README.md): contexto histórico de la API.
- [Carga de datos](backend/src/CargaDeDatos.md): flujo funcional relacionado.
- [Esquema SQL de usuarios](database/sqlScripts/1_crearEstructuraUsuario.sql): estructura inicial de la base de datos.
- [Despliegue](deploy.sh) y [Compose de servidor](docker-compose.server.yml): publicación remota y sus supuestos.

## Cambios de configuración

- No edites workflows, despliegue, Docker o variables de entorno como parte de un cambio de UI salvo que sea necesario para hacerlo funcionar.
- No añadas dependencias nuevas si una utilidad o patrón existente resuelve el problema.
- Después de cambios funcionales, informa qué validación ejecutaste y distingue los problemas preexistentes de los introducidos por el cambio.

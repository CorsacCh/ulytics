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

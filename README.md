# Frontend – Librería Rocío

Panel administrativo en **Vue 3 + Vite**, que consume la API del backend (`libreria-backend`). Incluye autenticación con JWT, gestión de catálogo, proveedores/clientes, compras, ventas con histórico, descarga de documentos y auditoría.

## Stack
- Vue 3 (`<script setup>`) + Vite
- Vue Router 4 (con guards de autenticación y rol)
- Pinia (estado de sesión y notificaciones)
- Axios (con interceptor de refresh token automático)
- CSS puro con tokens de diseño (sin librería de UI externa)

## Instalación

```bash
npm install
cp .env.example .env    # ajusta VITE_API_URL si el backend no está en localhost:4000
npm run dev
```

Build de producción:
```bash
npm run build   # genera /dist
npm run preview # sirve /dist localmente para probar
```

## Estructura

```
src/
  api/           # axios + un archivo por módulo del backend (auth, usuarios, productos, ...)
  store/         # Pinia: auth.js (sesión/JWT), notifications.js (toasts)
  router/        # rutas + guards (requiereAuth, roles)
  layouts/       # AdminLayout.vue (sidebar + topbar)
  components/    # ModalDialog, PaginationBar, EmptyState, ToastStack, icons
  views/
    auth/            # Login, Registro, Recuperar contraseña
    usuarios/         # CRUD usuarios (solo ADMIN)
    productos/         # CRUD productos + categorías
    proveedores/        # CRUD proveedores/clientes (tabla personas)
    compras/             # Histórico, registrar compra, detalle
    ventas/               # Histórico, registrar venta, detalle (con descarga PDF/XML)
    auditoria/             # Historial de peticiones a la API (solo ADMIN)
```

## Autenticación
- El `accessToken` y `refreshToken` se guardan en `localStorage`.
- Cada request adjunta `Authorization: Bearer <token>` automáticamente (`api/http.js`).
- Si el backend responde 401, el interceptor intenta renovar el token con `/auth/refresh-token` una sola vez; si falla, se cierra sesión y redirige a `/login`.
- Las rutas están protegidas con `meta.requiereAuth`; las de solo-ADMIN (`usuarios`, `auditoria`) usan `meta.roles`.

## Documentos de ventas
Los PDF/XML guardados en el servidor (rutas `pdf_local_path` / `xml_local_path` en la tabla `ventas`) se descargan solo estando autenticado: se piden como `blob` vía Axios (para que viaje el header `Authorization`, algo que un `<a href>` normal no puede hacer) y luego se disparan como descarga en el navegador. Ver `src/api/documentos.js`.

## Diseño
Paleta "librería": verde bosque (`--color-forest`), pergamino cálido (`--color-bg`), acento dorado (`--color-gold`) y vino para estados de error/eliminación. Tipografía `Fraunces` (display) + `Inter` (cuerpo) + `JetBrains Mono` (códigos/SKUs), cargadas desde Google Fonts en `index.html`. Todos los tokens están centralizados en `src/style.css`.

## Notas
- El registro público (`/registro`) asigna un rol elegido por el usuario; en producción se recomienda que solo un ADMIN pueda crear cuentas con rol ADMIN (ajustar según tus reglas de negocio).
- El campo `usuarioId` de compras/ventas se asigna automáticamente en el backend a partir del token, nunca se envía desde el frontend.
- Todas las peticiones de listados aceptan `page`/`limit` y se muestran con `PaginationBar.vue`.

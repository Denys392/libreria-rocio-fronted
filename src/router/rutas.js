// Definición de las pantallas. Se separa de index.js (que crea el router y el guard) para poder
// revisarla con tests sin un navegador.
//
// meta.publico : no requiere sesión (login y retorno del sistema central)
// meta.libre   : cualquier usuario con sesión puede entrar (no depende del menú)
// meta.menu    : opción del MENÚ DEL CENTRAL que da acceso a esta pantalla. Si el rol no tiene
//                esa opción en su menú, no puede entrar (ni escribiendo la URL a mano).
export const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/auth/LoginView.vue'),
    meta: { publico: true },
  },
  {
    path: '/callback',
    name: 'callback',
    component: () => import('../views/auth/CallbackView.vue'),
    meta: { publico: true },
  },
  {
    path: '/',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiereAuth: true },
    children: [
      { path: '', name: 'dashboard', component: () => import('../views/DashboardView.vue'), meta: { menu: '/' } },
      { path: 'perfil', name: 'perfil', component: () => import('../views/PerfilView.vue'), meta: { libre: true } },

      { path: 'productos', name: 'productos', component: () => import('../views/productos/ProductosListView.vue'), meta: { menu: '/productos' } },
      { path: 'productos/categorias', name: 'categorias', component: () => import('../views/productos/CategoriasView.vue'), meta: { menu: '/productos/categorias' } },
      { path: 'proveedores', name: 'proveedores', component: () => import('../views/proveedores/ProveedoresListView.vue'), meta: { menu: '/proveedores' } },

      { path: 'compras', name: 'compras', component: () => import('../views/compras/ComprasHistoricoView.vue'), meta: { menu: '/compras' } },
      { path: 'compras/nueva', name: 'compras-nueva', component: () => import('../views/compras/CompraNuevaView.vue'), meta: { menu: '/compras/nueva' } },
      { path: 'compras/:id', name: 'compras-detalle', component: () => import('../views/compras/CompraDetalleView.vue'), meta: { menu: '/compras' } },

      { path: 'ventas', name: 'ventas', component: () => import('../views/ventas/VentasHistoricoView.vue'), meta: { menu: '/ventas' } },
      { path: 'ventas/nueva', name: 'ventas-nueva', component: () => import('../views/ventas/VentaNuevaView.vue'), meta: { menu: '/ventas/nueva' } },
      { path: 'ventas/:id', name: 'ventas-detalle', component: () => import('../views/ventas/VentaDetalleView.vue'), meta: { menu: '/ventas' } },

      { path: 'clientes', name: 'clientes', component: () => import('../views/clientes/ClientesListView.vue'), meta: { menu: '/clientes' } },
      { path: 'clientes/nuevo', name: 'clientes-nuevo', component: () => import('../views/clientes/ClienteNuevoView.vue'), meta: { menu: '/clientes/nuevo' } },
      { path: 'clientes/ventas', name: 'clientes-ventas', component: () => import('../views/clientes/VentasClienteView.vue'), meta: { menu: '/clientes/ventas' } },
      { path: 'fidelizacion/puntos', name: 'fidelizacion-puntos', component: () => import('../views/clientes/PuntosView.vue'), meta: { menu: '/fidelizacion/puntos' } },
      { path: 'fidelizacion/reglas', name: 'fidelizacion-reglas', component: () => import('../views/clientes/ReglasPuntosView.vue'), meta: { menu: '/fidelizacion/reglas' } },

      { path: 'seguridad/logs', name: 'seguridad-logs', component: () => import('../views/seguridad/LogsAccesoView.vue'), meta: { menu: '/seguridad/logs' } },
      { path: 'seguridad/dashboard', name: 'seguridad-dashboard', component: () => import('../views/seguridad/DashboardAccesosView.vue'), meta: { menu: '/seguridad/dashboard' } },
      { path: 'seguridad/usuarios/nuevo', name: 'seguridad-usuarios-nuevo', component: () => import('../views/seguridad/CrearUsuarioView.vue'), meta: { menu: '/seguridad/usuarios/nuevo' } },
      { path: 'seguridad/menus', name: 'seguridad-menus', component: () => import('../views/seguridad/MenusView.vue'), meta: { menu: '/seguridad/menus' } },
      { path: 'seguridad/accesos', name: 'seguridad-accesos', component: () => import('../views/seguridad/AccesosView.vue'), meta: { menu: '/seguridad/accesos' } },

      { path: 'auditoria', name: 'auditoria', component: () => import('../views/auditoria/AuditoriaView.vue'), meta: { menu: '/auditoria' } },

      { path: 'scraping', name: 'scraping', component: () => import('../views/scraping/ScrapingView.vue'), meta: { menu: '/scraping' } },
      { path: 'scraping/comparaciones', name: 'scraping-comparaciones', component: () => import('../views/scraping/Comparacionespreciosview.vue'), meta: { menu: '/scraping/comparaciones' } },
      { path: 'scraping/:id', name: 'scraping-detalle', component: () => import('../views/scraping/Scrapingdetalleview.vue'), meta: { menu: '/scraping' } },

      { path: 'integraciones', name: 'integraciones', component: () => import('../views/integraciones/IntegracionesView.vue'), meta: { menu: '/integraciones' } },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { publico: true },
  },
];

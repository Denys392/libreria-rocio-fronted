import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../store/auth";

const routes = [
  {
    path: "/login",
    name: "login",
    component: () => import("../views/auth/LoginView.vue"),
    meta: { publico: true },
  },
  {
    path: "/registro",
    name: "registro",
    component: () => import("../views/auth/RegistroView.vue"),
    meta: { publico: true },
  },
  {
    path: "/recuperar-password",
    name: "recuperar-password",
    component: () => import("../views/auth/RecuperarPasswordView.vue"),
    meta: { publico: true },
  },
  {
    path: "/",
    component: () => import("../layouts/AdminLayout.vue"),
    meta: { requiereAuth: true },
    children: [
      {
        path: "",
        name: "dashboard",
        component: () => import("../views/DashboardView.vue"),
      },

      {
        path: "perfil",
        name: "perfil",
        component: () => import("../views/PerfilView.vue"),
      },

      {
        path: "usuarios",
        name: "usuarios",
        component: () => import("../views/usuarios/UsuariosListView.vue"),
        meta: { roles: ["ADMIN"] },
      },

      {
        path: "productos",
        name: "productos",
        component: () => import("../views/productos/ProductosListView.vue"),
      },
      {
        path: "productos/categorias",
        name: "categorias",
        component: () => import("../views/productos/CategoriasView.vue"),
      },

      {
        path: "proveedores",
        name: "proveedores",
        component: () => import("../views/proveedores/ProveedoresListView.vue"),
      },

      {
        path: "compras",
        name: "compras",
        component: () => import("../views/compras/ComprasHistoricoView.vue"),
      },
      {
        path: "compras/nueva",
        name: "compras-nueva",
        component: () => import("../views/compras/CompraNuevaView.vue"),
      },
      {
        path: "compras/:id",
        name: "compras-detalle",
        component: () => import("../views/compras/CompraDetalleView.vue"),
      },

      {
        path: "ventas",
        name: "ventas",
        component: () => import("../views/ventas/VentasHistoricoView.vue"),
      },
      {
        path: "ventas/nueva",
        name: "ventas-nueva",
        component: () => import("../views/ventas/VentaNuevaView.vue"),
      },
      {
        path: "ventas/:id",
        name: "ventas-detalle",
        component: () => import("../views/ventas/VentaDetalleView.vue"),
      },

      {
        path: "auditoria",
        name: "auditoria",
        component: () => import("../views/auditoria/AuditoriaView.vue"),
        meta: { roles: ["ADMIN"] },
      },

      {
        path: "/scraping",
        name: "Scraping",
        component: () => import("../views/scraping/ScrapingView.vue"),
        meta: {
          requiresAuth: true,
          roles: ["ADMIN"],
        },
      },
      {
        path: "scraping/:id",
        name: "scraping-detalle",
        component: () => import("../views/scraping/Scrapingdetalleview.vue"),
        meta: { roles: ["ADMIN", "OPERADOR"] },
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("../views/NotFoundView.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.meta.requiereAuth && !auth.estaAutenticado) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  if (to.meta.publico && auth.estaAutenticado) {
    return { name: "dashboard" };
  }

  if (to.meta.roles && !to.meta.roles.includes(auth.rol)) {
    return { name: "dashboard" };
  }

  return true;
});

export default router;

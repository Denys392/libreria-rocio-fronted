import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../store/auth";
import { routes } from "./rutas";
import { puedeEntrar, primeraRuta } from "../utils/menu";

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  // Pantallas públicas: login y retorno del sistema central
  if (to.meta.publico) {
    if (to.name === "login" && auth.estaAutenticado) return { name: "dashboard" };
    return true;
  }

  if (!auth.estaAutenticado) return { name: "login" };

  // El menú ya no está escrito en el frontend: se pide al central la primera vez
  if (!auth.menuCargado) await auth.cargarMenu();
  if (!auth.estaAutenticado) return { name: "login" }; // el central rechazó el token

  if (to.meta.libre) return true;

  // Solo se entra a las pantallas cuyas opciones están en el menú del rol (también por URL directa)
  if (puedeEntrar(to.meta.menu, auth.menu)) return true;

  const destino = primeraRuta(auth.menu);
  if (destino && destino !== to.path) return destino;
  return { name: "perfil" };
});

export default router;

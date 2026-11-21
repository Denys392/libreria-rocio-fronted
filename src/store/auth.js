import { defineStore } from 'pinia';
import { authApi } from '../api/auth';
import { CENTRAL_URL } from '../config';
import { guardarSesion, leerSesion, limpiarSesion } from '../utils/sesion';
import { rutasDelMenu, mismoMenu } from '../utils/menu';

const inicial = leerSesion(localStorage);

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: inicial.accessToken,
    usuario: inicial.usuario, // { id, correo, nombre }
    rolActual: inicial.rol, // { codigo, nombre }
    aplicacion: inicial.aplicacion, // { codigo, nombre }
    menu: [], // lo entrega el sistema central (solo el del rol elegido)
    menuCargado: false,
    errorMenu: ''
  }),

  getters: {
    estaAutenticado: (state) => !!state.accessToken,
    rol: (state) => (state.rolActual ? state.rolActual.nombre : null),
    rolCodigo: (state) => (state.rolActual ? state.rolActual.codigo : null),
    // auth.tieneRol('ALMACENERO') -> para ocultar botones; el backend igual lo exige
    tieneRol: (state) => (...codigos) => codigos.includes(state.rolActual && state.rolActual.codigo),
    // auth.puede('/ventas') -> ¿el menú de este rol incluye esa opción?
    puede: (state) => (ruta) => rutasDelMenu(state.menu).has(ruta)
  },

  actions: {
    // Cambia el código de un solo uso (que trae /callback) por el token de esta aplicación
    async iniciarConCodigo(codigo, app) {
      const { data } = await authApi.canjear(codigo, app);
      const d = data.data;
      guardarSesion(localStorage, d);
      this.accessToken = d.accessToken;
      this.usuario = d.usuario;
      this.rolActual = d.rol;
      this.aplicacion = d.aplicacion;
      this.menu = [];
      this.menuCargado = false;
      this.errorMenu = '';
    },

    // Pide al central el menú SOLO de este rol. Devuelve true si se pudo.
    async cargarMenu() {
      try {
        const { data } = await authApi.menu();
        this.menu = data.data.menu || [];
        this.errorMenu = '';
        return true;
      } catch (err) {
        this.menu = [];
        if (err.response && err.response.status === 401) {
          this.limpiar(); // sesión vencida o cerrada: el interceptor ya lleva al login del central
        } else {
          this.errorMenu = (err.response && err.response.data && err.response.data.message) || 'No se pudo cargar el menú.';
        }
        return false;
      } finally {
        this.menuCargado = true; // no reintenta solo en cada navegación; hay botón "Reintentar"
      }
    },

    // Vuelve a pedir el menú SIN molestar: si Seguridad activó o desactivó opciones, se nota sin volver a entrar.
    // Si falla (central caído, red), se conserva el menú actual. Devuelve true solo si el menú cambió.
    async refrescarMenu() {
      if (!this.accessToken) return false;
      try {
        const { data } = await authApi.menu();
        const nuevo = data.data.menu || [];
        if (mismoMenu(nuevo, this.menu)) return false;
        this.menu = nuevo;
        this.errorMenu = '';
        return true;
      } catch (err) {
        if (err.response && err.response.status === 401) this.limpiar(); // sesión cerrada: el interceptor lleva al login
        return false;
      }
    },

    async reintentarMenu() {
      this.menuCargado = false;
      await this.cargarMenu();
    },

    limpiar() {
      limpiarSesion(localStorage);
      Object.assign(this, {
        accessToken: null, usuario: null, rolActual: null, aplicacion: null, menu: [], menuCargado: false, errorMenu: ''
      });
    },

    // Cierra la sesión también en el sistema central y vuelve a su pantalla de acceso
    async cerrarSesion() {
      try {
        await authApi.logout();
      } catch {
        /* si el central no responde igual se cierra la sesión local */
      }
      this.limpiar();
      window.location.assign(CENTRAL_URL);
    }
  }
});

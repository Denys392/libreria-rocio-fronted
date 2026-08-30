import { defineStore } from 'pinia';
import { authApi } from '../api/auth';
import { usuariosApi } from '../api/usuarios';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem('accessToken') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    usuario: JSON.parse(localStorage.getItem('usuario') || 'null')
  }),

  getters: {
    estaAutenticado: (state) => !!state.accessToken,
    rol: (state) => state.usuario?.rol_nombre || null,
    esAdmin: (state) => state.usuario?.rol_nombre === 'ADMIN'
  },

  actions: {
    async login(email, password) {
      const { data } = await authApi.login(email, password);
      this.accessToken = data.data.accessToken;
      this.refreshToken = data.data.refreshToken;
      this.usuario = data.data.usuario;
      localStorage.setItem('accessToken', this.accessToken);
      localStorage.setItem('refreshToken', this.refreshToken);
      localStorage.setItem('usuario', JSON.stringify(this.usuario));
    },

    async cargarPerfil() {
      if (!this.accessToken) return;
      try {
        const { data } = await usuariosApi.perfil();
        this.usuario = { ...this.usuario, ...data.data };
        localStorage.setItem('usuario', JSON.stringify(this.usuario));
      } catch {
        // token inválido, se maneja en el interceptor http
      }
    },

    logout() {
      this.accessToken = null;
      this.refreshToken = null;
      this.usuario = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('usuario');
    }
  }
});

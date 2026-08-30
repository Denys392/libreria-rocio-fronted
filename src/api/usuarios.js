import http from './http';

export const usuariosApi = {
  listar: (params) => http.get('/usuarios', { params }),
  obtener: (id) => http.get(`/usuarios/${id}`),
  perfil: () => http.get('/usuarios/perfil/me'),
  crear: (payload) => http.post('/usuarios', payload),
  actualizar: (id, payload) => http.put(`/usuarios/${id}`, payload),
  eliminar: (id) => http.delete(`/usuarios/${id}`),
  roles: () => http.get('/usuarios/roles'),
  cambiarPassword: (payload) => http.post('/usuarios/perfil/cambiar-password', payload)
};

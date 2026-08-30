import http from './http';

export const productosApi = {
  listar: (params) => http.get('/productos', { params }),
  obtener: (id) => http.get(`/productos/${id}`),
  crear: (payload) => http.post('/productos', payload),
  actualizar: (id, payload) => http.put(`/productos/${id}`, payload),
  eliminar: (id) => http.delete(`/productos/${id}`),
  categorias: () => http.get('/productos/categorias'),
  crearCategoria: (payload) => http.post('/productos/categorias', payload),
  actualizarCategoria: (id, payload) => http.put(`/productos/categorias/${id}`, payload)
};

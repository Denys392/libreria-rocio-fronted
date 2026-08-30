import http from './http';

export const proveedoresApi = {
  listar: (params) => http.get('/proveedores', { params }),
  obtener: (id) => http.get(`/proveedores/${id}`),
  crear: (payload) => http.post('/proveedores', payload),
  actualizar: (id, payload) => http.put(`/proveedores/${id}`, payload),
  eliminar: (id) => http.delete(`/proveedores/${id}`)
};

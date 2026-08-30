import http from './http';

export const comprasApi = {
  registrar: (payload) => http.post('/compras', payload),
  obtener: (id) => http.get(`/compras/${id}`),
  historico: (params) => http.get('/compras/historico', { params })
};

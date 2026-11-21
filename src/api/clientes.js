import http from './http';

// Backend de Clientes (VITE_API_URL del aplicativo Clientes apunta a su propio backend)
export const clientesApi = {
  listar: (params = {}) => http.get('/clientes', { params }),
  obtener: (id) => http.get(`/clientes/${id}`),
  crear: (datos) => http.post('/clientes', datos),
  actualizar: (id, datos) => http.put(`/clientes/${id}`, datos),
  puntos: (id) => http.get(`/clientes/${id}/puntos`),
  ventas: (id, params = {}) => http.get(`/clientes/${id}/ventas`, { params })
};

export const fidelizacionApi = {
  ranking: (params = {}) => http.get('/fidelizacion/puntos', { params }),
  reglas: () => http.get('/fidelizacion/reglas'),
  cambiarRegla: (montoPorPunto) => http.put('/fidelizacion/reglas', { montoPorPunto })
};

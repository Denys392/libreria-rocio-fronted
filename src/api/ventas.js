import http from './http';

export const ventasApi = {
  registrar: (payload) => http.post('/ventas', payload),
  obtener: (id) => http.get(`/ventas/${id}`),
  historico: (params) => http.get('/ventas/historico', { params }),
  actualizarEstadoSunat: (id, payload) => http.patch(`/ventas/${id}/estado-sunat`, payload),
  obtenerProximoNumero: (tipoComprobante) => http.get(`/ventas/proximo-numero/${tipoComprobante}`)
};

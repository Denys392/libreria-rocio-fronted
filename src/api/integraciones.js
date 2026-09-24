import http from './http';

export const integracionesApi = {
  listar: () => http.get('/integraciones'),
  crear: (payload) => http.post('/integraciones', payload),
  revocar: (id) => http.patch(`/integraciones/${id}/revocar`),
  reactivar: (id) => http.patch(`/integraciones/${id}/reactivar`),
  regenerarSecreto: (id) => http.patch(`/integraciones/${id}/regenerar-secreto`)
};

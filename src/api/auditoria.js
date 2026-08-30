import http from './http';

export const auditoriaApi = {
  listar: (params) => http.get('/auditoria', { params })
};

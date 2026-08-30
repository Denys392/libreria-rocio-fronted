import http from './http';

export const authApi = {
  login: (email, password) => http.post('/auth/login', { email, password }),
  registro: (payload) => http.post('/auth/registro', payload),
  solicitarReset: (email) => http.post('/auth/solicitar-reset', { email }),
  resetPassword: (token, nuevoPassword) => http.post('/auth/reset-password', { token, nuevoPassword })
};

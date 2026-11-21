import http from './http';

// Sesión con el sistema de seguridad central (a través del backend de esta aplicación).
// La clave, el 2FA y la elección de rol ocurren en el central; aquí solo se canjea el
// código de retorno, se pide el menú del rol y se cierra la sesión.
export const authApi = {
  canjear: (codigo, app) => http.post('/auth/canjear', { codigo, app }),
  menu: () => http.get('/auth/menu'),
  logout: () => http.post('/auth/logout')
};

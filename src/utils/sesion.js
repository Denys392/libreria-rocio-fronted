// Sesión local del frontend. La clave y el 2FA NO viven aquí: los maneja el sistema central.
// Aquí solo se recuerda el token de esta aplicación y quién es el usuario.

const K = { token: 'accessToken', usuario: 'usuario', rol: 'rol', app: 'aplicacion' };

function leerJson(storage, clave) {
  try {
    const crudo = storage.getItem(clave);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
}

export function guardarSesion(storage, { accessToken, usuario, rol, aplicacion }) {
  try {
    storage.setItem(K.token, accessToken);
    storage.setItem(K.usuario, JSON.stringify(usuario || null));
    storage.setItem(K.rol, JSON.stringify(rol || null));
    storage.setItem(K.app, JSON.stringify(aplicacion || null));
  } catch { /* storage bloqueado: la sesión dura solo mientras la pestaña esté abierta */ }
}

export function leerSesion(storage) {
  let accessToken = null;
  try {
    accessToken = storage.getItem(K.token);
  } catch { /* igual */ }
  return {
    accessToken: accessToken || null,
    usuario: leerJson(storage, K.usuario),
    rol: leerJson(storage, K.rol),
    aplicacion: leerJson(storage, K.app)
  };
}

export function limpiarSesion(storage) {
  // 'refreshToken' pertenece al login anterior: se borra por si quedó guardado
  for (const clave of [...Object.values(K), 'refreshToken']) {
    try {
      storage.removeItem(clave);
    } catch { /* igual */ }
  }
}

/**
 * ¿Este error obliga a cerrar la sesión y volver al login? Solo un 401 en una petición normal.
 * No en /auth/canjear (un código inválido lo maneja la pantalla de retorno) ni en /auth/logout.
 */
export function debeCerrarSesion(error) {
  const status = error && error.response && error.response.status;
  const url = (error && error.config && error.config.url) || '';
  return status === 401 && !/\/auth\/(canjear|logout)/.test(url);
}

/** Lee el código de un solo uso de la URL de retorno (/callback?codigo=...). */
export function extraerCodigo(query) {
  const codigo = query && query.codigo;
  return typeof codigo === 'string' && codigo.length > 0 && codigo.length <= 2000 ? codigo : null;
}

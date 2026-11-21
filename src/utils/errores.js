// Texto para mostrar cuando falla una llamada al sistema central o al backend.
// Prioriza el mensaje que envió el servidor; si no hay respuesta, explica que no hay conexión.
export function mensajeDeError(err, porDefecto = 'Ocurrió un error. Intente de nuevo.') {
  const resp = err && err.response;
  if (!resp) return 'No se pudo conectar con el sistema de seguridad. Verifique su conexión.';
  const msg = resp.data && typeof resp.data.message === 'string' ? resp.data.message : '';
  if (resp.status === 403) return msg || 'No tiene permisos para esta operación.';
  if (resp.status === 429) return 'Demasiados intentos. Espere unos minutos e intente de nuevo.';
  return msg || porDefecto;
}

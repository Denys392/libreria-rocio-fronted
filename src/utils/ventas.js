// Textos del estado del stock de una venta cuando lo lleva Almacén (estado_almacen).
// CONFIRMADO = Almacén ya lo descontó. PENDIENTE = falta descontarlo (Almacén no respondió): se reintenta.

export function etiquetaEstadoAlmacen(estado) {
  return { CONFIRMADO: 'Descontado en Almacén', PENDIENTE: 'Pendiente de descontar' }[estado] || '';
}

export function claseEstadoAlmacen(estado) {
  return { CONFIRMADO: 'badge-ok', PENDIENTE: 'badge-warn' }[estado] || 'badge-off';
}

/** Qué avisar al vendedor justo después de registrar la venta. */
export function avisoTrasRegistrar(venta) {
  if (venta && venta.estado_almacen === 'PENDIENTE') {
    return {
      tipo: 'info',
      duracion: 9000,
      texto: 'Venta registrada, pero Almacén no confirmó el descuento del stock. Puede reintentarlo desde el detalle de la venta.'
    };
  }
  return { tipo: 'success', duracion: 3800, texto: 'Venta registrada correctamente. Stock actualizado.' };
}

/** Mensaje para el vendedor cuando falla el reintento de descontar el stock. */
export function mensajeReintentoFallido(err) {
  const msg = err && err.response && err.response.data && err.response.data.message;
  return typeof msg === 'string' && msg ? msg : 'No se pudo confirmar el stock en Almacén. Intente de nuevo en unos minutos.';
}

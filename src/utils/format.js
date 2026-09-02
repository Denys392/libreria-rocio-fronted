export function formatoMoneda(valor, moneda = 'PEN') {
  const simbolo = moneda === 'USD' ? '$' : 'S/';
  const num = Number(valor || 0);
  return `${simbolo} ${num.toFixed(2)}`;
}

export function formatoFecha(fecha) {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: '2-digit' });
}

export function formatoFechaHora(fecha) {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleString('es-PE', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Diferencia entre dos fechas como texto corto (ej. "8s", "1m 34s", "2h 5m").
// Devuelve "—" si falta alguna fecha (ej. comprobante aún pendiente de SUNAT).
export function formatoDuracion(inicio, fin) {
  if (!inicio || !fin) return '—';
  const ms = new Date(fin).getTime() - new Date(inicio).getTime();
  if (Number.isNaN(ms) || ms < 0) return '—';
  const totalSeg = Math.round(ms / 1000);
  if (totalSeg < 60) return `${totalSeg}s`;
  const min = Math.floor(totalSeg / 60);
  const seg = totalSeg % 60;
  if (min < 60) return `${min}m ${seg}s`;
  const horas = Math.floor(min / 60);
  return `${horas}h ${min % 60}m`;
}

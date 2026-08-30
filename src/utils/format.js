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
  return d.toLocaleString('es-PE', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// Fechas que vienen del sistema central.
// El central guarda en MySQL de la nube (hora UTC) y las entrega como texto "2026-11-19 19:49:09.123"
// SIN zona horaria. Si el navegador las leyera tal cual, las tomaría como hora local y las mostraría
// 5 horas adelantadas. Aquí se interpretan como UTC y se muestran en la hora de quien mira.

const RE_MYSQL = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(\.\d+)?$/;

/** Texto de MySQL (UTC) -> Date. Devuelve null si no es una fecha válida. */
export function mysqlADate(texto) {
  if (!texto) return null;
  const m = RE_MYSQL.exec(String(texto).trim());
  if (!m) {
    const d = new Date(texto); // ya trae zona (ISO con Z, etc.)
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(`${m[1]}T${m[2]}${m[3] || ''}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Texto de MySQL (UTC) -> "19 nov 2026, 14:49:09" en hora local. "—" si no hay fecha. */
export function formatoFechaMysql(texto) {
  if (!texto) return '—';
  const d = mysqlADate(texto);
  if (!d) return String(texto);
  return d.toLocaleString('es-PE', {
    year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

/** Duración en segundos -> "8s", "1m 34s", "2h 5m". "—" si no hay dato. */
export function formatoSegundos(seg) {
  if (seg === null || seg === undefined || seg === '') return '—';
  const total = Math.round(Number(seg));
  if (!Number.isFinite(total) || total < 0) return '—';
  if (total < 60) return `${total}s`;
  const min = Math.floor(total / 60);
  if (min < 60) return `${min}m ${total % 60}s`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

// Nombres legibles de los eventos de seguridad (los mismos que guarda el central)
export const ETIQUETAS_EVENTO = {
  LOGIN_OK: 'Clave correcta',
  CLAVE_INCORRECTA: 'Clave incorrecta',
  '2FA_OK': '2FA correcto',
  '2FA_FALLIDO': '2FA fallido',
  INGRESO_APP: 'Ingreso a la aplicación',
  LOGOUT: 'Cierre de sesión',
  TOKEN_RECHAZADO: 'Token rechazado',
  TOKEN_VENCIDO: 'Token vencido',
  USUARIO_BLOQUEADO: 'Usuario bloqueado',
  ACCESO_ACTIVADO: 'Acceso activado',
  ACCESO_DESACTIVADO: 'Acceso desactivado',
  MENU_CREADO: 'Opción de menú creada',
  MENU_MODIFICADO: 'Opción de menú modificada',
  MENU_ACTIVADO: 'Opción de menú activada',
  MENU_DESACTIVADO: 'Opción de menú desactivada'
};

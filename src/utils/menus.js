// Reglas del formulario "Opciones de menú". Son las MISMAS que aplica el central (que es quien decide
// de verdad): aquí solo sirven para avisar rápido sin esperar la respuesta.

export const ICONOS_MENU = [
  { valor: 'dash', texto: 'Panel' },
  { valor: 'box', texto: 'Caja / productos' },
  { valor: 'tag', texto: 'Etiqueta' },
  { valor: 'people', texto: 'Personas' },
  { valor: 'cart', texto: 'Carrito' },
  { valor: 'receipt', texto: 'Comprobante' },
  { valor: 'user', texto: 'Usuario' },
  { valor: 'shield', texto: 'Escudo' }
];

const RE_NOMBRE = /^[^<>\u0000-\u001f]{2,80}$/u;
const RE_RUTA = /^\/[A-Za-z0-9/_:-]{0,148}$/;

/**
 * Valida el formulario. `esPadre`: un menú padre puede no tener ruta (solo agrupa);
 * una opción hija necesita ruta.
 */
export function validarOpcion({ nombre, ruta, icono, orden }, { esPadre }) {
  const errores = {};
  const n = String(nombre ?? '').trim().replace(/\s+/g, ' ');
  if (!RE_NOMBRE.test(n)) errores.nombre = 'El nombre debe tener entre 2 y 80 caracteres (sin < ni >).';

  const r = String(ruta ?? '').trim();
  if (r === '') {
    if (!esPadre) errores.ruta = 'Una opción hija necesita una ruta (ej. /productos).';
  } else if (!RE_RUTA.test(r) || r.includes('//') || r.includes('..')) {
    errores.ruta = 'La ruta debe empezar con / y usar solo letras, números, / _ : - (ej. /productos/categorias).';
  }

  if (!ICONOS_MENU.some((i) => i.valor === icono)) errores.icono = 'Elija un icono de la lista.';

  const o = String(orden ?? '').trim();
  if (o !== '' && !(/^\d{1,3}$/.test(o))) errores.orden = 'El orden es un número entre 0 y 999 (o déjelo vacío para ponerlo al final).';

  return { ok: Object.keys(errores).length === 0, errores };
}

/** Lo que se envía al central: vacíos como "no indicado", orden como número. */
export function cuerpoDeOpcion({ nombre, ruta, icono, orden }) {
  const r = String(ruta ?? '').trim();
  const o = String(orden ?? '').trim();
  return {
    nombre: String(nombre ?? '').trim(),
    ruta: r === '' ? null : r,
    icono,
    ...(o === '' ? {} : { orden: Number(o) })
  };
}

/** Texto corto del estado de una opción en la lista. */
export function estadoDeOpcion(op) {
  if (!op.activo) return { texto: 'Desactivado', clase: 'badge-danger' };
  if (op.efectivo === false) return { texto: 'Oculto (su menú padre está desactivado)', clase: 'seg-badge-aviso' };
  return { texto: 'Activo', clase: 'badge-ok' };
}

/** Cuántas opciones hijas activas dejan de verse si se desactiva este padre. */
export function hijosQueSeOcultan(padre) {
  return (padre.hijos || []).filter((h) => h.activo).length;
}

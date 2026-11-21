// Reglas del formulario de clientes. Son las MISMAS que aplica el backend de Clientes (que es quien
// decide de verdad): aquí solo sirven para avisar rápido sin esperar la respuesta.

export const TIPOS_DOCUMENTO = [
  { valor: 'DNI', texto: 'DNI' },
  { valor: 'RUC', texto: 'RUC' },
  { valor: 'CE', texto: 'Carné de extranjería' },
  { valor: 'PAS', texto: 'Pasaporte' }
];

const DOCUMENTOS = {
  DNI: /^\d{8}$/,
  RUC: /^(10|15|17|20)\d{9}$/,
  CE: /^[A-Za-z0-9]{9,12}$/,
  PAS: /^[A-Za-z0-9]{6,12}$/
};
const RE_NOMBRE = /^[^<>\u0000-\u001f]{2,150}$/u;
const RE_EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;
const RE_TELEFONO = /^[0-9 +()-]{6,20}$/;

const vacio = (v) => v === undefined || v === null || String(v).trim() === '';

/** Valida el formulario. `soloContacto` = al EDITAR no se valida el documento (no se puede cambiar). */
export function validarCliente(f, { soloContacto = false } = {}) {
  const errores = {};
  if (!soloContacto) {
    const tipo = String(f.tipoDocumento ?? '').trim().toUpperCase();
    if (!Object.prototype.hasOwnProperty.call(DOCUMENTOS, tipo)) errores.tipoDocumento = 'Elija un tipo de documento.';
    else if (!DOCUMENTOS[tipo].test(String(f.numeroDocumento ?? '').trim())) errores.numeroDocumento = mensajeDocumento(tipo);
  }
  const nombre = String(f.razonSocial ?? '').trim().replace(/\s+/g, ' ');
  if (!RE_NOMBRE.test(nombre)) errores.razonSocial = 'El nombre debe tener entre 2 y 150 caracteres (sin < ni >).';
  if (!vacio(f.telefono) && !RE_TELEFONO.test(String(f.telefono).trim())) errores.telefono = 'Solo números, espacios, + ( ) -  (6 a 20 caracteres).';
  if (!vacio(f.email) && (!RE_EMAIL.test(String(f.email).trim()) || String(f.email).trim().length > 100)) errores.email = 'El correo no tiene un formato válido.';
  if (!vacio(f.direccion) && String(f.direccion).trim().length > 200) errores.direccion = 'La dirección no puede pasar de 200 caracteres.';
  return { ok: Object.keys(errores).length === 0, errores };
}

export function mensajeDocumento(tipo) {
  return {
    DNI: 'El DNI debe tener 8 dígitos.',
    RUC: 'El RUC debe tener 11 dígitos y empezar con 10, 15, 17 o 20.',
    CE: 'El carné de extranjería debe tener entre 9 y 12 letras o números.',
    PAS: 'El pasaporte debe tener entre 6 y 12 letras o números.'
  }[tipo] || 'Documento inválido.';
}

/** Puntos con separador de miles: 12345 -> "12 345". */
export function formatoPuntos(n) {
  if (n === null || n === undefined || n === '') return '—';
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return Math.trunc(v).toLocaleString('es-PE');
}

/** Texto de la regla: "1 punto por cada S/ 10.00". */
export function textoRegla(monto) {
  const m = Number(monto);
  if (!Number.isFinite(m) || m <= 0) return '—';
  return `1 punto por cada S/ ${m.toFixed(2)}`;
}

/** Valida el monto por punto del formulario de reglas (texto o número). Devuelve { ok, valor?, error? }. */
export function validarMontoRegla(texto) {
  const t = String(texto ?? '').trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return { ok: false, error: 'Escriba un monto con hasta 2 decimales (ej. 10 o 2.50).' };
  const v = Number(t);
  if (v < 0.5 || v > 10000) return { ok: false, error: 'El monto debe estar entre 0.50 y 10 000.' };
  return { ok: true, valor: v };
}

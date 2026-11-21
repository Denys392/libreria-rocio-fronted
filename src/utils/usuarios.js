// Reglas del formulario "Crear usuario". Son las MISMAS que aplica el central (que es quien decide de
// verdad): aquí solo sirven para avisar rápido sin esperar la respuesta del servidor.

const RE_NOMBRE = /^[\p{L}][\p{L} .'-]{1,99}$/u;
const RE_LOCAL = /^[a-z0-9][a-z0-9._-]{0,62}$/;
const COMUNES = ['password', '12345678', 'qwerty', 'admin123', 'contraseña', 'letmein'];

export function normalizarCorreo(correo) {
  return String(correo ?? '').trim().toLowerCase();
}

export function correoValido(correo, dominio) {
  const partes = normalizarCorreo(correo).split('@');
  return partes.length === 2 && partes[1] === String(dominio).toLowerCase() && RE_LOCAL.test(partes[0]) && partes.join('@').length <= 100;
}

/** Devuelve el motivo por el que la clave no sirve, o '' si cumple la política. */
export function problemaDeClave(password) {
  const p = typeof password === 'string' ? password : '';
  if (p.length < 8) return 'La clave debe tener al menos 8 caracteres.';
  if (p.length > 72) return 'La clave no puede superar 72 caracteres.';
  if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return 'La clave debe tener letras y números.';
  if (COMUNES.some((c) => p.toLowerCase().includes(c))) return 'La clave es demasiado común.';
  return '';
}

/** Valida el formulario completo. { ok, errores: { nombre?, correo?, password?, roles? } } */
export function validarFormulario({ nombre, correo, password, rolIds }, dominio) {
  const errores = {};
  const nombreLimpio = String(nombre ?? '').trim().replace(/\s+/g, ' ');
  if (!RE_NOMBRE.test(nombreLimpio)) errores.nombre = 'El nombre debe tener entre 2 y 100 letras (sin números ni símbolos).';
  if (!correoValido(correo, dominio)) errores.correo = `El correo debe ser del dominio @${dominio} (ej. nombre@${dominio}).`;
  const pc = problemaDeClave(password);
  if (pc) errores.password = pc;
  if (!Array.isArray(rolIds) || rolIds.length === 0) errores.roles = 'Elija al menos un rol.';
  return { ok: Object.keys(errores).length === 0, errores };
}

const MAYUS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sin I ni O (se confunden con 1 y 0)
const MINUS = 'abcdefghijkmnopqrstuvwxyz'; // sin l
const DIGITOS = '23456789';
const SIMBOLOS = '-_.!';

// Número aleatorio en [0, max) con el generador seguro del navegador (sin sesgo por módulo)
function aleatorioSeguro(max) {
  const cripto = globalThis.crypto;
  const limite = Math.floor(0x100000000 / max) * max;
  const un = new Uint32Array(1);
  do { cripto.getRandomValues(un); } while (un[0] >= limite);
  return un[0] % max;
}

/**
 * Clave inicial aleatoria de 16 caracteres que siempre cumple la política
 * (mayúscula, minúscula, número y símbolo). `aleatorio(max)` se puede inyectar para probar.
 */
export function generarClave(aleatorio = aleatorioSeguro, largo = 16) {
  const todos = MAYUS + MINUS + DIGITOS + SIMBOLOS;
  const elegir = (alfabeto) => alfabeto[aleatorio(alfabeto.length)];
  const letras = [elegir(MAYUS), elegir(MINUS), elegir(DIGITOS), elegir(SIMBOLOS)];
  while (letras.length < largo) letras.push(elegir(todos));
  // mezcla (Fisher-Yates) para que los obligatorios no queden siempre al inicio
  for (let i = letras.length - 1; i > 0; i--) {
    const j = aleatorio(i + 1);
    [letras[i], letras[j]] = [letras[j], letras[i]];
  }
  return letras.join('');
}

/** Agrupa el catálogo de roles por aplicación para mostrarlo como casillas. */
export function agruparRolesPorApp(roles) {
  const porApp = new Map();
  for (const r of roles || []) {
    if (!porApp.has(r.aplicacion.codigo)) porApp.set(r.aplicacion.codigo, { app: r.aplicacion, roles: [] });
    porApp.get(r.aplicacion.codigo).roles.push(r);
  }
  return [...porApp.values()];
}

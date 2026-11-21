// Lógica del menú que entrega el sistema central. El menú YA NO está escrito en el frontend:
// llega con la forma  [{ nombre, ruta, icono, hijos: [{ nombre, ruta, icono }] }]  (solo el del rol).

const ICONOS = ['dash', 'box', 'tag', 'people', 'cart', 'receipt', 'user', 'shield'];

/** Todas las rutas que el menú del rol permite (padres con ruta e hijos). */
export function rutasDelMenu(menu) {
  const rutas = new Set();
  for (const padre of Array.isArray(menu) ? menu : []) {
    if (padre && padre.ruta) rutas.add(padre.ruta);
    for (const hijo of (padre && padre.hijos) || []) {
      if (hijo && hijo.ruta) rutas.add(hijo.ruta);
    }
  }
  return rutas;
}

/**
 * ¿Puede entrar a una pantalla? `rutaMenu` es la opción del menú que da acceso a esa pantalla
 * (cada ruta del router la declara en meta.menu; ej. el detalle de una venta usa '/ventas').
 * Coincidencia EXACTA con el menú: no se adivina por prefijos.
 */
export function puedeEntrar(rutaMenu, menu) {
  return Boolean(rutaMenu) && rutasDelMenu(menu).has(rutaMenu);
}

/** Primera pantalla del menú (para llevar al usuario a un lugar permitido). */
export function primeraRuta(menu) {
  for (const padre of Array.isArray(menu) ? menu : []) {
    if (padre && padre.ruta) return padre.ruta;
    for (const hijo of (padre && padre.hijos) || []) {
      if (hijo && hijo.ruta) return hijo.ruta;
    }
  }
  return null;
}

/** Nombre de icono conocido; si el central manda uno nuevo, se usa uno por defecto. */
export function iconoValido(nombre) {
  return ICONOS.includes(nombre) ? nombre : 'dash';
}

/** ¿Es el mismo menú? (para no redibujar si Seguridad no cambió nada). */
export function mismoMenu(a, b) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

/**
 * Si Seguridad desactivó la opción de la pantalla donde está la persona, adónde llevarla.
 * Devuelve null si todavía puede quedarse (o si la pantalla no depende del menú).
 *   meta = { menu, libre, publico } de la ruta actual · rutaActual = su path
 */
export function destinoSiYaNoPermitida(menu, meta, rutaActual) {
  if (!meta || meta.publico || meta.libre || !meta.menu) return null;
  if (puedeEntrar(meta.menu, menu)) return null;
  const destino = primeraRuta(menu);
  if (destino && destino !== rutaActual) return destino;
  return '/perfil'; // pantalla que no depende del menú
}

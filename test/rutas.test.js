import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { routes } from '../src/router/rutas.js';
import { puedeEntrar } from '../src/utils/menu.js';

// Aplana el árbol de rutas (hijos del layout) a una lista { name, path, meta }
function aplanar(lista, prefijo = '') {
  const out = [];
  for (const r of lista) {
    const ruta = r.path.startsWith('/') ? r.path : `${prefijo.replace(/\/$/, '')}/${r.path}`;
    if (r.children) out.push(...aplanar(r.children, ruta));
    else out.push({ name: r.name, path: ruta === '' ? '/' : ruta.replace(/\/$/, '') || '/', meta: r.meta || {} });
  }
  return out;
}
const pantallas = aplanar(routes);

// Menús que el seed de la base entrega a cada aplicativo (sql/seed_seguridad_transversal.sql)
const MENUS = {
  libreria: ['/', '/ventas/nueva', '/ventas', '/productos', '/proveedores'],
  almacen: ['/', '/productos', '/productos/categorias', '/proveedores', '/compras/nueva', '/compras', '/scraping', '/scraping/comparaciones'],
  clientes: ['/', '/clientes', '/clientes/nuevo', '/fidelizacion/puntos', '/fidelizacion/reglas', '/clientes/ventas'],
  seguridad: ['/', '/seguridad/logs', '/seguridad/dashboard', '/seguridad/accesos', '/seguridad/usuarios/nuevo', '/seguridad/menus', '/auditoria', '/integraciones', '/integraciones/consumo']
};
const comoMenu = (rutas) => [{ nombre: 'Todo', ruta: null, hijos: rutas.map((ruta) => ({ nombre: ruta, ruta })) }];

describe('pantallas del frontend', () => {
  test('ya no existen las pantallas del login propio (registro, recuperar clave, usuarios)', () => {
    const rutas = pantallas.map((p) => p.path);
    for (const vieja of ['/registro', '/recuperar-password', '/usuarios']) {
      assert.ok(!rutas.includes(vieja), `${vieja} debería estar desmontada`);
    }
  });

  test('existe el retorno del sistema central (/callback) y es público', () => {
    const cb = pantallas.find((p) => p.path === '/callback');
    assert.ok(cb);
    assert.equal(cb.meta.publico, true);
  });

  test('los nombres de ruta no se repiten', () => {
    const nombres = pantallas.map((p) => p.name);
    assert.equal(new Set(nombres).size, nombres.length);
  });

  test('toda pantalla es pública, libre para cualquier usuario con sesión, o declara su opción del menú', () => {
    for (const p of pantallas) {
      const ok = p.meta.publico || p.meta.libre || typeof p.meta.menu === 'string';
      assert.ok(ok, `la ruta ${p.path} (${p.name}) no declara meta.publico, meta.libre ni meta.menu: quedaría abierta`);
    }
  });

  test('las pantallas "libres" son solo el perfil', () => {
    assert.deepEqual(pantallas.filter((p) => p.meta.libre).map((p) => p.name), ['perfil']);
  });

  test('ninguna pantalla usa el control por rol antiguo (meta.roles)', () => {
    assert.ok(pantallas.every((p) => p.meta.roles === undefined));
  });

  describe('qué pantallas abre el menú de cada aplicativo', () => {
    const abre = (app) => pantallas.filter((p) => puedeEntrar(p.meta.menu, comoMenu(MENUS[app]))).map((p) => p.name).sort();

    test('Librería (VENDEDOR): panel, ventas (con su detalle), catálogo y clientes', () => {
      assert.deepEqual(abre('libreria'), ['dashboard', 'productos', 'proveedores', 'ventas', 'ventas-detalle', 'ventas-nueva']);
    });

    test('Almacén (ALMACENERO): inventario, proveedores, compras y precios', () => {
      assert.deepEqual(abre('almacen'), [
        'categorias', 'compras', 'compras-detalle', 'compras-nueva', 'dashboard', 'productos', 'proveedores',
        'scraping', 'scraping-comparaciones', 'scraping-detalle'
      ]);
    });

    test('Seguridad: panel, logs, dashboard y administración de accesos, auditoría e integraciones', () => {
      assert.deepEqual(abre('seguridad'), [
        'auditoria', 'dashboard', 'integraciones', 'seguridad-accesos', 'seguridad-dashboard', 'seguridad-logs', 'seguridad-menus', 'seguridad-usuarios-nuevo'
      ]);
    });

    test('Clientes (GESTOR_CLIENTES): panel, clientes, compras por cliente y fidelización', () => {
      assert.deepEqual(abre('clientes'), [
        'clientes', 'clientes-nuevo', 'clientes-ventas', 'dashboard', 'fidelizacion-puntos', 'fidelizacion-reglas'
      ]);
    });

    test('el GESTOR_CLIENTES no entra a ventas, compras, auditoría ni logs escribiendo la URL', () => {
      const permitidas = abre('clientes');
      for (const prohibida of ['ventas', 'ventas-nueva', 'compras', 'scraping', 'auditoria', 'integraciones', 'seguridad-logs', 'seguridad-accesos']) {
        assert.ok(!permitidas.includes(prohibida), prohibida);
      }
    });

    test('el VENDEDOR no puede entrar a compras, scraping, auditoría ni integraciones escribiendo la URL', () => {
      const permitidas = abre('libreria');
      for (const prohibida of ['compras', 'compras-nueva', 'compras-detalle', 'scraping', 'scraping-detalle', 'auditoria', 'integraciones', 'categorias']) {
        assert.ok(!permitidas.includes(prohibida), prohibida);
      }
    });
  });

  test('opciones del menú del seed que AÚN no tienen pantalla en este frontend (pendientes conocidos)', () => {
    const conPantalla = new Set(pantallas.map((p) => p.meta.menu).filter(Boolean));
    const sinPantalla = new Set();
    for (const rutas of Object.values(MENUS)) for (const r of rutas) if (!conPantalla.has(r)) sinPantalla.add(r);
    // Si se implementa alguna, hay que actualizar esta lista a propósito.
    assert.deepEqual([...sinPantalla].sort(), [
      '/integraciones/consumo'
    ]);
  });
});

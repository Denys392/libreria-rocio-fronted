import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { rutasDelMenu, puedeEntrar, primeraRuta, iconoValido } from '../src/utils/menu.js';

// Menú del VENDEDOR tal como lo entrega el sistema central
const MENU_VENDEDOR = [
  { nombre: 'General', ruta: null, icono: 'dash', hijos: [{ nombre: 'Panel principal', ruta: '/', icono: 'dash' }] },
  {
    nombre: 'Ventas', ruta: null, icono: 'receipt',
    hijos: [{ nombre: 'Nueva venta', ruta: '/ventas/nueva' }, { nombre: 'Histórico de ventas', ruta: '/ventas' }]
  },
  { nombre: 'Consultas', ruta: null, hijos: [{ nombre: 'Catálogo y stock', ruta: '/productos' }, { nombre: 'Clientes', ruta: '/proveedores' }] }
];

describe('menú del sistema central', () => {
  test('rutasDelMenu junta las rutas de padres e hijos', () => {
    assert.deepEqual([...rutasDelMenu(MENU_VENDEDOR)].sort(), ['/', '/productos', '/proveedores', '/ventas', '/ventas/nueva']);
  });

  test('un padre con ruta propia también cuenta', () => {
    assert.ok(rutasDelMenu([{ nombre: 'Inicio', ruta: '/inicio', hijos: [] }]).has('/inicio'));
  });

  test('un menú vacío o inválido no permite nada y no rompe', () => {
    for (const malo of [[], null, undefined, 'x', {}, [null], [{ hijos: null }]]) {
      assert.equal(rutasDelMenu(malo).size, 0);
      assert.equal(puedeEntrar('/ventas', malo), false);
    }
  });

  describe('puedeEntrar', () => {
    test('permite las opciones que están en el menú', () => {
      assert.equal(puedeEntrar('/ventas', MENU_VENDEDOR), true);
      assert.equal(puedeEntrar('/ventas/nueva', MENU_VENDEDOR), true);
      assert.equal(puedeEntrar('/', MENU_VENDEDOR), true);
    });

    test('NO permite opciones que el rol no tiene (el vendedor no ve compras ni auditoría)', () => {
      assert.equal(puedeEntrar('/compras', MENU_VENDEDOR), false);
      assert.equal(puedeEntrar('/auditoria', MENU_VENDEDOR), false);
      assert.equal(puedeEntrar('/scraping', MENU_VENDEDOR), false);
      assert.equal(puedeEntrar('/integraciones', MENU_VENDEDOR), false);
    });

    test('la coincidencia es exacta: no se cuela por prefijo', () => {
      // El vendedor tiene /productos, pero NO /productos/categorias
      assert.equal(puedeEntrar('/productos/categorias', MENU_VENDEDOR), false);
      assert.equal(puedeEntrar('/ven', MENU_VENDEDOR), false);
      assert.equal(puedeEntrar('/ventas/', MENU_VENDEDOR), false);
    });

    test('sin ruta de menú declarada no se permite (falla cerrado)', () => {
      assert.equal(puedeEntrar(undefined, MENU_VENDEDOR), false);
      assert.equal(puedeEntrar('', MENU_VENDEDOR), false);
      assert.equal(puedeEntrar(null, MENU_VENDEDOR), false);
    });
  });

  describe('primeraRuta', () => {
    test('devuelve la primera pantalla del menú', () => {
      assert.equal(primeraRuta(MENU_VENDEDOR), '/');
      assert.equal(primeraRuta([{ nombre: 'X', hijos: [{ nombre: 'a', ruta: '/a' }] }]), '/a');
    });
    test('un menú sin rutas devuelve null', () => {
      assert.equal(primeraRuta([]), null);
      assert.equal(primeraRuta(null), null);
      assert.equal(primeraRuta([{ nombre: 'Grupo', ruta: null, hijos: [] }]), null);
    });
  });

  test('iconoValido: conocidos tal cual, desconocidos o vacíos usan uno por defecto', () => {
    assert.equal(iconoValido('shield'), 'shield');
    assert.equal(iconoValido('receipt'), 'receipt');
    assert.equal(iconoValido('cohete'), 'dash');
    assert.equal(iconoValido(undefined), 'dash');
    assert.equal(iconoValido(null), 'dash');
  });
});

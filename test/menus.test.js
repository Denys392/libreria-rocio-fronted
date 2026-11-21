import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validarOpcion, cuerpoDeOpcion, estadoDeOpcion, hijosQueSeOcultan, ICONOS_MENU } from '../src/utils/menus.js';
import { mismoMenu, destinoSiYaNoPermitida } from '../src/utils/menu.js';

const HIJA = { nombre: 'Histórico', ruta: '/ventas', icono: 'receipt', orden: '' };

describe('validarOpcion', () => {
  test('una opción hija correcta no tiene errores', () => {
    assert.deepEqual(validarOpcion(HIJA, { esPadre: false }), { ok: true, errores: {} });
  });

  test('un menú padre puede no tener ruta (solo agrupa); una hija no', () => {
    assert.equal(validarOpcion({ ...HIJA, ruta: '' }, { esPadre: true }).ok, true);
    assert.ok(validarOpcion({ ...HIJA, ruta: '' }, { esPadre: false }).errores.ruta);
    assert.ok(validarOpcion({ ...HIJA, ruta: undefined }, { esPadre: false }).errores.ruta);
  });

  test('rutas malas: sin /, con espacios, //, .., etiquetas o inyección', () => {
    for (const ruta of ['ventas', '/mis ventas', '//evil.com', '/../x', '/<script>', "/x'; DROP TABLE seg_menu;--", '/ñandú', '/' + 'a'.repeat(150)]) {
      assert.ok(validarOpcion({ ...HIJA, ruta }, { esPadre: false }).errores.ruta, ruta);
    }
  });

  test('rutas buenas: "/", anidadas, con guion y dos puntos', () => {
    for (const ruta of ['/', '/ventas/nueva', '/seguridad/usuarios/nuevo', '/fidelizacion/puntos', '/x/:id', '/a_b-c']) {
      assert.equal(validarOpcion({ ...HIJA, ruta }, { esPadre: false }).ok, true, ruta);
    }
  });

  test('nombre: vacío, de 1 letra, con etiquetas o larguísimo -> error', () => {
    for (const nombre of ['', ' ', 'A', '<b>x</b>', 'x'.repeat(81), undefined]) {
      assert.ok(validarOpcion({ ...HIJA, nombre }, { esPadre: false }).errores.nombre, String(nombre));
    }
  });

  test('icono: solo los de la lista', () => {
    for (const i of ICONOS_MENU) assert.equal(validarOpcion({ ...HIJA, icono: i.valor }, { esPadre: false }).ok, true, i.valor);
    for (const icono of ['bomba', '', undefined, 'constructor']) assert.ok(validarOpcion({ ...HIJA, icono }, { esPadre: false }).errores.icono, String(icono));
  });

  test('orden: vacío o entero 0-999; lo demás se rechaza', () => {
    for (const orden of ['', '0', '7', '999', ' 5 ', undefined]) assert.equal(validarOpcion({ ...HIJA, orden }, { esPadre: false }).ok, true, String(orden));
    for (const orden of ['-1', '1.5', 'abc', '1000', '1e2']) assert.ok(validarOpcion({ ...HIJA, orden }, { esPadre: false }).errores.orden, orden);
  });
});

describe('cuerpoDeOpcion', () => {
  test('limpia espacios, ruta vacía -> null, orden vacío no se envía, orden con texto -> número', () => {
    assert.deepEqual(cuerpoDeOpcion({ nombre: '  X  ', ruta: '  ', icono: 'box', orden: '' }), { nombre: 'X', ruta: null, icono: 'box' });
    assert.deepEqual(cuerpoDeOpcion({ nombre: 'X', ruta: ' /x ', icono: 'box', orden: '4' }), { nombre: 'X', ruta: '/x', icono: 'box', orden: 4 });
  });
});

describe('estadoDeOpcion y hijosQueSeOcultan', () => {
  test('activo, desactivado y "oculto por su padre" se distinguen', () => {
    assert.equal(estadoDeOpcion({ activo: true, efectivo: true }).texto, 'Activo');
    assert.equal(estadoDeOpcion({ activo: false, efectivo: false }).texto, 'Desactivado');
    assert.match(estadoDeOpcion({ activo: true, efectivo: false }).texto, /Oculto/);
    assert.equal(estadoDeOpcion({ activo: false }).clase, 'badge-danger');
  });

  test('cuenta solo las hijas activas', () => {
    assert.equal(hijosQueSeOcultan({ hijos: [{ activo: true }, { activo: false }, { activo: true }] }), 2);
    assert.equal(hijosQueSeOcultan({}), 0);
  });
});

describe('refresco del menú en vivo', () => {
  const menu = [{ nombre: 'General', ruta: null, hijos: [{ nombre: 'Panel', ruta: '/' }] }, { nombre: 'Ventas', ruta: null, hijos: [{ nombre: 'Nueva', ruta: '/ventas/nueva' }] }];

  test('mismoMenu: igual => true; cambió una opción => false; basura no truena', () => {
    assert.equal(mismoMenu(menu, JSON.parse(JSON.stringify(menu))), true);
    assert.equal(mismoMenu(menu, [menu[0]]), false);
    assert.equal(mismoMenu([], []), true);
    const circular = {}; circular.a = circular;
    assert.equal(mismoMenu(circular, menu), false);
  });

  test('si la pantalla sigue permitida: no se mueve a nadie', () => {
    assert.equal(destinoSiYaNoPermitida(menu, { menu: '/ventas/nueva' }, '/ventas/nueva'), null);
  });

  test('si Seguridad desactivó la opción de la pantalla actual: se lleva a la primera permitida', () => {
    const sinVentas = [menu[0]];
    assert.equal(destinoSiYaNoPermitida(sinVentas, { menu: '/ventas/nueva' }, '/ventas/nueva'), '/');
  });

  test('si no queda NINGUNA opción permitida: va al perfil (no depende del menú), sin bucle', () => {
    assert.equal(destinoSiYaNoPermitida([], { menu: '/ventas/nueva' }, '/ventas/nueva'), '/perfil');
  });

  test('si la primera permitida es justo donde está, no hay bucle: va al perfil', () => {
    assert.equal(destinoSiYaNoPermitida([menu[0]], { menu: '/ventas' }, '/'), '/perfil');
  });

  test('pantallas públicas, libres (perfil) o sin opción de menú nunca se mueven', () => {
    for (const meta of [{ publico: true }, { libre: true }, {}, undefined, null]) assert.equal(destinoSiYaNoPermitida([], meta, '/x'), null);
  });
});

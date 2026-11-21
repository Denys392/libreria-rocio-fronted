import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { guardarSesion, leerSesion, limpiarSesion, debeCerrarSesion, extraerCodigo } from '../src/utils/sesion.js';

function almacenFalso(inicial = {}) {
  const d = { ...inicial };
  return { d, getItem: (k) => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = String(v); }, removeItem: (k) => { delete d[k]; } };
}
const roto = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); }, removeItem() { throw new Error('bloqueado'); } };

const DATOS = {
  accessToken: 'tok',
  usuario: { id: 4, correo: 'julio.gallegos@libreriarocio.com', nombre: 'Julio Gallegos' },
  rol: { codigo: 'VENDEDOR', nombre: 'Vendedor' },
  aplicacion: { codigo: 'libreria', nombre: 'Librería' }
};

describe('sesión local', () => {
  test('guardar y leer devuelve lo mismo', () => {
    const s = almacenFalso();
    guardarSesion(s, DATOS);
    assert.deepEqual(leerSesion(s), DATOS);
  });

  test('sin nada guardado, la sesión está vacía', () => {
    assert.deepEqual(leerSesion(almacenFalso()), { accessToken: null, usuario: null, rol: null, aplicacion: null });
  });

  test('un valor corrupto en el storage no rompe la lectura', () => {
    const s = almacenFalso({ accessToken: 'tok', usuario: '{no es json', rol: 'basura', aplicacion: '' });
    const r = leerSesion(s);
    assert.equal(r.accessToken, 'tok');
    assert.equal(r.usuario, null);
    assert.equal(r.rol, null);
    assert.equal(r.aplicacion, null);
  });

  test('limpiar borra todo, incluido el refreshToken del login anterior', () => {
    const s = almacenFalso({ refreshToken: 'viejo' });
    guardarSesion(s, DATOS);
    limpiarSesion(s);
    assert.deepEqual(s.d, {});
  });

  test('un storage bloqueado no lanza errores en ninguna operación', () => {
    assert.doesNotThrow(() => guardarSesion(roto, DATOS));
    assert.doesNotThrow(() => limpiarSesion(roto));
    assert.equal(leerSesion(roto).accessToken, null);
  });
});

describe('cuándo cerrar la sesión (401)', () => {
  const error = (status, url) => ({ response: { status }, config: { url } });

  test('un 401 en una petición normal cierra la sesión', () => {
    assert.equal(debeCerrarSesion(error(401, '/ventas/historico')), true);
    assert.equal(debeCerrarSesion(error(401, '/auth/menu')), true);
  });

  test('un 401 al canjear el código NO cierra la sesión (lo maneja la pantalla de retorno)', () => {
    assert.equal(debeCerrarSesion(error(401, '/auth/canjear')), false);
  });

  test('un 401 en el logout NO cierra otra vez', () => {
    assert.equal(debeCerrarSesion(error(401, '/auth/logout')), false);
  });

  test('403 (sin permiso), 503 (central caído) y 500 NO sacan al usuario de su sesión', () => {
    for (const status of [400, 403, 404, 422, 500, 503]) {
      assert.equal(debeCerrarSesion(error(status, '/ventas/historico')), false, `status ${status}`);
    }
  });

  test('errores sin respuesta (red caída) o sin datos NO cierran la sesión', () => {
    assert.equal(debeCerrarSesion({ message: 'Network Error' }), false);
    assert.equal(debeCerrarSesion(undefined), false);
    assert.equal(debeCerrarSesion(null), false);
    assert.equal(debeCerrarSesion({ response: { status: 401 } }), true, 'sin url conocida se asume petición normal');
  });
});

describe('código de retorno del central', () => {
  test('lee el código de la URL', () => {
    assert.equal(extraerCodigo({ codigo: 'eyJ.abc.def' }), 'eyJ.abc.def');
  });
  test('ausente, vacío, repetido (arreglo) o gigante: null', () => {
    assert.equal(extraerCodigo({}), null);
    assert.equal(extraerCodigo({ codigo: '' }), null);
    assert.equal(extraerCodigo({ codigo: ['a', 'b'] }), null);
    assert.equal(extraerCodigo({ codigo: 'x'.repeat(2001) }), null);
    assert.equal(extraerCodigo(undefined), null);
  });
});

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizarCorreo, correoValido, problemaDeClave, validarFormulario, generarClave, agruparRolesPorApp
} from '../src/utils/usuarios.js';

const DOM = 'libreriarocio.com';
const BIEN = { nombre: 'Ana Pérez', correo: 'ana.perez@libreriarocio.com', password: 'Clave-Segura-2026', rolIds: [1] };

describe('correo corporativo', () => {
  test('acepta nombre@dominio, sin importar mayúsculas ni espacios', () => {
    assert.ok(correoValido('ana@libreriarocio.com', DOM));
    assert.ok(correoValido('  ANA.PEREZ@LibreriaRocio.COM ', DOM));
    assert.equal(normalizarCorreo('  A@B.com '), 'a@b.com');
  });

  test('rechaza otro dominio, subdominio, dominio engañoso, sin arroba, doble arroba o vacío', () => {
    for (const malo of ['ana@gmail.com', 'ana@x.libreriarocio.com', 'ana@libreriarocio.com.evil.com', 'ana', 'a@b@libreriarocio.com', '', null, undefined, '@libreriarocio.com', '.ana@libreriarocio.com']) {
      assert.equal(correoValido(malo, DOM), false, String(malo));
    }
  });

  test('rechaza espacios o símbolos raros en la parte local', () => {
    for (const malo of ['an a@libreriarocio.com', 'ana<script>@libreriarocio.com', "ana'@libreriarocio.com"]) {
      assert.equal(correoValido(malo, DOM), false, malo);
    }
  });
});

describe('política de clave (igual que el central)', () => {
  test('acepta una clave correcta', () => assert.equal(problemaDeClave('Clave-Segura-2026'), ''));

  test('rechaza corta, larga, sin número, sin letra, común y no-texto', () => {
    assert.match(problemaDeClave('Ab1'), /8 caracteres/);
    assert.match(problemaDeClave('a1'.repeat(40)), /72/);
    assert.match(problemaDeClave('SoloLetrasAqui'), /letras y números/);
    assert.match(problemaDeClave('1234567890'), /letras y números/);
    assert.match(problemaDeClave('Contraseña123'), /común/);
    assert.match(problemaDeClave('xxPASSWORDxx9'), /común/);
    assert.match(problemaDeClave(undefined), /8 caracteres/);
    assert.match(problemaDeClave(12345678), /8 caracteres/);
  });
});

describe('validarFormulario', () => {
  test('un formulario correcto no tiene errores', () => {
    const r = validarFormulario(BIEN, DOM);
    assert.equal(r.ok, true);
    assert.deepEqual(r.errores, {});
  });

  test('marca cada campo malo por separado', () => {
    const r = validarFormulario({ nombre: 'A', correo: 'x@gmail.com', password: '123', rolIds: [] }, DOM);
    assert.equal(r.ok, false);
    assert.deepEqual(Object.keys(r.errores).sort(), ['correo', 'nombre', 'password', 'roles']);
  });

  test('nombre: acepta tildes, apóstrofo y guion; rechaza números y etiquetas', () => {
    for (const bien of ['Ana María Pérez', "O'Connor", 'Jean-Luc Ñandú']) assert.equal(validarFormulario({ ...BIEN, nombre: bien }, DOM).ok, true, bien);
    for (const mal of ['Ana 2', '<b>Ana</b>', '', '   ', "1Ana"]) assert.ok(validarFormulario({ ...BIEN, nombre: mal }, DOM).errores.nombre, mal);
  });

  test('sin roles o roles no lista => error de roles', () => {
    assert.ok(validarFormulario({ ...BIEN, rolIds: [] }, DOM).errores.roles);
    assert.ok(validarFormulario({ ...BIEN, rolIds: null }, DOM).errores.roles);
  });
});

describe('generarClave', () => {
  test('siempre cumple la política: 16 caracteres con mayúscula, minúscula, número y símbolo', () => {
    for (let i = 0; i < 300; i++) {
      const c = generarClave();
      assert.equal(c.length, 16);
      assert.equal(problemaDeClave(c), '', c);
      assert.match(c, /[A-Z]/); assert.match(c, /[a-z]/); assert.match(c, /\d/); assert.match(c, /[-_.!]/);
    }
  });

  test('no usa caracteres que se confunden (I, O, l, 0, 1)', () => {
    for (let i = 0; i < 300; i++) assert.doesNotMatch(generarClave(), /[IOl01]/);
  });

  test('dos claves seguidas son distintas', () => {
    assert.notEqual(generarClave(), generarClave());
  });

  test('con un generador fijo es predecible (se puede probar) y respeta el largo pedido', () => {
    const fijo = () => 0;
    const c = generarClave(fijo, 10);
    assert.equal(c.length, 10);
    assert.equal(generarClave(fijo, 10), c);
  });
});

describe('agruparRolesPorApp', () => {
  test('agrupa por aplicación conservando el orden', () => {
    const roles = [
      { rolId: 1, rol: { codigo: 'A', nombre: 'A' }, aplicacion: { codigo: 'libreria', nombre: 'Librería' } },
      { rolId: 2, rol: { codigo: 'B', nombre: 'B' }, aplicacion: { codigo: 'almacen', nombre: 'Almacén' } },
      { rolId: 3, rol: { codigo: 'C', nombre: 'C' }, aplicacion: { codigo: 'libreria', nombre: 'Librería' } }
    ];
    const g = agruparRolesPorApp(roles);
    assert.deepEqual(g.map((x) => [x.app.codigo, x.roles.length]), [['libreria', 2], ['almacen', 1]]);
  });

  test('nada o vacío => lista vacía', () => {
    assert.deepEqual(agruparRolesPorApp(undefined), []);
    assert.deepEqual(agruparRolesPorApp([]), []);
  });
});

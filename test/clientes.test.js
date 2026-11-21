import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validarCliente, mensajeDocumento, formatoPuntos, textoRegla, validarMontoRegla } from '../src/utils/clientes.js';

const BIEN = { tipoDocumento: 'DNI', numeroDocumento: '45678912', razonSocial: 'Ana Pérez', telefono: '987 654 321', email: 'ana@correo.com', direccion: 'Av. Lima 123' };

describe('validarCliente', () => {
  test('un formulario correcto no tiene errores', () => {
    const r = validarCliente(BIEN);
    assert.deepEqual([r.ok, r.errores], [true, {}]);
  });

  test('solo nombre es obligatorio además del documento: teléfono, correo y dirección pueden ir vacíos', () => {
    assert.equal(validarCliente({ ...BIEN, telefono: '', email: undefined, direccion: '   ' }).ok, true);
  });

  test('documento: DNI de 8 dígitos, RUC de 11 con prefijo válido, CE y PAS alfanuméricos', () => {
    assert.equal(validarCliente({ ...BIEN, tipoDocumento: 'RUC', numeroDocumento: '20123456789' }).ok, true);
    assert.equal(validarCliente({ ...BIEN, tipoDocumento: 'CE', numeroDocumento: 'A12345678' }).ok, true);
    assert.equal(validarCliente({ ...BIEN, tipoDocumento: 'PAS', numeroDocumento: 'AB12345' }).ok, true);
    for (const [tipo, num] of [['DNI', '1234567'], ['DNI', '1234567a'], ['RUC', '30123456789'], ['RUC', '2012345678'], ['CE', '123'], ['PAS', 'x']]) {
      assert.ok(validarCliente({ ...BIEN, tipoDocumento: tipo, numeroDocumento: num }).errores.numeroDocumento, `${tipo} ${num}`);
    }
  });

  test('tipo de documento inventado o "constructor" se rechaza', () => {
    for (const t of ['', undefined, 'LICENCIA', 'constructor', '__proto__']) {
      assert.ok(validarCliente({ ...BIEN, tipoDocumento: t }).errores.tipoDocumento, String(t));
    }
  });

  test('nombre: vacío, de 1 letra, con etiquetas o larguísimo -> error', () => {
    for (const n of ['', ' ', 'A', '<b>x</b>', 'a'.repeat(151)]) assert.ok(validarCliente({ ...BIEN, razonSocial: n }).errores.razonSocial, n);
  });

  test('teléfono, correo y dirección malos se marcan', () => {
    assert.ok(validarCliente({ ...BIEN, telefono: 'llamar' }).errores.telefono);
    assert.ok(validarCliente({ ...BIEN, telefono: '123' }).errores.telefono);
    assert.ok(validarCliente({ ...BIEN, email: 'ana' }).errores.email);
    assert.ok(validarCliente({ ...BIEN, email: 'a na@x.com' }).errores.email);
    assert.ok(validarCliente({ ...BIEN, direccion: 'x'.repeat(201) }).errores.direccion);
  });

  test('al editar (soloContacto) no se exige ni valida el documento', () => {
    const r = validarCliente({ razonSocial: 'Ana Pérez' }, { soloContacto: true });
    assert.equal(r.ok, true);
    assert.ok(!validarCliente({ razonSocial: '' }, { soloContacto: true }).ok);
  });

  test('mensajes de documento claros por tipo', () => {
    assert.match(mensajeDocumento('DNI'), /8 dígitos/);
    assert.match(mensajeDocumento('RUC'), /11 dígitos/);
    assert.equal(mensajeDocumento('X'), 'Documento inválido.');
  });
});

describe('formatos de fidelización', () => {
  test('formatoPuntos: entero con separador; basura -> "—"', () => {
    assert.match(formatoPuntos(46), /46/);
    assert.match(formatoPuntos(12345.9), /12.?345/);
    for (const x of [undefined, null, 'abc', NaN, Infinity]) assert.equal(formatoPuntos(x), '—', String(x));
  });

  test('textoRegla', () => {
    assert.equal(textoRegla(10), '1 punto por cada S/ 10.00');
    assert.equal(textoRegla('2.5'), '1 punto por cada S/ 2.50');
    for (const x of [0, -1, 'x', null, undefined]) assert.equal(textoRegla(x), '—', String(x));
  });

  test('validarMontoRegla: acepta números con hasta 2 decimales (también con coma)', () => {
    assert.deepEqual(validarMontoRegla('10'), { ok: true, valor: 10 });
    assert.deepEqual(validarMontoRegla(' 2,5 '), { ok: true, valor: 2.5 });
    assert.deepEqual(validarMontoRegla('0.50'), { ok: true, valor: 0.5 });
    assert.deepEqual(validarMontoRegla(10000), { ok: true, valor: 10000 });
  });

  test('validarMontoRegla: rechaza vacío, texto, negativos, 3 decimales y fuera de rango', () => {
    for (const x of ['', ' ', 'abc', '-5', '1.234', '0.1', '10001', '1e3', '5 soles', null, undefined, '--1', '1.']) {
      assert.equal(validarMontoRegla(x).ok, false, String(x));
    }
  });
});

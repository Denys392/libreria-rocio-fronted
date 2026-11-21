import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mysqlADate, formatoFechaMysql, formatoSegundos, ETIQUETAS_EVENTO } from '../src/utils/fechas.js';
import { mensajeDeError } from '../src/utils/errores.js';

describe('fechas del central (MySQL entrega UTC sin zona)', () => {
  test('"2026-11-19 19:49:09.123" se interpreta como UTC, no como hora local', () => {
    const d = mysqlADate('2026-11-19 19:49:09.123');
    assert.equal(d.toISOString(), '2026-11-19T19:49:09.123Z');
  });

  test('acepta con o sin milisegundos y con "T"', () => {
    assert.equal(mysqlADate('2026-11-19 19:49:09').toISOString(), '2026-11-19T19:49:09.000Z');
    assert.equal(mysqlADate('2026-11-19T19:49:09').toISOString(), '2026-11-19T19:49:09.000Z');
  });

  test('una fecha ISO que ya trae zona no se corre', () => {
    assert.equal(mysqlADate('2026-11-19T19:49:09.000Z').toISOString(), '2026-11-19T19:49:09.000Z');
  });

  test('vacío o basura => null (no truena)', () => {
    for (const malo of [null, undefined, '', 'ayer', '2026-13-45 99:99:99']) assert.equal(mysqlADate(malo), null, String(malo));
  });

  test('formatoFechaMysql: vacío => "—"; basura => el mismo texto', () => {
    assert.equal(formatoFechaMysql(null), '—');
    assert.equal(formatoFechaMysql(''), '—');
    assert.equal(formatoFechaMysql('ayer'), 'ayer');
    assert.match(formatoFechaMysql('2026-11-19 19:49:09'), /2026/);
  });

  test('formatoSegundos', () => {
    assert.equal(formatoSegundos(8), '8s');
    assert.equal(formatoSegundos(94), '1m 34s');
    assert.equal(formatoSegundos(7500), '2h 5m');
    assert.equal(formatoSegundos(0), '0s');
    for (const nada of [null, undefined, '', -3, 'x']) assert.equal(formatoSegundos(nada), '—', String(nada));
  });

  test('hay etiqueta para los 15 eventos del central, incluidos los de accesos y los de menús', () => {
    assert.equal(Object.keys(ETIQUETAS_EVENTO).length, 15);
    assert.ok(ETIQUETAS_EVENTO.ACCESO_ACTIVADO && ETIQUETAS_EVENTO.ACCESO_DESACTIVADO);
    for (const e of ['MENU_CREADO', 'MENU_MODIFICADO', 'MENU_ACTIVADO', 'MENU_DESACTIVADO']) assert.ok(ETIQUETAS_EVENTO[e], e);
  });
});

describe('mensajeDeError', () => {
  test('sin respuesta del servidor => mensaje de conexión', () => {
    assert.match(mensajeDeError(new Error('Network Error')), /No se pudo conectar/);
    assert.match(mensajeDeError(null), /No se pudo conectar/);
  });

  test('usa el mensaje del servidor cuando existe', () => {
    const err = { response: { status: 409, data: { message: 'No puede quitarse a sí mismo el acceso a Seguridad.' } } };
    assert.equal(mensajeDeError(err), 'No puede quitarse a sí mismo el acceso a Seguridad.');
  });

  test('403 sin mensaje => aviso de permisos; 429 => demasiados intentos', () => {
    assert.match(mensajeDeError({ response: { status: 403, data: {} } }), /permisos/);
    assert.match(mensajeDeError({ response: { status: 429, data: {} } }), /Demasiados/);
  });

  test('sin mensaje del servidor usa el texto por defecto', () => {
    assert.equal(mensajeDeError({ response: { status: 500, data: null } }, 'Falló'), 'Falló');
  });

  test('un mensaje que no es texto no se muestra', () => {
    assert.equal(mensajeDeError({ response: { status: 400, data: { message: { x: 1 } } } }, 'Falló'), 'Falló');
  });
});

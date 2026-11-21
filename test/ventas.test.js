import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { etiquetaEstadoAlmacen, claseEstadoAlmacen, avisoTrasRegistrar, mensajeReintentoFallido } from '../src/utils/ventas.js';

describe('estado del stock de la venta (Almacén)', () => {
  test('etiquetas y colores de cada estado', () => {
    assert.equal(etiquetaEstadoAlmacen('CONFIRMADO'), 'Descontado en Almacén');
    assert.equal(etiquetaEstadoAlmacen('PENDIENTE'), 'Pendiente de descontar');
    assert.equal(claseEstadoAlmacen('CONFIRMADO'), 'badge-ok');
    assert.equal(claseEstadoAlmacen('PENDIENTE'), 'badge-warn');
  });

  test('un estado desconocido o ausente no rompe nada (la fila simplemente no se muestra)', () => {
    for (const raro of [undefined, null, '', 'OTRO']) {
      assert.equal(etiquetaEstadoAlmacen(raro), '');
      assert.equal(claseEstadoAlmacen(raro), 'badge-off');
    }
  });

  test('tras registrar con el stock descontado: aviso de éxito', () => {
    const a = avisoTrasRegistrar({ estado_almacen: 'CONFIRMADO' });
    assert.equal(a.tipo, 'success');
    assert.match(a.texto, /Stock actualizado/);
  });

  test('tras registrar con el stock PENDIENTE: NO dice que el stock se actualizó, avisa y dura más', () => {
    const a = avisoTrasRegistrar({ estado_almacen: 'PENDIENTE' });
    assert.equal(a.tipo, 'info');
    assert.ok(!/Stock actualizado/.test(a.texto));
    assert.match(a.texto, /Almacén no confirmó/);
    assert.ok(a.duracion > 3800);
  });

  test('sin el dato (integración apagada / respuesta rara) se comporta como antes', () => {
    for (const v of [undefined, null, {}]) assert.equal(avisoTrasRegistrar(v).tipo, 'success');
  });

  test('mensaje del reintento fallido: usa el del servidor o uno por defecto', () => {
    assert.equal(mensajeReintentoFallido({ response: { data: { message: 'Almacén no está disponible.' } } }), 'Almacén no está disponible.');
    for (const raro of [undefined, new Error('x'), { response: { data: {} } }, { response: { data: { message: { a: 1 } } } }]) {
      assert.match(mensajeReintentoFallido(raro), /No se pudo confirmar el stock/);
    }
  });
});

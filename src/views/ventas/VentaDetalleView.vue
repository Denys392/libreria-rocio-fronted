<template>
  <div v-if="venta" class="form-layout">
    <RouterLink to="/ventas" class="back-link">← Volver al histórico</RouterLink>

    <section class="card" style="padding: 1.4rem 1.6rem; margin-top: .8rem;">
      <header class="detalle-head">
        <div>
          <p class="eyebrow">Venta #{{ venta.venta_id }}</p>
          <h2>{{ venta.tipo_comprobante }}-{{ venta.serie }}-{{ venta.numero }}</h2>
        </div>
        <span class="total-chip">{{ formatoMoneda(venta.total, venta.moneda) }}</span>
      </header>

      <dl class="dl">
        <dt>Cliente</dt><dd>{{ venta.cliente_nombre || 'Cliente varios' }}</dd>
        <dt>Fecha de emisión</dt><dd>{{ formatoFecha(venta.fecha_emision) }}</dd>
        <dt>Vendedor</dt><dd>{{ venta.usuario_nombre }}</dd>
        <dt>Forma de pago</dt><dd>{{ venta.forma_pago }}</dd>
        <dt>Estado SUNAT</dt>
        <dd>
          <span class="badge" :class="estadoBadge(venta.estado_sunat)">{{ venta.estado_sunat }}</span>
        </dd>
        <dt>IGV</dt><dd>{{ formatoMoneda(venta.igv, venta.moneda) }}</dd>
      </dl>

      <div class="doc-actions">
        <button class="btn btn-ghost btn-sm" @click="descargarPdf" :disabled="descargando.pdf">
          {{ descargando.pdf ? 'Descargando…' : '⬇ Descargar PDF' }}
        </button>
        <button class="btn btn-ghost btn-sm" @click="descargarXml" :disabled="descargando.xml">
          {{ descargando.xml ? 'Descargando…' : '⬇ Descargar XML' }}
        </button>
        <button
          v-if="venta.document_id"
          class="btn btn-primary btn-sm"
          @click="sincronizar"
          :disabled="sincronizando">
          {{ sincronizando ? '⏳ Sincronizando…' : '🔄 Sincronizar SUNAT' }}
        </button>
        <p class="doc-hint">Los documentos solo se pueden descargar estando autenticado.</p>
        <p v-if="['PENDIENTE', 'ERROR'].includes(venta.estado_sunat)" class="doc-hint">
          ℹ️ El sistema se sincroniza automáticamente cada 5 minutos. También puedes hacerlo manualmente.
        </p>
      </div>
    </section>

    <section class="card" style="margin-top: 1rem;">
      <h3 style="padding: 1.1rem 1.3rem .2rem;">Ítems</h3>
      <table>
        <thead><tr><th>Producto</th><th>Cantidad</th><th>P. unit. (c/IGV)</th><th>Subtotal</th><th>IGV</th></tr></thead>
        <tbody>
          <tr v-for="d in venta.detalle" :key="d.detalle_venta_id">
            <td>{{ d.producto_nombre }}</td>
            <td>{{ d.cantidad }}</td>
            <td>{{ formatoMoneda(d.precio_unitario_con_igv, venta.moneda) }}</td>
            <td>{{ formatoMoneda(d.subtotal, venta.moneda) }}</td>
            <td>{{ formatoMoneda(d.igv, venta.moneda) }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ventasApi } from '../../api/ventas';
import { documentosApi } from '../../api/documentos';
import { useNotificationStore } from '../../store/notifications';
import { formatoMoneda, formatoFecha } from '../../utils/format';

const route = useRoute();
const notify = useNotificationStore();
const venta = ref(null);
const descargando = reactive({ pdf: false, xml: false });
const sincronizando = ref(false);

function estadoBadge(estado) {
  return { ACEPTADO: 'badge-ok', PENDIENTE: 'badge-warn', RECHAZADO: 'badge-danger', ANULADO: 'badge-off', ERROR: 'badge-danger' }[estado] || 'badge-off';
}

async function cargar() {
  try {
    const { data } = await ventasApi.obtener(route.params.id);
    venta.value = data.data;
  } catch { notify.error('No se pudo cargar la venta'); }
}

async function sincronizar() {
  sincronizando.value = true;
  try {
    const { data } = await ventasApi.sincronizarSunat(route.params.id);
    venta.value = data.data;
    const estadoNuevo = venta.value.estado_sunat;
    notify.success(`Estado actualizado: ${estadoNuevo}`);
  } catch (err) {
    notify.error(err.response?.data?.message || 'Error al sincronizar con SUNAT');
  } finally {
    sincronizando.value = false;
  }
}

async function descargarPdf() {
  descargando.pdf = true;
  try {
    await documentosApi.descargarPdfVenta(venta.value.venta_id, venta.value.file_name);
  } catch (err) {
    notify.error(err.mensajeLegible || 'No se pudo descargar el PDF de esta venta');
  } finally { descargando.pdf = false; }
}

async function descargarXml() {
  descargando.xml = true;
  try {
    await documentosApi.descargarXmlVenta(venta.value.venta_id, venta.value.file_name);
  } catch (err) {
    notify.error(err.mensajeLegible || 'No se pudo descargar el XML de esta venta');
  } finally { descargando.xml = false; }
}

onMounted(cargar);
</script>

<style scoped>
.form-layout { max-width: 900px; }
.back-link { font-size: .85rem; color: var(--color-forest); text-decoration: none; font-weight: 600; }
.back-link:hover { text-decoration: underline; }
.detalle-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
.eyebrow { margin: 0; font-size: .74rem; text-transform: uppercase; letter-spacing: .05em; color: var(--color-ink-soft); font-weight: 700; }
.total-chip { background: var(--color-gold-soft); color: #4A3306; padding: .4rem .9rem; border-radius: 999px; font-weight: 700; font-family: var(--font-mono); }
.dl { display: grid; grid-template-columns: 160px 1fr; gap: .55rem 1rem; margin: 0 0 1rem; }
.dl dt { color: var(--color-ink-soft); font-size: .82rem; font-weight: 600; }
.dl dd { margin: 0; }
.doc-actions { display: flex; align-items: center; gap: .6rem; padding-top: 1rem; border-top: 1px solid var(--color-border); flex-wrap: wrap; }
.doc-hint { margin: 0; font-size: .78rem; color: var(--color-ink-soft); }
</style>

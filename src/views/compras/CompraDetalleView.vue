<template>
  <div v-if="compra" class="form-layout">
    <RouterLink to="/compras" class="back-link">← Volver al histórico</RouterLink>

    <section class="card" style="padding: 1.4rem 1.6rem; margin-top: .8rem;">
      <header class="detalle-head">
        <div>
          <p class="eyebrow">Compra #{{ compra.compra_id }}</p>
          <h2>{{ compra.tipo_comprobante }}-{{ compra.serie_comprobante }}-{{ compra.numero_comprobante }}</h2>
        </div>
        <span class="total-chip">{{ formatoMoneda(compra.total, compra.moneda) }}</span>
      </header>

      <dl class="dl">
        <dt>Proveedor</dt><dd>{{ compra.proveedor_nombre }}</dd>
        <dt>Fecha de emisión</dt><dd>{{ formatoFecha(compra.fecha_emision) }}</dd>
        <dt>Registrado por</dt><dd>{{ compra.usuario_nombre }}</dd>
        <dt>Op. gravada</dt><dd>{{ formatoMoneda(compra.op_gravada, compra.moneda) }}</dd>
        <dt>IGV</dt><dd>{{ formatoMoneda(compra.igv, compra.moneda) }}</dd>
        <dt>Observaciones</dt><dd>{{ compra.observaciones || '—' }}</dd>
      </dl>
    </section>

    <section class="card" style="margin-top: 1rem;">
      <h3 style="padding: 1.1rem 1.3rem .2rem;">Ítems</h3>
      <table>
        <thead><tr><th>Producto</th><th>SKU</th><th>Cantidad</th><th>Costo unit.</th><th>Subtotal</th></tr></thead>
        <tbody>
          <tr v-for="d in compra.detalle" :key="d.detalle_compra_id">
            <td>{{ d.producto_nombre }}</td>
            <td class="mono">{{ d.codigo_sku || '—' }}</td>
            <td>{{ d.cantidad }}</td>
            <td>{{ formatoMoneda(d.precio_costo_unitario, compra.moneda) }}</td>
            <td>{{ formatoMoneda(d.subtotal, compra.moneda) }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { comprasApi } from '../../api/compras';
import { useNotificationStore } from '../../store/notifications';
import { formatoMoneda, formatoFecha } from '../../utils/format';

const route = useRoute();
const notify = useNotificationStore();
const compra = ref(null);

onMounted(async () => {
  try {
    const { data } = await comprasApi.obtener(route.params.id);
    compra.value = data.data;
  } catch { notify.error('No se pudo cargar la compra'); }
});
</script>

<style scoped>
.form-layout { max-width: 860px; }
.back-link { font-size: .85rem; color: var(--color-forest); text-decoration: none; font-weight: 600; }
.back-link:hover { text-decoration: underline; }
.detalle-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
.eyebrow { margin: 0; font-size: .74rem; text-transform: uppercase; letter-spacing: .05em; color: var(--color-ink-soft); font-weight: 700; }
.total-chip { background: var(--color-gold-soft); color: #4A3306; padding: .4rem .9rem; border-radius: 999px; font-weight: 700; font-family: var(--font-mono); }
.dl { display: grid; grid-template-columns: 160px 1fr; gap: .55rem 1rem; margin: 0; }
.dl dt { color: var(--color-ink-soft); font-size: .82rem; font-weight: 600; }
.dl dd { margin: 0; }
.mono { font-family: var(--font-mono); font-size: .82rem; }
</style>

<template>
  <div>
    <div class="toolbar card">
      <select v-model="filtros.estadoSunat" @change="cargar">
        <option value="">Todos los estados SUNAT</option>
        <option value="PENDIENTE">Pendiente</option>
        <option value="ACEPTADO">Aceptado</option>
        <option value="RECHAZADO">Rechazado</option>
        <option value="ANULADO">Anulado</option>
      </select>
      <input v-model="filtros.desde" type="date" @change="cargar" />
      <input v-model="filtros.hasta" type="date" @change="cargar" />
      <div class="spacer"></div>
      <RouterLink class="btn btn-gold" to="/ventas/nueva">+ Registrar venta</RouterLink>
    </div>

    <div class="summary-bar card" v-if="!cargando">
      <div><span class="s-label">Ventas encontradas</span><span class="s-value">{{ total }}</span></div>
      <div><span class="s-label">Monto total</span><span class="s-value">{{ formatoMoneda(sumaTotal) }}</span></div>
    </div>

    <section class="card">
      <table>
        <thead><tr><th>Comprobante</th><th>Cliente</th><th>Fecha</th><th>Vendedor</th><th>Estado SUNAT</th><th>Total</th><th></th></tr></thead>
        <tbody v-if="cargando"><tr v-for="n in 6" :key="n" class="skeleton-row"><td colspan="7"><div class="skeleton-bar"></div></td></tr></tbody>
        <tbody v-else-if="ventas.length">
          <tr v-for="v in ventas" :key="v.venta_id">
            <td class="mono">{{ v.tipo_comprobante }}-{{ v.serie }}-{{ v.numero }}</td>
            <td>{{ v.cliente_nombre || 'Cliente varios' }}</td>
            <td>{{ formatoFecha(v.fecha_emision) }}</td>
            <td>{{ v.usuario_nombre }}</td>
            <td><span class="badge" :class="estadoBadge(v.estado_sunat)">{{ v.estado_sunat }}</span></td>
            <td>{{ formatoMoneda(v.total, v.moneda) }}</td>
            <td style="text-align:right;"><RouterLink class="btn btn-ghost btn-sm" :to="`/ventas/${v.venta_id}`">Ver detalle</RouterLink></td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-if="!cargando && ventas.length === 0" titulo="Sin ventas en este rango" descripcion="Ajusta los filtros o registra una nueva venta." />
      <PaginationBar v-model:page="filtros.page" :limit="filtros.limit" :total="total" @update:page="cargar" />
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { ventasApi } from '../../api/ventas';
import { useNotificationStore } from '../../store/notifications';
import { formatoMoneda, formatoFecha } from '../../utils/format';
import PaginationBar from '../../components/PaginationBar.vue';
import EmptyState from '../../components/EmptyState.vue';

const notify = useNotificationStore();
const ventas = ref([]);
const total = ref(0);
const sumaTotal = ref(0);
const cargando = ref(true);
const filtros = reactive({ page: 1, limit: 10, estadoSunat: '', desde: '', hasta: '' });

function estadoBadge(estado) {
  return { ACEPTADO: 'badge-ok', PENDIENTE: 'badge-warn', RECHAZADO: 'badge-danger', ANULADO: 'badge-off' }[estado] || 'badge-off';
}

async function cargar() {
  cargando.value = true;
  try {
    const { data } = await ventasApi.historico(filtros);
    ventas.value = data.data.rows;
    total.value = data.data.total;
    sumaTotal.value = data.data.sumaTotal;
  } catch { notify.error('No se pudo cargar el histórico de ventas'); }
  finally { cargando.value = false; }
}

onMounted(cargar);
</script>

<style scoped>
.toolbar { display: flex; align-items: center; gap: .7rem; padding: .9rem 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
.toolbar select, .toolbar input { padding: .55rem .7rem; border: 1px solid var(--color-border-strong); border-radius: var(--radius-sm); background: var(--color-surface-raised); }
.spacer { flex: 1; }
.mono { font-family: var(--font-mono); font-size: .82rem; }
.summary-bar { display: flex; gap: 2.2rem; padding: 1rem 1.3rem; margin-bottom: 1rem; }
.s-label { display: block; font-size: .74rem; text-transform: uppercase; letter-spacing: .04em; color: var(--color-ink-soft); font-weight: 600; }
.s-value { display: block; font-family: var(--font-display); font-size: 1.35rem; color: var(--color-forest-deep); }
</style>

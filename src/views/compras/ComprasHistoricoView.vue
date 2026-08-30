<template>
  <div>
    <div class="toolbar card">
      <select v-model="filtros.proveedorId" @change="cargar">
        <option value="">Todos los proveedores</option>
        <option v-for="p in proveedores" :key="p.persona_id" :value="p.persona_id">{{ p.razon_social }}</option>
      </select>
      <input v-model="filtros.desde" type="date" @change="cargar" />
      <input v-model="filtros.hasta" type="date" @change="cargar" />
      <div class="spacer"></div>
      <RouterLink class="btn btn-gold" to="/compras/nueva">+ Registrar compra</RouterLink>
    </div>

    <div class="summary-bar card" v-if="!cargando">
      <div><span class="s-label">Compras encontradas</span><span class="s-value">{{ total }}</span></div>
      <div><span class="s-label">Monto total</span><span class="s-value">{{ formatoMoneda(sumaTotal) }}</span></div>
    </div>

    <section class="card">
      <table>
        <thead><tr><th>Comprobante</th><th>Proveedor</th><th>Fecha</th><th>Registrado por</th><th>Total</th><th></th></tr></thead>
        <tbody v-if="cargando"><tr v-for="n in 6" :key="n" class="skeleton-row"><td colspan="6"><div class="skeleton-bar"></div></td></tr></tbody>
        <tbody v-else-if="compras.length">
          <tr v-for="c in compras" :key="c.compra_id">
            <td class="mono">{{ c.tipo_comprobante }}-{{ c.serie_comprobante }}-{{ c.numero_comprobante }}</td>
            <td>{{ c.proveedor_nombre }}</td>
            <td>{{ formatoFecha(c.fecha_emision) }}</td>
            <td>{{ c.usuario_nombre }}</td>
            <td>{{ formatoMoneda(c.total, c.moneda) }}</td>
            <td style="text-align:right;"><RouterLink class="btn btn-ghost btn-sm" :to="`/compras/${c.compra_id}`">Ver detalle</RouterLink></td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-if="!cargando && compras.length === 0" titulo="Sin compras en este rango" descripcion="Ajusta los filtros o registra una nueva compra." />
      <PaginationBar v-model:page="filtros.page" :limit="filtros.limit" :total="total" @update:page="cargar" />
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { comprasApi } from '../../api/compras';
import { proveedoresApi } from '../../api/proveedores';
import { useNotificationStore } from '../../store/notifications';
import { formatoMoneda, formatoFecha } from '../../utils/format';
import PaginationBar from '../../components/PaginationBar.vue';
import EmptyState from '../../components/EmptyState.vue';

const notify = useNotificationStore();
const compras = ref([]);
const proveedores = ref([]);
const total = ref(0);
const sumaTotal = ref(0);
const cargando = ref(true);
const filtros = reactive({ page: 1, limit: 10, proveedorId: '', desde: '', hasta: '' });

async function cargar() {
  cargando.value = true;
  try {
    const { data } = await comprasApi.historico(filtros);
    compras.value = data.data.rows;
    total.value = data.data.total;
    sumaTotal.value = data.data.sumaTotal;
  } catch { notify.error('No se pudo cargar el histórico de compras'); }
  finally { cargando.value = false; }
}

async function cargarProveedores() {
  const { data } = await proveedoresApi.listar({ tipoPersona: 'PROVEEDOR', limit: 100 });
  proveedores.value = data.data.rows;
}

onMounted(() => { cargar(); cargarProveedores(); });
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

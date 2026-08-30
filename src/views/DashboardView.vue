<template>
  <div>
    <section class="hero card">
      <div>
        <p class="hero-eyebrow">Hoy</p>
        <h1>Hola, {{ primerNombre }} 👋</h1>
        <p class="hero-sub">Este es el resumen de la actividad reciente de la librería.</p>
      </div>
    </section>

    <div class="kpi-grid">
      <div class="kpi card">
        <p class="kpi-label">Ventas registradas</p>
        <p class="kpi-value">{{ cargando ? '—' : ventasTotal }}</p>
        <p class="kpi-foot">Total histórico: {{ formatoMoneda(ventasSuma) }}</p>
      </div>
      <div class="kpi card">
        <p class="kpi-label">Compras registradas</p>
        <p class="kpi-value">{{ cargando ? '—' : comprasTotal }}</p>
        <p class="kpi-foot">Total histórico: {{ formatoMoneda(comprasSuma) }}</p>
      </div>
      <div class="kpi card">
        <p class="kpi-label">Accesos rápidos</p>
        <div class="quick-links">
          <RouterLink class="btn btn-gold btn-sm" to="/ventas/nueva">+ Nueva venta</RouterLink>
          <RouterLink class="btn btn-ghost btn-sm" to="/compras/nueva">+ Nueva compra</RouterLink>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <section class="card table-card">
        <header class="table-card-head">
          <h3>Últimas ventas</h3>
          <RouterLink to="/ventas" class="see-all">Ver todas →</RouterLink>
        </header>
        <table>
          <thead><tr><th>Comprobante</th><th>Cliente</th><th>Fecha</th><th>Total</th></tr></thead>
          <tbody>
            <tr v-for="v in ultimasVentas" :key="v.venta_id">
              <td>{{ v.tipo_comprobante }}-{{ v.serie }}-{{ v.numero }}</td>
              <td>{{ v.cliente_nombre || 'Cliente varios' }}</td>
              <td>{{ formatoFecha(v.fecha_emision) }}</td>
              <td>{{ formatoMoneda(v.total, v.moneda) }}</td>
            </tr>
            <tr v-if="!cargando && ultimasVentas.length === 0"><td colspan="4" style="text-align:center; color: var(--color-ink-soft);">Sin ventas registradas todavía</td></tr>
          </tbody>
        </table>
      </section>

      <section class="card table-card">
        <header class="table-card-head">
          <h3>Últimas compras</h3>
          <RouterLink to="/compras" class="see-all">Ver todas →</RouterLink>
        </header>
        <table>
          <thead><tr><th>Comprobante</th><th>Proveedor</th><th>Fecha</th><th>Total</th></tr></thead>
          <tbody>
            <tr v-for="c in ultimasCompras" :key="c.compra_id">
              <td>{{ c.tipo_comprobante }}-{{ c.serie_comprobante }}-{{ c.numero_comprobante }}</td>
              <td>{{ c.proveedor_nombre }}</td>
              <td>{{ formatoFecha(c.fecha_emision) }}</td>
              <td>{{ formatoMoneda(c.total, c.moneda) }}</td>
            </tr>
            <tr v-if="!cargando && ultimasCompras.length === 0"><td colspan="4" style="text-align:center; color: var(--color-ink-soft);">Sin compras registradas todavía</td></tr>
          </tbody>
        </table>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useAuthStore } from '../store/auth';
import { ventasApi } from '../api/ventas';
import { comprasApi } from '../api/compras';
import { formatoMoneda, formatoFecha } from '../utils/format';

const auth = useAuthStore();
const primerNombre = computed(() => (auth.usuario?.nombre || '').split(' ')[0]);

const cargando = ref(true);
const ultimasVentas = ref([]);
const ultimasCompras = ref([]);
const ventasTotal = ref(0);
const ventasSuma = ref(0);
const comprasTotal = ref(0);
const comprasSuma = ref(0);

onMounted(async () => {
  try {
    const [resVentas, resCompras] = await Promise.all([
      ventasApi.historico({ page: 1, limit: 5 }),
      comprasApi.historico({ page: 1, limit: 5 })
    ]);
    ultimasVentas.value = resVentas.data.data.rows;
    ventasTotal.value = resVentas.data.data.total;
    ventasSuma.value = resVentas.data.data.sumaTotal;

    ultimasCompras.value = resCompras.data.data.rows;
    comprasTotal.value = resCompras.data.data.total;
    comprasSuma.value = resCompras.data.data.sumaTotal;
  } finally {
    cargando.value = false;
  }
});
</script>

<style scoped>
.hero { padding: 1.8rem 2rem; margin-bottom: 1.4rem; display: flex; justify-content: space-between; align-items: center; }
.hero-eyebrow { text-transform: uppercase; letter-spacing: .08em; font-size: .72rem; color: var(--color-gold); font-weight: 700; margin: 0 0 .3rem; }
.hero h1 { font-size: 1.7rem; margin-bottom: .25rem; }
.hero-sub { margin: 0; color: var(--color-ink-soft); }

.kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.4rem; }
.kpi { padding: 1.3rem 1.4rem; }
.kpi-label { margin: 0 0 .4rem; font-size: .78rem; text-transform: uppercase; letter-spacing: .04em; color: var(--color-ink-soft); font-weight: 600; }
.kpi-value { font-family: var(--font-display); font-size: 2rem; margin: 0; color: var(--color-forest-deep); }
.kpi-foot { margin: .3rem 0 0; font-size: .78rem; color: var(--color-ink-soft); }
.quick-links { display: flex; flex-direction: column; gap: .5rem; margin-top: .3rem; }

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem; }
.table-card-head { display: flex; align-items: center; justify-content: space-between; padding: 1.1rem 1.2rem .3rem; }
.see-all { font-size: .82rem; color: var(--color-forest); font-weight: 600; text-decoration: none; }
.see-all:hover { text-decoration: underline; }

@media (max-width: 980px) { .kpi-grid, .grid-2 { grid-template-columns: 1fr; } }
</style>

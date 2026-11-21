<template>
  <div>
    <div class="card seg-toolbar">
      <label>Cliente
        <select v-model="clienteId" :disabled="cargandoClientes" @change="elegir">
          <option value="">Elija un cliente…</option>
          <option v-for="c in lista" :key="c.clienteId" :value="String(c.clienteId)">{{ c.nombre }} — {{ c.tipoDocumento }} {{ c.numeroDocumento }}</option>
        </select>
      </label>
    </div>

    <p v-if="error" class="seg-error" role="alert">{{ error }}</p>
    <EmptyState v-if="!clienteId && !error" titulo="Elija un cliente" descripcion="Verá sus compras (tal como están en la Librería) y sus puntos." />

    <template v-if="clienteId && resumen">
      <section class="tarjetas">
        <article class="card tarjeta"><p class="num">{{ formatoPuntos(resumen.puntos) }}</p><p class="tit">Puntos</p></article>
        <article class="card tarjeta"><p class="num">{{ resumen.compras }}</p><p class="tit">Compras</p></article>
        <article class="card tarjeta"><p class="num">{{ formatoMoneda(resumen.totalGastado) }}</p><p class="tit">Total gastado</p></article>
        <article class="card tarjeta"><p class="num peq">{{ textoRegla(resumen.montoPorPunto) }}</p><p class="tit">Regla vigente</p></article>
      </section>

      <section class="card seg-tabla">
        <table>
          <thead><tr><th>Comprobante</th><th>Fecha</th><th>Total</th><th>Estado SUNAT</th></tr></thead>
          <tbody v-if="cargandoVentas"><tr v-for="n in 4" :key="n" class="skeleton-row"><td colspan="4"><div class="skeleton-bar"></div></td></tr></tbody>
          <tbody v-else-if="ventas.length">
            <tr v-for="v in ventas" :key="v.ventaId">
              <td class="seg-mono">{{ v.comprobante }} <span class="seg-small">({{ v.tipoComprobante === '01' ? 'Factura' : v.tipoComprobante === '03' ? 'Boleta' : 'Nota de crédito' }})</span></td>
              <td class="seg-small">{{ formatoFecha(v.fechaEmision) }}</td>
              <td>{{ formatoMoneda(v.total, v.moneda) }}</td>
              <td><span class="badge" :class="v.estadoSunat === 'ACEPTADO' ? 'badge-ok' : ['RECHAZADO', 'ANULADO'].includes(v.estadoSunat) ? 'badge-danger' : 'seg-badge-aviso'">{{ v.estadoSunat || '—' }}</span></td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-if="!cargandoVentas && ventas.length === 0" titulo="Sin compras" descripcion="Este cliente todavía no tiene compras en la Librería." />
        <PaginationBar :page="pagina" :limit="limite" :total="total" @update:page="cargarVentas" />
      </section>
      <p class="pie">Los puntos cuentan facturas y boletas en soles que SUNAT no rechazó ni anuló; las notas de crédito restan.</p>
    </template>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { clientesApi } from '../../api/clientes';
import { formatoPuntos, textoRegla } from '../../utils/clientes';
import { formatoMoneda, formatoFecha } from '../../utils/format';
import { mensajeDeError } from '../../utils/errores';
import PaginationBar from '../../components/PaginationBar.vue';
import EmptyState from '../../components/EmptyState.vue';
import '../seguridad/seguridad.css';

const route = useRoute();
const router = useRouter();
const lista = ref([]);
const cargandoClientes = ref(true);
const clienteId = ref('');
const resumen = ref(null);
const ventas = ref([]);
const total = ref(0);
const pagina = ref(1);
const limite = 10;
const cargandoVentas = ref(false);
const error = ref('');

async function cargarVentas(p = 1) {
  pagina.value = p;
  cargandoVentas.value = true;
  try {
    const { data } = await clientesApi.ventas(clienteId.value, { page: p, limit: limite });
    ventas.value = data.data.ventas;
    total.value = data.data.total;
  } catch (err) {
    ventas.value = []; total.value = 0;
    error.value = mensajeDeError(err, 'No se pudieron cargar las compras.');
  } finally { cargandoVentas.value = false; }
}

async function elegir() {
  error.value = '';
  resumen.value = null; ventas.value = []; total.value = 0;
  router.replace({ query: clienteId.value ? { cliente: clienteId.value } : {} });
  if (!clienteId.value) return;
  try {
    const { data } = await clientesApi.puntos(clienteId.value);
    resumen.value = data.data;
    await cargarVentas(1);
  } catch (err) {
    error.value = mensajeDeError(err, 'No se pudo cargar el cliente.');
  }
}

onMounted(async () => {
  try {
    const { data } = await clientesApi.listar({ limit: 100, estado: 1 });
    lista.value = data.data.clientes;
  } catch (err) {
    error.value = mensajeDeError(err, 'No se pudo cargar la lista de clientes.');
  } finally { cargandoClientes.value = false; }
  // Si llega desde otra pantalla con ?cliente=ID, se abre directo
  const q = route.query.cliente;
  if (typeof q === 'string' && /^\d{1,9}$/.test(q)) { clienteId.value = q; await elegir(); }
});
</script>

<style scoped>
.tarjetas { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
.tarjeta { padding: 1.1rem 1.2rem; }
.num { margin: 0; font-family: var(--font-display); font-size: 1.9rem; color: var(--color-forest-deep); }
.num.peq { font-size: 1.05rem; padding: .55rem 0; }
.tit { margin: .2rem 0 0; font-size: .82rem; color: var(--color-ink-soft); }
.pie { font-size: .8rem; color: var(--color-ink-soft); margin: .8rem 0 0; }
</style>

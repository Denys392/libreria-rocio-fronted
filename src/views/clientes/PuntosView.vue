<template>
  <div>
    <div class="card seg-toolbar">
      <label>Buscar <input v-model.trim="filtros.busqueda" type="search" placeholder="Nombre o documento" @keyup.enter="cargar(1)" @change="cargar(1)" /></label>
      <div class="seg-spacer"></div>
      <span v-if="montoPorPunto" class="regla">{{ textoRegla(montoPorPunto) }}</span>
      <RouterLink class="btn btn-ghost btn-sm" to="/fidelizacion/reglas">Cambiar regla</RouterLink>
    </div>

    <p v-if="error" class="seg-error" role="alert">{{ error }}</p>

    <section class="card seg-tabla">
      <table>
        <thead><tr><th>#</th><th>Cliente</th><th>Documento</th><th>Compras</th><th>Total gastado</th><th>Última compra</th><th class="der">Puntos</th><th></th></tr></thead>
        <tbody v-if="cargando"><tr v-for="n in 6" :key="n" class="skeleton-row"><td colspan="8"><div class="skeleton-bar"></div></td></tr></tbody>
        <tbody v-else-if="clientes.length">
          <tr v-for="(c, i) in clientes" :key="c.clienteId">
            <td class="seg-small">{{ (filtros.page - 1) * filtros.limit + i + 1 }}</td>
            <td><strong>{{ c.nombre }}</strong></td>
            <td class="seg-mono">{{ c.documento }}</td>
            <td>{{ c.compras }}</td>
            <td>{{ formatoMoneda(c.totalGastado) }}</td>
            <td class="seg-small">{{ c.ultimaCompra ? formatoFecha(c.ultimaCompra) : '—' }}</td>
            <td class="der"><span class="puntos">{{ formatoPuntos(c.puntos) }}</span></td>
            <td><RouterLink class="btn btn-ghost btn-sm" :to="{ path: '/clientes/ventas', query: { cliente: c.clienteId } }">Ver compras</RouterLink></td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-if="!cargando && !error && clientes.length === 0" titulo="Sin clientes" descripcion="No hay clientes que coincidan con la búsqueda." />
      <PaginationBar :page="filtros.page" :limit="filtros.limit" :total="total" @update:page="cargar" />
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { fidelizacionApi } from '../../api/clientes';
import { formatoPuntos, textoRegla } from '../../utils/clientes';
import { formatoMoneda, formatoFecha } from '../../utils/format';
import { mensajeDeError } from '../../utils/errores';
import PaginationBar from '../../components/PaginationBar.vue';
import EmptyState from '../../components/EmptyState.vue';
import '../seguridad/seguridad.css';

const clientes = ref([]);
const total = ref(0);
const montoPorPunto = ref(null);
const cargando = ref(true);
const error = ref('');
const filtros = reactive({ page: 1, limit: 15, busqueda: '' });

async function cargar(pagina) {
  if (typeof pagina === 'number') filtros.page = pagina;
  cargando.value = true;
  error.value = '';
  try {
    const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== ''));
    const { data } = await fidelizacionApi.ranking(params);
    clientes.value = data.data.clientes;
    total.value = data.data.total;
    montoPorPunto.value = data.data.montoPorPunto;
  } catch (err) {
    clientes.value = []; total.value = 0;
    error.value = mensajeDeError(err, 'No se pudieron cargar los puntos.');
  } finally { cargando.value = false; }
}

onMounted(() => cargar());
</script>

<style scoped>
.regla { font-size: .88rem; color: var(--color-ink-soft); }
.der { text-align: right; }
.puntos { font-family: var(--font-display); font-size: 1.15rem; font-weight: 600; color: var(--color-forest-deep); }
</style>

<template>
  <div>
    <div class="toolbar card">
      <input v-model="filtros.desde" type="date" @change="cargar" />
      <input v-model="filtros.hasta" type="date" @change="cargar" />
      <div class="spacer"></div>
      <button class="btn btn-ghost btn-sm" @click="cargar">Actualizar</button>
    </div>

    <section class="card">
      <table>
        <thead><tr><th>API / Ruta</th><th>Método</th><th>Usuario</th><th>Éxito</th><th>Inicio</th><th>Fin</th></tr></thead>
        <tbody v-if="cargando"><tr v-for="n in 8" :key="n" class="skeleton-row"><td colspan="6"><div class="skeleton-bar"></div></td></tr></tbody>
        <tbody v-else-if="registros.length">
          <tr v-for="r in registros" :key="r.AuditKeyApi">
            <td class="mono" style="max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ r.URL }}</td>
            <td><span class="badge badge-ok">{{ r.http_method }}</span></td>
            <td>{{ r.usuario_nombre || 'Anónimo' }}</td>
            <td><span class="badge" :class="r.SuccessfulProcessingInd === 'S' ? 'badge-ok' : 'badge-danger'">{{ r.SuccessfulProcessingInd === 'S' ? 'Sí' : 'No' }}</span></td>
            <td>{{ formatoFechaHora(r.ApiStartDT) }}</td>
            <td>{{ formatoFechaHora(r.ApiStopDT) }}</td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-if="!cargando && registros.length === 0" titulo="Sin registros de auditoría" descripcion="Aún no hay actividad registrada en este rango." />
      <PaginationBar v-model:page="filtros.page" :limit="filtros.limit" :total="total" @update:page="cargar" />
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { auditoriaApi } from '../../api/auditoria';
import { useNotificationStore } from '../../store/notifications';
import { formatoFechaHora } from '../../utils/format';
import PaginationBar from '../../components/PaginationBar.vue';
import EmptyState from '../../components/EmptyState.vue';

const notify = useNotificationStore();
const registros = ref([]);
const total = ref(0);
const cargando = ref(true);
const filtros = reactive({ page: 1, limit: 15, desde: '', hasta: '' });

async function cargar() {
  cargando.value = true;
  try {
    const { data } = await auditoriaApi.listar(filtros);
    registros.value = data.data.rows;
    total.value = data.data.total;
  } catch { notify.error('No se pudo cargar la auditoría'); }
  finally { cargando.value = false; }
}

onMounted(cargar);
</script>

<style scoped>
.toolbar { display: flex; align-items: center; gap: .7rem; padding: .9rem 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
.toolbar input { padding: .55rem .7rem; border: 1px solid var(--color-border-strong); border-radius: var(--radius-sm); background: var(--color-surface-raised); }
.spacer { flex: 1; }
.mono { font-family: var(--font-mono); font-size: .78rem; }
</style>

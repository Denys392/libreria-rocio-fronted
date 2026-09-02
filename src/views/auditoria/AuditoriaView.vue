<template>
  <div>
    <div class="toolbar card">
      <input v-model="filtros.desde" type="date" @change="cargar" />
      <input v-model="filtros.hasta" type="date" @change="cargar" />
      <div class="spacer"></div>
      <button class="btn btn-ghost btn-sm" @click="cargar">Actualizar</button>
    </div>

    <section class="card table-wrapper">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Comprobante</th>
            <th>Entidad</th>
            <th>Usuario</th>
            <th>Estado</th>
            <th>Procesado</th>
            <th>Inicio</th>
            <th>Fin</th>
            <th>Demora</th>
            <th>Error</th>
            <th>API / Ruta</th>
          </tr>
        </thead>
        <tbody v-if="cargando"><tr v-for="n in 8" :key="n" class="skeleton-row"><td colspan="11"><div class="skeleton-bar"></div></td></tr></tbody>
        <tbody v-else-if="registros.length">
          <tr v-for="r in registros" :key="r.audit_key_api">
            <td class="mono small">{{ r.audit_key_api }}</td>
            <td class="comprobante">{{ r.numero_comprobante || (r.related_entity_id ? '#' + r.related_entity_id : 'N/A') }}</td>
            <td><span class="badge badge-entity">/{{ r.related_entity?.toUpperCase() || 'N/A' }}</span></td>
            <td>{{ r.usuario_nombre || 'Anónimo' }}</td>
            <td>
              <span class="badge" :class="estadoBadge(r)">{{ estadoTexto(r) }}</span>
            </td>
            <td>
              <span v-if="r.api_stop_dt" class="badge" :class="r.successful_processing_ind === 'S' ? 'badge-ok' : 'badge-warning'">
                {{ r.successful_processing_ind === 'S' ? 'SÍ' : 'NO' }}
              </span>
              <span v-else>—</span>
            </td>
            <td class="small">{{ formatoFechaHora(r.api_start_dt) }}</td>
            <td class="small">{{ formatoFechaHora(r.api_stop_dt) }}</td>
            <td class="small mono">{{ formatoDuracion(r.api_start_dt, r.api_stop_dt) }}</td>
            <td class="error-cell" :title="r.error_message">{{ r.error_message || '—' }}</td>
            <td class="mono url-cell" :title="r.url">{{ r.url }}</td>
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
import { formatoFechaHora, formatoDuracion } from '../../utils/format';
import PaginationBar from '../../components/PaginationBar.vue';
import EmptyState from '../../components/EmptyState.vue';

const notify = useNotificationStore();
const registros = ref([]);
const total = ref(0);
const cargando = ref(true);
const filtros = reactive({ page: 1, limit: 15, desde: '', hasta: '' });

// Un registro sin api_stop_dt es un comprobante enviado que aún espera veredicto de SUNAT.
function estadoTexto(r) {
  if (!r.api_stop_dt) return 'EN PROCESO';
  return r.status_category === 'EXITO' ? 'EXITO' : 'ERROR';
}
function estadoBadge(r) {
  if (!r.api_stop_dt) return 'badge-warning';
  return r.status_category === 'EXITO' ? 'badge-ok' : 'badge-danger';
}

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
.small { font-size: .8rem; }

/* Tabla scrollable horizontalmente */
.table-wrapper {
  overflow-x: auto;
  padding: 0;
}

table {
  width: 100%;
  font-size: .9rem;
}

th {
  background: var(--color-surface-dimmed);
  font-weight: 600;
  padding: .75rem .6rem;
  text-align: left;
  white-space: nowrap;
}

td {
  padding: .65rem .6rem;
  border-bottom: 1px solid var(--color-border);
}

tbody tr:hover {
  background: var(--color-surface-raised);
}

.url-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.error-cell {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-danger);
  font-size: .8rem;
}

.comprobante {
  font-weight: 600;
  color: var(--color-info);
}

.badge-entity {
  background: var(--color-info-bg);
  color: var(--color-info);
  font-weight: 500;
}

.badge-ok {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.badge-danger {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.badge-warning {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}
</style>

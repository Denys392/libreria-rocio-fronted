<template>
  <div>
    <!-- Cada pestaña lee de su propia tabla de auditoría:
         SUNAT -> dim_audit_api, Scraping -> scraping_auditoria,
         Integraciones -> integraciones_auditoria -->
    <div class="tabs card">
      <button v-for="t in TABS" :key="t.id" class="tab" :class="{ active: tab === t.id }" @click="cambiarTab(t.id)">
        {{ t.label }}
      </button>
    </div>

    <div class="toolbar card">
      <template v-if="tab === 'sunat'">
        <input v-model="filtros.desde" type="date" @change="cargar(1)" />
        <input v-model="filtros.hasta" type="date" @change="cargar(1)" />
      </template>
      <div class="spacer"></div>
      <button class="btn btn-ghost btn-sm" @click="cargar()">Actualizar</button>
    </div>

    <!-- ===== Pestaña: Scraping ===== -->
    <section v-if="tab === 'scraping'" class="card table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Inicio</th>
            <th>Evento</th>
            <th>Job / Fuente</th>
            <th>Usuario</th>
            <th>Productos</th>
            <th>Resultado</th>
            <th>Demora</th>
            <th>Error</th>
            <th>URL</th>
          </tr>
        </thead>
        <tbody v-if="cargando"><tr v-for="n in 8" :key="n" class="skeleton-row"><td colspan="9"><div class="skeleton-bar"></div></td></tr></tbody>
        <tbody v-else-if="registros.length">
          <tr v-for="r in registros" :key="r.auditoria_id">
            <td class="small">{{ formatoFechaHora(r.fecha_inicio) }}</td>
            <td><span class="badge badge-entity">{{ ETIQUETAS_SCRAPING[r.tipo_evento] || r.tipo_evento }}</span></td>
            <td class="mono">
              <span v-if="r.ejecucion_id">Job #{{ r.ejecucion_id }}</span>
              <span v-if="r.fuente_nombre"> · {{ r.fuente_nombre }}</span>
              <span v-if="!r.ejecucion_id && !r.fuente_nombre">—</span>
            </td>
            <td>{{ r.usuario_nombre || '—' }}</td>
            <td class="small">
              <span v-if="r.total_productos != null">{{ r.total_productos }} leídos<span v-if="r.total_comparados != null"> · {{ r.total_comparados }} coincidencias</span></span>
              <span v-else>—</span>
            </td>
            <td><span class="badge" :class="r.estado === 'EXITO' ? 'badge-ok' : (r.estado === 'ERROR' ? 'badge-danger' : 'badge-warning')">{{ r.estado }}</span></td>
            <td class="small mono">{{ r.fecha_fin ? formatoDuracion(r.fecha_inicio, r.fecha_fin) : '—' }}</td>
            <td class="error-cell" :title="r.mensaje_error">{{ r.mensaje_error || '—' }}</td>
            <td class="mono url-cell" :title="r.url">{{ r.url || '—' }}</td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-if="!cargando && registros.length === 0" titulo="Sin auditoría de scraping" descripcion="Aún no se ha ejecutado ningún scraping ni sincronización de API externa." />
      <PaginationBar :page="filtros.page" :limit="filtros.limit" :total="total" @update:page="cargar" />
    </section>

    <!-- ===== Pestaña: Integraciones ===== -->
    <section v-else-if="tab === 'integraciones'" class="card table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Integración</th>
            <th>Endpoint</th>
            <th>Método</th>
            <th>Resultado</th>
            <th>Error</th>
            <th>IP origen</th>
          </tr>
        </thead>
        <tbody v-if="cargando"><tr v-for="n in 8" :key="n" class="skeleton-row"><td colspan="7"><div class="skeleton-bar"></div></td></tr></tbody>
        <tbody v-else-if="registros.length">
          <tr v-for="r in registros" :key="r.auditoria_id">
            <td class="small">{{ formatoFechaHora(r.fecha) }}</td>
            <td>{{ r.nombre_cliente || 'Desconocida' }}</td>
            <td class="mono url-cell" :title="r.endpoint">{{ r.endpoint }}</td>
            <td>{{ r.metodo }}</td>
            <td><span class="badge" :class="r.estado === 'EXITO' ? 'badge-ok' : 'badge-danger'">{{ r.codigo_http || '' }} {{ r.estado }}</span></td>
            <td class="error-cell" :title="r.mensaje_error">{{ r.mensaje_error || '—' }}</td>
            <td class="mono small">{{ r.ip_origen || '—' }}</td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-if="!cargando && registros.length === 0" titulo="Sin actividad de integraciones" descripcion="Aquí aparecerá cada llamada que otra página haga a tu API pública." />
      <PaginationBar :page="filtros.page" :limit="filtros.limit" :total="total" @update:page="cargar" />
    </section>

    <!-- ===== Pestaña: SUNAT (ventas/compras) ===== -->
    <section v-else class="card table-wrapper">
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
      <PaginationBar :page="filtros.page" :limit="filtros.limit" :total="total" @update:page="cargar" />
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { auditoriaApi } from '../../api/auditoria';
import { getAuditoriaScraping } from '../../api/scraping';
import { integracionesApi } from '../../api/integraciones';
import { useNotificationStore } from '../../store/notifications';
import { formatoFechaHora, formatoDuracion } from '../../utils/format';
import PaginationBar from '../../components/PaginationBar.vue';
import EmptyState from '../../components/EmptyState.vue';

const notify = useNotificationStore();
const registros = ref([]);
const total = ref(0);
const cargando = ref(true);
const filtros = reactive({ page: 1, limit: 15, desde: '', hasta: '' });

const TABS = [
  { id: 'sunat', label: 'Ventas / Compras (SUNAT)' },
  { id: 'scraping', label: 'Scraping y APIs externas' },
  { id: 'integraciones', label: 'Integraciones (API pública)' },
];
const ETIQUETAS_SCRAPING = {
  DISPARO_PYTHON: 'Disparo de scraping',
  WEBHOOK_PYTHON: 'Scraping finalizado',
  API_EXTERNA: 'Sincronización API externa',
};
const tab = ref('sunat');

function cambiarTab(id) {
  if (tab.value === id) return;
  tab.value = id;
  registros.value = [];
  total.value = 0;
  cargar(1);
}

// Un registro sin api_stop_dt es un comprobante enviado que aún espera veredicto de SUNAT.
function estadoTexto(r) {
  if (!r.api_stop_dt) return 'EN PROCESO';
  return r.status_category === 'EXITO' ? 'EXITO' : 'ERROR';
}
function estadoBadge(r) {
  if (!r.api_stop_dt) return 'badge-warning';
  return r.status_category === 'EXITO' ? 'badge-ok' : 'badge-danger';
}

async function cargar(pagina) {
  if (typeof pagina === 'number') filtros.page = pagina;
  cargando.value = true;
  try {
    let resp;
    if (tab.value === 'scraping') {
      resp = await getAuditoriaScraping({ page: filtros.page, limit: filtros.limit });
    } else if (tab.value === 'integraciones') {
      resp = await integracionesApi.listarAuditoria({ page: filtros.page, limit: filtros.limit });
    } else {
      resp = await auditoriaApi.listar(filtros);
    }
    registros.value = resp.data.data.rows;
    total.value = resp.data.data.total;
  } catch { notify.error('No se pudo cargar la auditoría'); }
  finally { cargando.value = false; }
}

onMounted(() => cargar());
</script>

<style scoped>
.tabs { display: flex; gap: .4rem; padding: .5rem; margin-bottom: 1rem; flex-wrap: wrap; }
.tab { border: none; background: transparent; padding: .55rem 1rem; border-radius: var(--radius-sm); cursor: pointer; font-weight: 600; font-size: .88rem; color: var(--color-ink-soft); }
.tab:hover { background: rgba(37,61,44,0.06); }
.tab.active { background: var(--color-forest); color: #F6F1E1; }
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

<template>
  <div>
    <div class="toolbar card">
      <div>
        <h2 style="margin: 0;">API pública</h2>
        <p class="subt">Credenciales (API Key / API Secret) para que otras páginas o apps consuman el catálogo
          público.</p>
      </div>
      <div class="spacer"></div>
      <button class="btn btn-gold" @click="abrirCrear">+ Nueva integración</button>
    </div>

    <section class="card">
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>API Key</th>
            <th>API Secret</th>
            <th>Scopes</th>
            <th>Estado</th>
            <th>Último uso</th>
            <th></th>
          </tr>
        </thead>
        <tbody v-if="cargando">
          <tr v-for="n in 4" :key="n" class="skeleton-row">
            <td colspan="7">
              <div class="skeleton-bar"></div>
            </td>
          </tr>
        </tbody>
        <tbody v-else-if="integraciones.length">
          <tr v-for="c in integraciones" :key="c.api_client_id">
            <td>{{ c.nombre_cliente }}</td>
            <td>
              <div class="mono key-cell">
                <span>{{ c.api_key }}</span>
                <button class="btn-copy" title="Copiar API Key" @click="copiar(c.api_key)">⧉</button>
              </div>
            </td>
            <td>
              <div v-if="c.api_secret" class="mono key-cell">
                <span>{{ visibles[c.api_client_id] ? c.api_secret : '•'.repeat(16) }}</span>
                <button class="btn-copy" title="Mostrar/ocultar" @click="alternarVisible(c.api_client_id)">{{
                  visibles[c.api_client_id] ? '🙈' : '👁' }}</button>
                <button class="btn-copy" title="Copiar API Secret" @click="copiar(c.api_secret)">⧉</button>
              </div>
              <div v-else class="sin-secreto">
                <span>No disponible</span>
                <button class="btn btn-ghost btn-sm" @click="regenerarSecreto(c)">Regenerar</button>
              </div>
            </td>
            <td>
              <span class="badge badge-off" v-for="s in c.scopes.split(',')" :key="s" style="margin-right:.3rem;">{{
                s }}</span>
            </td>
            <td><span class="badge" :class="c.estado ? 'badge-ok' : 'badge-danger'">{{ c.estado ? 'Activa' :
              'Revocada' }}</span></td>
            <td>{{ c.ultimo_uso ? formatoFechaHora(c.ultimo_uso) : 'Nunca' }}</td>
            <td style="text-align:right; white-space: nowrap;">
              <button v-if="c.estado" class="btn btn-danger btn-sm" @click="revocar(c)">Revocar</button>
              <button v-else class="btn btn-ghost btn-sm" @click="reactivar(c)">Reactivar</button>
            </td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-if="!cargando && integraciones.length === 0" titulo="Sin integraciones"
        descripcion="Crea una integración para generar un API Key y API Secret." />
    </section>

    <!-- Modal: crear nueva integración -->
    <ModalDialog v-model="modalAbierto" title="Nueva integración">
      <form id="form-integracion" @submit.prevent="guardar">
        <div class="field">
          <label>Nombre del cliente</label>
          <input v-model.trim="form.nombreCliente" placeholder="Ej. Página web principal" required />
        </div>
        <div class="field">
          <label>Scopes (permisos)</label>
          <div class="scopes-box">
            <label class="chk-inline">
              <input type="checkbox" value="productos:read" v-model="form.scopes" />
              productos:read
            </label>
            <label class="chk-inline">
              <input type="checkbox" value="descuentos:read" v-model="form.scopes" />
              descuentos:read
            </label>
          </div>
          <p class="hint">Si no seleccionas ninguno, se usarán ambos por defecto.</p>
        </div>
      </form>
      <template #footer>
        <button class="btn btn-ghost" @click="modalAbierto = false">Cancelar</button>
        <button class="btn btn-primary" form="form-integracion" type="submit" :disabled="guardando">
          {{ guardando ? 'Creando…' : 'Crear integración' }}
        </button>
      </template>
    </ModalDialog>

    <!-- Modal: mostrar credenciales creadas (única vez) -->
    <ModalDialog v-model="modalCredencialesAbierto" title="Integración creada" width="560px">
      <p class="hint" style="margin-top: 0;">
        Guarda el <strong>API Secret</strong> ahora: por seguridad no se volverá a mostrar.
      </p>
      <div class="field">
        <label>API Key</label>
        <div class="mono key-cell key-cell-modal">
          <span>{{ credencialesNuevas?.api_key }}</span>
          <button class="btn-copy" title="Copiar" @click="copiar(credencialesNuevas?.api_key)">⧉</button>
        </div>
      </div>
      <div class="field">
        <label>API Secret</label>
        <div class="mono key-cell key-cell-modal">
          <span>{{ credencialesNuevas?.api_secret }}</span>
          <button class="btn-copy" title="Copiar" @click="copiar(credencialesNuevas?.api_secret)">⧉</button>
        </div>
      </div>
      <template #footer>
        <button class="btn btn-primary" @click="cerrarCredenciales">Entendido, ya lo guardé</button>
      </template>
    </ModalDialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { integracionesApi } from '../../api/integraciones';
import { useNotificationStore } from '../../store/notifications';
import { formatoFechaHora } from '../../utils/format';
import ModalDialog from '../../components/ModalDialog.vue';
import EmptyState from '../../components/EmptyState.vue';

const notify = useNotificationStore();
const integraciones = ref([]);
const cargando = ref(true);
const guardando = ref(false);
const modalAbierto = ref(false);
const modalCredencialesAbierto = ref(false);
const credencialesNuevas = ref(null);
const visibles = reactive({});

const form = reactive({ nombreCliente: '', scopes: [] });

async function cargar() {
  cargando.value = true;
  try {
    const { data } = await integracionesApi.listar();
    integraciones.value = data.data;
  } catch {
    notify.error('No se pudieron cargar las integraciones');
  } finally {
    cargando.value = false;
  }
}

function abrirCrear() {
  Object.assign(form, { nombreCliente: '', scopes: [] });
  modalAbierto.value = true;
}

async function guardar() {
  guardando.value = true;
  try {
    const { data } = await integracionesApi.crear({
      nombreCliente: form.nombreCliente,
      scopes: form.scopes
    });
    modalAbierto.value = false;
    credencialesNuevas.value = data.data;
    modalCredencialesAbierto.value = true;
    notify.success('Integración creada correctamente');
    cargar();
  } catch (err) {
    notify.error(err.response?.data?.message || 'No se pudo crear la integración');
  } finally {
    guardando.value = false;
  }
}

function cerrarCredenciales() {
  modalCredencialesAbierto.value = false;
  credencialesNuevas.value = null;
}

async function revocar(c) {
  if (!confirm(`¿Revocar la integración "${c.nombre_cliente}"? Dejará de poder generar tokens.`)) return;
  try {
    await integracionesApi.revocar(c.api_client_id);
    notify.success('Integración revocada');
    cargar();
  } catch (err) {
    notify.error(err.response?.data?.message || 'No se pudo revocar');
  }
}

async function reactivar(c) {
  try {
    await integracionesApi.reactivar(c.api_client_id);
    notify.success('Integración reactivada');
    cargar();
  } catch (err) {
    notify.error(err.response?.data?.message || 'No se pudo reactivar');
  }
}

function alternarVisible(id) {
  visibles[id] = !visibles[id];
}

async function regenerarSecreto(c) {
  if (!confirm(`¿Regenerar el API Secret de "${c.nombre_cliente}"? El secreto anterior dejará de funcionar de inmediato.`)) return;
  try {
    const { data } = await integracionesApi.regenerarSecreto(c.api_client_id);
    credencialesNuevas.value = data.data;
    modalCredencialesAbierto.value = true;
    notify.success('Nuevo API Secret generado');
    cargar();
  } catch (err) {
    notify.error(err.response?.data?.message || 'No se pudo regenerar el secreto');
  }
}

async function copiar(texto) {
  if (!texto) return;
  try {
    await navigator.clipboard.writeText(texto);
    notify.success('Copiado al portapapeles');
  } catch {
    notify.error('No se pudo copiar');
  }
}

onMounted(cargar);
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.2rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.subt {
  margin: .2rem 0 0;
  font-size: .82rem;
  color: var(--color-ink-soft);
}

.spacer {
  flex: 1;
}

.mono {
  font-family: var(--font-mono);
  font-size: .82rem;
}

.key-cell {
  display: flex;
  align-items: center;
  gap: .4rem;
  max-width: 240px;
  overflow: hidden;
}

.key-cell span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.key-cell-modal {
  max-width: 100%;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: .5rem .7rem;
}

.btn-copy {
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-forest);
  font-size: 1rem;
  flex-shrink: 0;
}

.sin-secreto {
  display: flex;
  align-items: center;
  gap: .5rem;
  font-size: .8rem;
  color: var(--color-ink-soft);
  white-space: nowrap;
}

.scopes-box {
  display: flex;
  flex-direction: column;
  gap: .4rem;
}

.chk-inline {
  display: flex;
  align-items: center;
  gap: .5rem;
  font-size: .88rem;
  font-weight: 500;
}

.hint {
  font-size: .78rem;
  color: var(--color-ink-soft);
  margin: .3rem 0 0;
}
</style>

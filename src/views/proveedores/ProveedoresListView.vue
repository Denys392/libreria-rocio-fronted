<template>
  <div>
    <div class="toolbar card">
      <input v-model="filtros.busqueda" class="search-input" placeholder="Buscar por razón social o documento…" @keyup.enter="cargar" />
      <select v-model="filtros.tipoPersona" @change="cargar">
        <option value="">Proveedores y clientes</option>
        <option value="PROVEEDOR">Solo proveedores</option>
        <option value="CLIENTE">Solo clientes</option>
        <option value="AMBOS">Ambos</option>
      </select>
      <div class="spacer"></div>
      <button class="btn btn-gold" @click="abrirCrear">+ Nuevo registro</button>
    </div>

    <section class="card">
      <table>
        <thead><tr><th>Tipo</th><th>Documento</th><th>Razón social</th><th>Teléfono</th><th>Email</th><th>Estado</th><th></th></tr></thead>
        <tbody v-if="cargando"><tr v-for="n in 5" :key="n" class="skeleton-row"><td colspan="7"><div class="skeleton-bar"></div></td></tr></tbody>
        <tbody v-else-if="personas.length">
          <tr v-for="p in personas" :key="p.persona_id">
            <td><span class="badge badge-ok">{{ p.tipo_persona }}</span></td>
            <td class="mono">{{ p.tipo_documento }} {{ p.numero_documento }}</td>
            <td>{{ p.razon_social }}</td>
            <td>{{ p.telefono || '—' }}</td>
            <td>{{ p.email || '—' }}</td>
            <td><span class="badge" :class="p.estado ? 'badge-ok' : 'badge-off'">{{ p.estado ? 'Activo' : 'Inactivo' }}</span></td>
            <td style="text-align:right;">
              <button class="btn btn-ghost btn-sm" @click="abrirEditar(p)">Editar</button>
              <button v-if="p.estado" class="btn btn-danger btn-sm" @click="desactivar(p)">Desactivar</button>
            </td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-if="!cargando && personas.length === 0" titulo="No hay registros" descripcion="Agrega tu primer proveedor o cliente." />
      <PaginationBar v-model:page="filtros.page" :limit="filtros.limit" :total="total" @update:page="cargar" />
    </section>

    <ModalDialog v-model="modalAbierto" :title="editando ? 'Editar registro' : 'Nuevo proveedor / cliente'" width="620px">
      <form id="form-persona" @submit.prevent="guardar" class="form-grid">
        <div class="field"><label>Tipo</label>
          <select v-model="form.tipoPersona" required>
            <option value="PROVEEDOR">Proveedor</option>
            <option value="CLIENTE">Cliente</option>
            <option value="AMBOS">Ambos</option>
          </select>
        </div>
        <div class="field"><label>Tipo de documento</label>
          <select v-model="form.tipoDocumento" required>
            <option value="DNI">DNI</option>
            <option value="RUC">RUC</option>
            <option value="CE">Carné de extranjería</option>
            <option value="PAS">Pasaporte</option>
          </select>
        </div>
        <div class="field"><label>Número de documento</label><input v-model.trim="form.numeroDocumento" required /></div>
        <div class="field"><label>Razón social / Nombre</label><input v-model.trim="form.razonSocial" required /></div>
        <div class="field"><label>Teléfono</label><input v-model.trim="form.telefono" /></div>
        <div class="field"><label>Email</label><input v-model.trim="form.email" type="email" /></div>
        <div class="field" style="grid-column: span 2;"><label>Dirección</label><input v-model.trim="form.direccion" /></div>
        <div class="field" v-if="editando"><label>Estado</label>
          <select v-model="form.estado"><option :value="1">Activo</option><option :value="0">Inactivo</option></select>
        </div>
      </form>
      <template #footer>
        <button class="btn btn-ghost" @click="modalAbierto = false">Cancelar</button>
        <button class="btn btn-primary" form="form-persona" type="submit" :disabled="guardando">{{ guardando ? 'Guardando…' : 'Guardar' }}</button>
      </template>
    </ModalDialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { proveedoresApi } from '../../api/proveedores';
import { useNotificationStore } from '../../store/notifications';
import ModalDialog from '../../components/ModalDialog.vue';
import PaginationBar from '../../components/PaginationBar.vue';
import EmptyState from '../../components/EmptyState.vue';

const notify = useNotificationStore();
const personas = ref([]);
const total = ref(0);
const cargando = ref(true);
const guardando = ref(false);
const modalAbierto = ref(false);
const editando = ref(null);

const filtros = reactive({ page: 1, limit: 10, tipoPersona: '', busqueda: '' });
const formInicial = () => ({ tipoPersona: 'CLIENTE', tipoDocumento: 'DNI', numeroDocumento: '', razonSocial: '', telefono: '', email: '', direccion: '', estado: 1 });
const form = reactive(formInicial());

async function cargar() {
  cargando.value = true;
  try { const { data } = await proveedoresApi.listar(filtros); personas.value = data.data.rows; total.value = data.data.total; }
  catch { notify.error('No se pudieron cargar los registros'); }
  finally { cargando.value = false; }
}

function abrirCrear() { editando.value = null; Object.assign(form, formInicial()); modalAbierto.value = true; }
function abrirEditar(p) {
  editando.value = p;
  Object.assign(form, {
    tipoPersona: p.tipo_persona, tipoDocumento: p.tipo_documento, numeroDocumento: p.numero_documento,
    razonSocial: p.razon_social, telefono: p.telefono || '', email: p.email || '', direccion: p.direccion || '', estado: p.estado
  });
  modalAbierto.value = true;
}

async function guardar() {
  guardando.value = true;
  try {
    if (editando.value) { await proveedoresApi.actualizar(editando.value.persona_id, form); notify.success('Registro actualizado correctamente'); }
    else { await proveedoresApi.crear(form); notify.success('Registro creado correctamente'); }
    modalAbierto.value = false;
    cargar();
  } catch (err) { notify.error(err.response?.data?.message || 'No se pudo guardar el registro'); }
  finally { guardando.value = false; }
}

async function desactivar(p) {
  if (!confirm(`¿Desactivar "${p.razon_social}"?`)) return;
  try { await proveedoresApi.eliminar(p.persona_id); notify.success('Registro desactivado'); cargar(); }
  catch (err) { notify.error(err.response?.data?.message || 'No se pudo desactivar'); }
}

onMounted(cargar);
</script>

<style scoped>
.toolbar { display: flex; align-items: center; gap: .7rem; padding: .9rem 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
.search-input { padding: .55rem .8rem; border: 1px solid var(--color-border-strong); border-radius: var(--radius-sm); min-width: 260px; background: var(--color-surface-raised); }
.toolbar select { padding: .55rem .7rem; border: 1px solid var(--color-border-strong); border-radius: var(--radius-sm); background: var(--color-surface-raised); }
.spacer { flex: 1; }
.mono { font-family: var(--font-mono); font-size: .82rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
</style>

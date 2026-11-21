<template>
  <div>
    <div class="card seg-toolbar">
      <label>Buscar <input v-model.trim="filtros.busqueda" type="search" placeholder="Nombre o documento" @keyup.enter="cargar(1)" @change="cargar(1)" /></label>
      <label>Estado
        <select v-model="filtros.estado" @change="cargar(1)">
          <option value="1">Activos</option>
          <option value="0">Inactivos</option>
          <option value="">Todos</option>
        </select>
      </label>
      <div class="seg-spacer"></div>
      <RouterLink class="btn btn-primary btn-sm" to="/clientes/nuevo">+ Nuevo cliente</RouterLink>
    </div>

    <p v-if="error" class="seg-error" role="alert">{{ error }}</p>

    <section class="card seg-tabla">
      <table>
        <thead><tr><th>Nombre</th><th>Documento</th><th>Teléfono</th><th>Correo</th><th>Estado</th><th></th></tr></thead>
        <tbody v-if="cargando"><tr v-for="n in 6" :key="n" class="skeleton-row"><td colspan="6"><div class="skeleton-bar"></div></td></tr></tbody>
        <tbody v-else-if="clientes.length">
          <tr v-for="c in clientes" :key="c.clienteId">
            <td><strong>{{ c.nombre }}</strong></td>
            <td class="seg-mono">{{ c.tipoDocumento }} {{ c.numeroDocumento }}</td>
            <td>{{ c.telefono || '—' }}</td>
            <td>{{ c.email || '—' }}</td>
            <td><span class="badge" :class="c.activo ? 'badge-ok' : 'badge-danger'">{{ c.activo ? 'Activo' : 'Inactivo' }}</span></td>
            <td class="acciones">
              <RouterLink class="btn btn-ghost btn-sm" :to="{ path: '/clientes/ventas', query: { cliente: c.clienteId } }">Compras y puntos</RouterLink>
              <button class="btn btn-ghost btn-sm" type="button" @click="editar(c)">Editar</button>
            </td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-if="!cargando && !error && clientes.length === 0" titulo="Sin clientes" descripcion="No hay clientes que coincidan con la búsqueda." />
      <PaginationBar :page="filtros.page" :limit="filtros.limit" :total="total" @update:page="cargar" />
    </section>

    <ModalDialog v-model="modal" title="Editar cliente" width="520px">
      <form v-if="form" id="form-editar" novalidate @submit.prevent="guardar">
        <p class="doc">{{ form.tipoDocumento }} {{ form.numeroDocumento }} <span>(el documento no se puede cambiar)</span></p>
        <div class="field"><label for="e-nombre">Nombre o razón social</label><input id="e-nombre" v-model="form.razonSocial" maxlength="150" /><span v-if="errores.razonSocial" class="hint-error" role="alert">{{ errores.razonSocial }}</span></div>
        <div class="field"><label for="e-tel">Teléfono</label><input id="e-tel" v-model="form.telefono" maxlength="20" /><span v-if="errores.telefono" class="hint-error" role="alert">{{ errores.telefono }}</span></div>
        <div class="field"><label for="e-mail">Correo</label><input id="e-mail" v-model="form.email" type="email" maxlength="100" /><span v-if="errores.email" class="hint-error" role="alert">{{ errores.email }}</span></div>
        <div class="field"><label for="e-dir">Dirección</label><input id="e-dir" v-model="form.direccion" maxlength="200" /><span v-if="errores.direccion" class="hint-error" role="alert">{{ errores.direccion }}</span></div>
        <label class="activo"><input v-model="form.activo" type="checkbox" /> Cliente activo</label>
        <p v-if="errorModal" class="hint-error" role="alert">{{ errorModal }}</p>
      </form>
      <template #footer>
        <button class="btn btn-ghost" type="button" :disabled="guardando" @click="modal = false">Cancelar</button>
        <button class="btn btn-primary" type="submit" form="form-editar" :disabled="guardando">{{ guardando ? 'Guardando…' : 'Guardar' }}</button>
      </template>
    </ModalDialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { clientesApi } from '../../api/clientes';
import { validarCliente } from '../../utils/clientes';
import { mensajeDeError } from '../../utils/errores';
import { useNotificationStore } from '../../store/notifications';
import ModalDialog from '../../components/ModalDialog.vue';
import PaginationBar from '../../components/PaginationBar.vue';
import EmptyState from '../../components/EmptyState.vue';
import '../seguridad/seguridad.css';

const notify = useNotificationStore();
const clientes = ref([]);
const total = ref(0);
const cargando = ref(true);
const error = ref('');
const filtros = reactive({ page: 1, limit: 15, busqueda: '', estado: '1' });

const modal = ref(false);
const form = ref(null);
const errores = ref({});
const errorModal = ref('');
const guardando = ref(false);
let editandoId = null;

async function cargar(pagina) {
  if (typeof pagina === 'number') filtros.page = pagina;
  cargando.value = true;
  error.value = '';
  try {
    const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== '' && v !== null));
    const { data } = await clientesApi.listar(params);
    clientes.value = data.data.clientes;
    total.value = data.data.total;
  } catch (err) {
    clientes.value = []; total.value = 0;
    error.value = mensajeDeError(err, 'No se pudo cargar la lista de clientes.');
  } finally { cargando.value = false; }
}

function editar(c) {
  editandoId = c.clienteId;
  form.value = {
    tipoDocumento: c.tipoDocumento, numeroDocumento: c.numeroDocumento, razonSocial: c.nombre,
    telefono: c.telefono || '', email: c.email || '', direccion: c.direccion || '', activo: c.activo
  };
  errores.value = {}; errorModal.value = ''; modal.value = true;
}

async function guardar() {
  const v = validarCliente(form.value, { soloContacto: true });
  errores.value = v.errores;
  if (!v.ok) return;
  guardando.value = true; errorModal.value = '';
  try {
    const f = form.value;
    await clientesApi.actualizar(editandoId, { razonSocial: f.razonSocial, telefono: f.telefono, email: f.email, direccion: f.direccion, estado: f.activo ? 1 : 0 });
    modal.value = false;
    notify.success('Cliente actualizado.');
    await cargar();
  } catch (err) {
    errorModal.value = mensajeDeError(err, 'No se pudo guardar el cliente.');
  } finally { guardando.value = false; }
}

onMounted(() => cargar());
</script>

<style scoped>
.acciones { display: flex; gap: .4rem; justify-content: flex-end; white-space: nowrap; }
.doc { margin: 0 0 1rem; font-family: var(--font-mono); font-size: .9rem; }
.doc span { font-family: inherit; font-size: .78rem; color: var(--color-ink-soft); }
.field { display: flex; flex-direction: column; gap: .3rem; margin-bottom: .9rem; }
.activo { display: flex; gap: .5rem; align-items: center; font-size: .9rem; }
.hint-error { color: var(--color-wine); font-size: .82rem; }
</style>

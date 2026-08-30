<template>
  <div>
    <div class="toolbar card">
      <p style="margin:0; color: var(--color-ink-soft); font-size:.88rem;">Organiza el catálogo de productos por categorías.</p>
      <div class="spacer"></div>
      <button class="btn btn-gold" @click="abrirCrear">+ Nueva categoría</button>
    </div>

    <section class="card">
      <table>
        <thead><tr><th>Nombre</th><th>Descripción</th><th>Estado</th><th></th></tr></thead>
        <tbody v-if="cargando"><tr class="skeleton-row"><td colspan="4"><div class="skeleton-bar"></div></td></tr></tbody>
        <tbody v-else-if="categorias.length">
          <tr v-for="c in categorias" :key="c.categoria_id">
            <td>{{ c.nombre }}</td>
            <td>{{ c.descripcion || '—' }}</td>
            <td><span class="badge" :class="c.estado ? 'badge-ok' : 'badge-off'">{{ c.estado ? 'Activa' : 'Inactiva' }}</span></td>
            <td style="text-align:right;"><button class="btn btn-ghost btn-sm" @click="abrirEditar(c)">Editar</button></td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-if="!cargando && categorias.length === 0" titulo="No hay categorías" descripcion="Crea la primera categoría para organizar tus productos." />
    </section>

    <ModalDialog v-model="modalAbierto" :title="editando ? 'Editar categoría' : 'Nueva categoría'">
      <form id="form-categoria" @submit.prevent="guardar">
        <div class="field"><label>Nombre</label><input v-model.trim="form.nombre" required /></div>
        <div class="field"><label>Descripción</label><textarea v-model.trim="form.descripcion" rows="3"></textarea></div>
        <div class="field" v-if="editando"><label>Estado</label>
          <select v-model="form.estado"><option :value="1">Activa</option><option :value="0">Inactiva</option></select>
        </div>
      </form>
      <template #footer>
        <button class="btn btn-ghost" @click="modalAbierto = false">Cancelar</button>
        <button class="btn btn-primary" form="form-categoria" type="submit" :disabled="guardando">{{ guardando ? 'Guardando…' : 'Guardar' }}</button>
      </template>
    </ModalDialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { productosApi } from '../../api/productos';
import { useNotificationStore } from '../../store/notifications';
import ModalDialog from '../../components/ModalDialog.vue';
import EmptyState from '../../components/EmptyState.vue';

const notify = useNotificationStore();
const categorias = ref([]);
const cargando = ref(true);
const guardando = ref(false);
const modalAbierto = ref(false);
const editando = ref(null);
const form = reactive({ nombre: '', descripcion: '', estado: 1 });

async function cargar() {
  cargando.value = true;
  try { const { data } = await productosApi.categorias(); categorias.value = data.data; }
  catch { notify.error('No se pudieron cargar las categorías'); }
  finally { cargando.value = false; }
}

function abrirCrear() { editando.value = null; Object.assign(form, { nombre: '', descripcion: '', estado: 1 }); modalAbierto.value = true; }
function abrirEditar(c) { editando.value = c; Object.assign(form, { nombre: c.nombre, descripcion: c.descripcion || '', estado: c.estado }); modalAbierto.value = true; }

async function guardar() {
  guardando.value = true;
  try {
    if (editando.value) { await productosApi.actualizarCategoria(editando.value.categoria_id, form); notify.success('Categoría actualizada'); }
    else { await productosApi.crearCategoria(form); notify.success('Categoría creada'); }
    modalAbierto.value = false;
    cargar();
  } catch (err) { notify.error(err.response?.data?.message || 'No se pudo guardar la categoría'); }
  finally { guardando.value = false; }
}

onMounted(cargar);
</script>

<style scoped>
.toolbar { display: flex; align-items: center; gap: .7rem; padding: .9rem 1rem; margin-bottom: 1rem; }
.spacer { flex: 1; }
</style>

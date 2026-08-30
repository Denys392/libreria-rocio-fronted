<template>
  <div>
    <div class="toolbar card">
      <input v-model="filtros.busqueda" class="search-input" placeholder="Buscar por nombre o SKU…" @keyup.enter="cargar" />
      <select v-model="filtros.categoriaId" @change="cargar">
        <option value="">Todas las categorías</option>
        <option v-for="c in categorias" :key="c.categoria_id" :value="c.categoria_id">{{ c.nombre }}</option>
      </select>
      <select v-model="filtros.estado" @change="cargar">
        <option value="">Todos los estados</option>
        <option value="1">Activos</option>
        <option value="0">Inactivos</option>
      </select>
      <div class="spacer"></div>
      <button class="btn btn-gold" @click="abrirCrear">+ Nuevo producto</button>
    </div>

    <section class="card">
      <table>
        <thead>
          <tr><th>SKU</th><th>Producto</th><th>Categoría</th><th>P. venta</th><th>P. compra</th><th>Stock</th><th>Estado</th><th></th></tr>
        </thead>
        <tbody v-if="cargando">
          <tr v-for="n in 5" :key="n" class="skeleton-row"><td colspan="8"><div class="skeleton-bar"></div></td></tr>
        </tbody>
        <tbody v-else-if="productos.length">
          <tr v-for="p in productos" :key="p.producto_id">
            <td class="mono">{{ p.codigo_sku || '—' }}</td>
            <td>{{ p.nombre }}</td>
            <td>{{ p.categoria_nombre || '—' }}</td>
            <td>{{ formatoMoneda(p.precio_venta) }}</td>
            <td>{{ formatoMoneda(p.precio_compra) }}</td>
            <td>
              <span class="badge" :class="p.stock > 5 ? 'badge-ok' : p.stock > 0 ? 'badge-warn' : 'badge-danger'">{{ p.stock }}</span>
            </td>
            <td><span class="badge" :class="p.estado ? 'badge-ok' : 'badge-off'">{{ p.estado ? 'Activo' : 'Inactivo' }}</span></td>
            <td style="text-align:right;">
              <button class="btn btn-ghost btn-sm" @click="abrirEditar(p)">Editar</button>
              <button v-if="p.estado" class="btn btn-danger btn-sm" @click="desactivar(p)">Desactivar</button>
            </td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-if="!cargando && productos.length === 0" titulo="No hay productos" descripcion="Agrega el primer producto de tu catálogo." />
      <PaginationBar v-model:page="filtros.page" :limit="filtros.limit" :total="total" @update:page="cargar" />
    </section>

    <ModalDialog v-model="modalAbierto" :title="editando ? 'Editar producto' : 'Nuevo producto'" width="640px">
      <form id="form-producto" @submit.prevent="guardar" class="form-grid">
        <div class="field"><label>Nombre</label><input v-model.trim="form.nombre" required /></div>
        <div class="field"><label>SKU</label><input v-model.trim="form.codigoSku" placeholder="Opcional" /></div>
        <div class="field"><label>Categoría</label>
          <select v-model="form.categoriaId">
            <option value="">Sin categoría</option>
            <option v-for="c in categorias" :key="c.categoria_id" :value="c.categoria_id">{{ c.nombre }}</option>
          </select>
        </div>
        <div class="field"><label>Unidad de medida</label><input v-model.trim="form.unidadMedida" placeholder="NIU" /></div>
        <div class="field"><label>Precio de venta (con IGV)</label><input v-model.number="form.precioVenta" type="number" step="0.01" min="0" required /></div>
        <div class="field"><label>Precio de compra</label><input v-model.number="form.precioCompra" type="number" step="0.01" min="0" /></div>
        <div class="field" v-if="!editando"><label>Stock inicial</label><input v-model.number="form.stock" type="number" min="0" /></div>
        <div class="field"><label>URL de imagen</label><input v-model.trim="form.imagenUrl" placeholder="Opcional" /></div>
        <div class="field" v-if="editando"><label>Estado</label>
          <select v-model="form.estado"><option :value="1">Activo</option><option :value="0">Inactivo</option></select>
        </div>
      </form>
      <template #footer>
        <button class="btn btn-ghost" @click="modalAbierto = false">Cancelar</button>
        <button class="btn btn-primary" form="form-producto" type="submit" :disabled="guardando">{{ guardando ? 'Guardando…' : 'Guardar' }}</button>
      </template>
    </ModalDialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { productosApi } from '../../api/productos';
import { useNotificationStore } from '../../store/notifications';
import { formatoMoneda } from '../../utils/format';
import ModalDialog from '../../components/ModalDialog.vue';
import PaginationBar from '../../components/PaginationBar.vue';
import EmptyState from '../../components/EmptyState.vue';

const notify = useNotificationStore();
const productos = ref([]);
const categorias = ref([]);
const total = ref(0);
const cargando = ref(true);
const guardando = ref(false);
const modalAbierto = ref(false);
const editando = ref(null);

const filtros = reactive({ page: 1, limit: 10, categoriaId: '', estado: '', busqueda: '' });
const formInicial = () => ({ nombre: '', codigoSku: '', categoriaId: '', unidadMedida: 'NIU', precioVenta: 0, precioCompra: 0, stock: 0, imagenUrl: '', estado: 1 });
const form = reactive(formInicial());

async function cargar() {
  cargando.value = true;
  try {
    const { data } = await productosApi.listar(filtros);
    productos.value = data.data.rows;
    total.value = data.data.total;
  } catch { notify.error('No se pudieron cargar los productos'); }
  finally { cargando.value = false; }
}

async function cargarCategorias() {
  const { data } = await productosApi.categorias();
  categorias.value = data.data;
}

function abrirCrear() { editando.value = null; Object.assign(form, formInicial()); modalAbierto.value = true; }
function abrirEditar(p) {
  editando.value = p;
  Object.assign(form, {
    nombre: p.nombre, codigoSku: p.codigo_sku || '', categoriaId: p.categoria_id || '',
    unidadMedida: p.unidad_medida, precioVenta: Number(p.precio_venta), precioCompra: Number(p.precio_compra),
    imagenUrl: p.imagen_url || '', estado: p.estado
  });
  modalAbierto.value = true;
}

async function guardar() {
  guardando.value = true;
  try {
    if (editando.value) {
      await productosApi.actualizar(editando.value.producto_id, form);
      notify.success('Producto actualizado correctamente');
    } else {
      await productosApi.crear(form);
      notify.success('Producto creado correctamente');
    }
    modalAbierto.value = false;
    cargar();
  } catch (err) { notify.error(err.response?.data?.message || 'No se pudo guardar el producto'); }
  finally { guardando.value = false; }
}

async function desactivar(p) {
  if (!confirm(`¿Desactivar "${p.nombre}"?`)) return;
  try { await productosApi.eliminar(p.producto_id); notify.success('Producto desactivado'); cargar(); }
  catch (err) { notify.error(err.response?.data?.message || 'No se pudo desactivar'); }
}

onMounted(() => { cargar(); cargarCategorias(); });
</script>

<style scoped>
.toolbar { display: flex; align-items: center; gap: .7rem; padding: .9rem 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
.search-input { padding: .55rem .8rem; border: 1px solid var(--color-border-strong); border-radius: var(--radius-sm); min-width: 220px; background: var(--color-surface-raised); }
.toolbar select { padding: .55rem .7rem; border: 1px solid var(--color-border-strong); border-radius: var(--radius-sm); background: var(--color-surface-raised); }
.spacer { flex: 1; }
.mono { font-family: var(--font-mono); font-size: .82rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
</style>

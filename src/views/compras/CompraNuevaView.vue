<template>
  <div class="form-layout">
    <section class="card form-card">
      <h3 style="padding: 1.1rem 1.3rem .2rem;">Datos del comprobante</h3>
      <form id="form-compra" class="form-grid" @submit.prevent="registrar" style="padding: 0 1.3rem 1.3rem;">
        <div class="field"><label>Proveedor</label>
          <select v-model="cabecera.proveedorId" required>
            <option value="" disabled>Selecciona un proveedor</option>
            <option v-for="p in proveedores" :key="p.persona_id" :value="p.persona_id">{{ p.razon_social }}</option>
          </select>
        </div>
        <div class="field"><label>Tipo de comprobante</label>
          <select v-model="cabecera.tipoComprobante" required>
            <option value="01">Factura</option>
            <option value="03">Boleta</option>
            <option value="NA">Nota / recibo</option>
          </select>
        </div>
        <div class="field"><label>Serie</label><input v-model.trim="cabecera.serieComprobante" required placeholder="F001" /></div>
        <div class="field"><label>Número</label><input v-model.trim="cabecera.numeroComprobante" required placeholder="000123" /></div>
        <div class="field"><label>Fecha de emisión</label><input v-model="cabecera.fechaEmision" type="date" required /></div>
        <div class="field"><label>Moneda</label>
          <select v-model="cabecera.moneda"><option value="PEN">Soles (PEN)</option><option value="USD">Dólares (USD)</option></select>
        </div>
        <div class="field" style="grid-column: span 2;"><label>Observaciones</label><textarea v-model.trim="cabecera.observaciones" rows="2"></textarea></div>
      </form>

      <h3 style="padding: 0 1.3rem .6rem;">Ítems comprados</h3>
      <div class="items-add" style="padding: 0 1.3rem 1rem;">
        <select v-model="itemActual.productoId" class="item-select">
          <option value="" disabled>Selecciona un producto</option>
          <option v-for="p in productos" :key="p.producto_id" :value="p.producto_id">{{ p.nombre }} ({{ p.codigo_sku || 's/SKU' }})</option>
        </select>
        <input v-model.number="itemActual.cantidad" type="number" min="0.01" step="0.01" placeholder="Cantidad" class="item-num" />
        <input v-model.number="itemActual.precioCostoUnitario" type="number" min="0" step="0.01" placeholder="Costo unitario" class="item-num" />
        <button type="button" class="btn btn-ghost btn-sm" @click="agregarItem">+ Agregar</button>
      </div>

      <table style="padding: 0 1.3rem;">
        <thead><tr><th>Producto</th><th>Cantidad</th><th>Costo unit.</th><th>Subtotal</th><th></th></tr></thead>
        <tbody>
          <tr v-for="(it, idx) in items" :key="idx">
            <td>{{ nombreProducto(it.productoId) }}</td>
            <td>{{ it.cantidad }}</td>
            <td>{{ formatoMoneda(it.precioCostoUnitario) }}</td>
            <td>{{ formatoMoneda(it.cantidad * it.precioCostoUnitario) }}</td>
            <td style="text-align:right;"><button type="button" class="btn btn-danger btn-sm" @click="items.splice(idx, 1)">Quitar</button></td>
          </tr>
        </tbody>
      </table>
      <p v-if="items.length === 0" style="padding: 0 1.3rem 1.3rem; color: var(--color-ink-soft);">Aún no agregas ítems a esta compra.</p>

      <div class="totales" v-if="items.length">
        <span>Subtotal: {{ formatoMoneda(subtotalCalculado) }}</span>
        <span>IGV (18%): {{ formatoMoneda(subtotalCalculado * 0.18) }}</span>
        <strong>Total: {{ formatoMoneda(subtotalCalculado * 1.18) }}</strong>
      </div>

      <div class="acciones">
        <RouterLink class="btn btn-ghost" to="/compras">Cancelar</RouterLink>
        <button class="btn btn-primary" form="form-compra" type="submit" :disabled="items.length === 0 || guardando">
          {{ guardando ? 'Registrando…' : 'Registrar compra' }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { comprasApi } from '../../api/compras';
import { proveedoresApi } from '../../api/proveedores';
import { productosApi } from '../../api/productos';
import { useNotificationStore } from '../../store/notifications';
import { formatoMoneda } from '../../utils/format';

const notify = useNotificationStore();
const router = useRouter();

const proveedores = ref([]);
const productos = ref([]);
const items = ref([]);
const guardando = ref(false);

const cabecera = reactive({
  proveedorId: '', tipoComprobante: '01', serieComprobante: '', numeroComprobante: '',
  fechaEmision: new Date().toISOString().slice(0, 10), moneda: 'PEN', observaciones: ''
});
const itemActual = reactive({ productoId: '', cantidad: 1, precioCostoUnitario: 0 });

const subtotalCalculado = computed(() => items.value.reduce((acc, it) => acc + it.cantidad * it.precioCostoUnitario, 0));

function nombreProducto(id) {
  const p = productos.value.find((x) => x.producto_id === id);
  return p ? p.nombre : `#${id}`;
}

function agregarItem() {
  if (!itemActual.productoId || !itemActual.cantidad || itemActual.precioCostoUnitario < 0) {
    notify.error('Completa producto, cantidad y costo unitario');
    return;
  }
  items.value.push({ ...itemActual });
  Object.assign(itemActual, { productoId: '', cantidad: 1, precioCostoUnitario: 0 });
}

async function registrar() {
  guardando.value = true;
  try {
    const { data } = await comprasApi.registrar({ ...cabecera, items: items.value });
    notify.success('Compra registrada correctamente. Stock actualizado.');
    router.push(`/compras/${data.data.compra_id}`);
  } catch (err) {
    notify.error(err.response?.data?.message || 'No se pudo registrar la compra');
  } finally {
    guardando.value = false;
  }
}

onMounted(async () => {
  const [resProv, resProd] = await Promise.all([
    proveedoresApi.listar({ tipoPersona: 'PROVEEDOR', limit: 100 }),
    productosApi.listar({ limit: 200, estado: 1 })
  ]);
  proveedores.value = resProv.data.data.rows;
  productos.value = resProd.data.data.rows;
});
</script>

<style scoped>
.form-layout { max-width: 920px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
.items-add { display: flex; gap: .6rem; flex-wrap: wrap; align-items: center; }
.item-select { flex: 2; min-width: 200px; padding: .55rem .7rem; border: 1px solid var(--color-border-strong); border-radius: var(--radius-sm); background: var(--color-surface-raised); }
.item-num { width: 130px; padding: .55rem .7rem; border: 1px solid var(--color-border-strong); border-radius: var(--radius-sm); background: var(--color-surface-raised); }
.totales { display: flex; gap: 1.6rem; justify-content: flex-end; padding: 1rem 1.3rem; border-top: 1px solid var(--color-border); font-size: .9rem; color: var(--color-ink-soft); }
.totales strong { color: var(--color-forest-deep); font-size: 1.05rem; }
.acciones { display: flex; justify-content: flex-end; gap: .7rem; padding: 1rem 1.3rem 1.3rem; }
</style>

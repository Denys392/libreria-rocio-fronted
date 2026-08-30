<template>
  <div class="form-layout">
    <section class="card form-card">
      <h3 style="padding: 1.1rem 1.3rem .2rem;">Datos del comprobante</h3>
      <form id="form-venta" class="form-grid" @submit.prevent="registrar" style="padding: 0 1.3rem 1.3rem;">
        <div class="field"><label>Cliente</label>
          <select v-model="cabecera.clienteId">
            <option value="">Cliente varios (sin registrar)</option>
            <option v-for="c in clientes" :key="c.persona_id" :value="c.persona_id">{{ c.razon_social }}</option>
          </select>
        </div>
        <div class="field"><label>Tipo de comprobante</label>
          <select v-model="cabecera.tipoComprobante" required>
            <option value="01">Factura</option>
            <option value="03">Boleta</option>
            <option value="07">Nota de crédito</option>
          </select>
        </div>
        <div class="field"><label>Serie</label><input v-model.trim="cabecera.serie" required placeholder="B001" /></div>
        <div class="field"><label>Número</label><input v-model.trim="cabecera.numero" required placeholder="000123" /></div>
        <div class="field"><label>Fecha de emisión</label><input v-model="cabecera.fechaEmision" type="date" required /></div>
        <div class="field"><label>Forma de pago</label>
          <select v-model="cabecera.formaPago"><option value="Contado">Contado</option><option value="Crédito">Crédito</option></select>
        </div>
        <div class="field" v-if="cabecera.tipoComprobante === '07'">
          <label>Motivo de la nota</label>
          <input v-model.trim="cabecera.motivoNota" placeholder="Devolución, error en el importe, etc." />
        </div>
      </form>

      <h3 style="padding: 0 1.3rem .6rem;">Ítems vendidos</h3>
      <div class="items-add" style="padding: 0 1.3rem 1rem;">
        <select v-model="itemActual.productoId" class="item-select" @change="autocompletarPrecio">
          <option value="" disabled>Selecciona un producto</option>
          <option v-for="p in productos" :key="p.producto_id" :value="p.producto_id">
            {{ p.nombre }} — stock: {{ p.stock }}
          </option>
        </select>
        <input v-model.number="itemActual.cantidad" type="number" min="0.01" step="0.01" placeholder="Cantidad" class="item-num" />
        <input v-model.number="itemActual.precioUnitarioConIgv" type="number" min="0" step="0.01" placeholder="Precio (con IGV)" class="item-num" />
        <button type="button" class="btn btn-ghost btn-sm" @click="agregarItem">+ Agregar</button>
      </div>

      <table style="padding: 0 1.3rem;">
        <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unit.</th><th>Subtotal</th><th></th></tr></thead>
        <tbody>
          <tr v-for="(it, idx) in items" :key="idx">
            <td>{{ nombreProducto(it.productoId) }}</td>
            <td>{{ it.cantidad }}</td>
            <td>{{ formatoMoneda(it.precioUnitarioConIgv) }}</td>
            <td>{{ formatoMoneda(it.cantidad * it.precioUnitarioConIgv) }}</td>
            <td style="text-align:right;"><button type="button" class="btn btn-danger btn-sm" @click="items.splice(idx, 1)">Quitar</button></td>
          </tr>
        </tbody>
      </table>
      <p v-if="items.length === 0" style="padding: 0 1.3rem 1.3rem; color: var(--color-ink-soft);">Aún no agregas ítems a esta venta.</p>

      <div class="totales" v-if="items.length">
        <strong>Total (con IGV): {{ formatoMoneda(totalCalculado) }}</strong>
      </div>

      <div class="acciones">
        <RouterLink class="btn btn-ghost" to="/ventas">Cancelar</RouterLink>
        <button class="btn btn-primary" form="form-venta" type="submit" :disabled="items.length === 0 || guardando">
          {{ guardando ? 'Registrando…' : 'Registrar venta' }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ventasApi } from '../../api/ventas';
import { proveedoresApi } from '../../api/proveedores';
import { productosApi } from '../../api/productos';
import { useNotificationStore } from '../../store/notifications';
import { formatoMoneda } from '../../utils/format';

const notify = useNotificationStore();
const router = useRouter();

const clientes = ref([]);
const productos = ref([]);
const items = ref([]);
const guardando = ref(false);

const cabecera = reactive({
  clienteId: '', tipoComprobante: '03', serie: '', numero: '',
  fechaEmision: new Date().toISOString().slice(0, 10), formaPago: 'Contado', motivoNota: ''
});
const itemActual = reactive({ productoId: '', cantidad: 1, precioUnitarioConIgv: 0 });

const totalCalculado = computed(() => items.value.reduce((acc, it) => acc + it.cantidad * it.precioUnitarioConIgv, 0));

function nombreProducto(id) {
  const p = productos.value.find((x) => x.producto_id === id);
  return p ? p.nombre : `#${id}`;
}

function autocompletarPrecio() {
  const p = productos.value.find((x) => x.producto_id === itemActual.productoId);
  if (p) itemActual.precioUnitarioConIgv = Number(p.precio_venta);
}

function agregarItem() {
  if (!itemActual.productoId || !itemActual.cantidad || itemActual.precioUnitarioConIgv < 0) {
    notify.error('Completa producto, cantidad y precio unitario');
    return;
  }
  items.value.push({ ...itemActual });
  Object.assign(itemActual, { productoId: '', cantidad: 1, precioUnitarioConIgv: 0 });
}

async function registrar() {
  guardando.value = true;
  try {
    const payload = { ...cabecera, clienteId: cabecera.clienteId || null, items: items.value };
    const { data } = await ventasApi.registrar(payload);
    notify.success('Venta registrada correctamente. Stock actualizado.');
    router.push(`/ventas/${data.data.venta_id}`);
  } catch (err) {
    notify.error(err.response?.data?.message || 'No se pudo registrar la venta');
  } finally {
    guardando.value = false;
  }
}

onMounted(async () => {
  const [resCli, resProd] = await Promise.all([
    proveedoresApi.listar({ tipoPersona: 'CLIENTE', limit: 100 }),
    productosApi.listar({ limit: 200, estado: 1 })
  ]);
  clientes.value = resCli.data.data.rows;
  productos.value = resProd.data.data.rows;
});
</script>

<style scoped>
.form-layout { max-width: 920px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
.items-add { display: flex; gap: .6rem; flex-wrap: wrap; align-items: center; }
.item-select { flex: 2; min-width: 200px; padding: .55rem .7rem; border: 1px solid var(--color-border-strong); border-radius: var(--radius-sm); background: var(--color-surface-raised); }
.item-num { width: 150px; padding: .55rem .7rem; border: 1px solid var(--color-border-strong); border-radius: var(--radius-sm); background: var(--color-surface-raised); }
.totales { display: flex; gap: 1.6rem; justify-content: flex-end; padding: 1rem 1.3rem; border-top: 1px solid var(--color-border); font-size: 1.05rem; color: var(--color-forest-deep); }
.acciones { display: flex; justify-content: flex-end; gap: .7rem; padding: 1rem 1.3rem 1.3rem; }
</style>

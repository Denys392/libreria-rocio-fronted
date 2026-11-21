<template>
  <div class="pagina">
    <p v-if="error" class="seg-error" role="alert">{{ error }}</p>

    <section v-if="reglas" class="card panel">
      <p class="eyebrow">Regla vigente</p>
      <p class="regla">{{ textoRegla(reglas.activa.montoPorPunto) }}</p>
      <p v-if="reglas.activa.porDefecto" class="nota">Todavía no hay una regla guardada: se usa esta por defecto.</p>
      <p v-else-if="reglas.activa.creadoPor" class="nota">Definida por {{ reglas.activa.creadoPor }} · {{ formatoFechaMysql(reglas.activa.creadoDt) }}</p>
    </section>

    <form class="card panel" novalidate @submit.prevent="guardar">
      <h3>Cambiar la regla</h3>
      <p class="ayuda">Los puntos no se guardan: se calculan con las compras de cada cliente y la regla vigente. Al cambiarla, los puntos de todos se recalculan.</p>
      <div class="field">
        <label for="monto">Soles de compra por cada punto</label>
        <div class="fila">
          <span class="prefijo">S/</span>
          <input id="monto" v-model="monto" inputmode="decimal" placeholder="10.00" autocomplete="off" />
          <button class="btn btn-primary" type="submit" :disabled="guardando">{{ guardando ? 'Guardando…' : 'Guardar regla' }}</button>
        </div>
        <span v-if="errorMonto" class="hint-error" role="alert">{{ errorMonto }}</span>
        <span v-else-if="vista" class="vista">Quedaría: {{ vista }}</span>
      </div>
    </form>

    <section v-if="reglas && reglas.historial.length" class="card seg-tabla">
      <table>
        <thead><tr><th>Regla</th><th>Definida por</th><th>Fecha</th></tr></thead>
        <tbody>
          <tr v-for="h in reglas.historial" :key="h.reglaId">
            <td>{{ textoRegla(h.montoPorPunto) }} <span v-if="h.reglaId === reglas.activa.reglaId" class="badge badge-ok">vigente</span></td>
            <td>{{ h.creadoPor || '—' }}</td>
            <td class="seg-small">{{ formatoFechaMysql(h.creadoDt) }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { fidelizacionApi } from '../../api/clientes';
import { textoRegla, validarMontoRegla } from '../../utils/clientes';
import { formatoFechaMysql } from '../../utils/fechas';
import { mensajeDeError } from '../../utils/errores';
import { useNotificationStore } from '../../store/notifications';
import '../seguridad/seguridad.css';

const notify = useNotificationStore();
const reglas = ref(null);
const monto = ref('');
const errorMonto = ref('');
const error = ref('');
const guardando = ref(false);

const vista = computed(() => {
  const v = validarMontoRegla(monto.value);
  return v.ok ? textoRegla(v.valor) : '';
});

async function cargar() {
  error.value = '';
  try {
    const { data } = await fidelizacionApi.reglas();
    reglas.value = data.data;
    monto.value = String(data.data.activa.montoPorPunto);
  } catch (err) {
    error.value = mensajeDeError(err, 'No se pudieron cargar las reglas.');
  }
}

async function guardar() {
  errorMonto.value = '';
  const v = validarMontoRegla(monto.value);
  if (!v.ok) { errorMonto.value = v.error; return; }
  guardando.value = true;
  try {
    const { data } = await fidelizacionApi.cambiarRegla(v.valor);
    reglas.value = { activa: data.data.activa, historial: data.data.historial };
    notify[data.data.cambio ? 'success' : 'info'](data.data.cambio ? 'Regla actualizada.' : 'Esa ya es la regla vigente.');
  } catch (err) {
    errorMonto.value = mensajeDeError(err, 'No se pudo guardar la regla.');
  } finally { guardando.value = false; }
}

onMounted(cargar);
</script>

<style scoped>
.pagina { max-width: 720px; display: flex; flex-direction: column; gap: 1rem; }
.panel { padding: 1.3rem 1.5rem; }
.eyebrow { margin: 0; font-size: .74rem; text-transform: uppercase; letter-spacing: .05em; color: var(--color-ink-soft); font-weight: 700; }
.regla { margin: .3rem 0; font-family: var(--font-display); font-size: 1.6rem; color: var(--color-forest-deep); }
.nota, .ayuda { margin: 0; font-size: .86rem; color: var(--color-ink-soft); line-height: 1.45; }
.ayuda { margin-bottom: 1rem; }
.field { display: flex; flex-direction: column; gap: .35rem; }
.fila { display: flex; gap: .5rem; align-items: center; }
.fila input { max-width: 160px; }
.prefijo { font-weight: 600; }
.hint-error { color: var(--color-wine); font-size: .84rem; }
.vista { color: var(--color-ink-soft); font-size: .84rem; }
</style>

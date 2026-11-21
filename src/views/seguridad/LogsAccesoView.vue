<template>
  <div>
    <div class="card seg-toolbar">
      <label>Desde <input v-model="filtros.desde" type="date" @change="cargar(1)" /></label>
      <label>Hasta <input v-model="filtros.hasta" type="date" @change="cargar(1)" /></label>
      <label>Correo <input v-model.trim="filtros.correo" type="search" placeholder="Buscar correo" @keyup.enter="cargar(1)" @change="cargar(1)" /></label>
      <label>Evento
        <select v-model="filtros.evento" @change="cargar(1)">
          <option value="">Todos</option>
          <option v-for="(texto, clave) in ETIQUETAS_EVENTO" :key="clave" :value="clave">{{ texto }}</option>
        </select>
      </label>
      <label>Resultado
        <select v-model="filtros.resultado" @change="cargar(1)">
          <option value="">Todos</option>
          <option value="EXITO">Éxito</option>
          <option value="FALLO">Fallo</option>
        </select>
      </label>
      <label>Aplicación
        <select v-model="filtros.app" @change="cargar(1)">
          <option value="">Todas</option>
          <option v-for="a in APPS" :key="a.codigo" :value="a.codigo">{{ a.nombre }}</option>
        </select>
      </label>
      <div class="seg-spacer"></div>
      <button class="btn btn-ghost btn-sm" type="button" @click="limpiar">Limpiar</button>
      <button class="btn btn-ghost btn-sm" type="button" @click="cargar()">Actualizar</button>
    </div>

    <p v-if="error" class="seg-error" role="alert">{{ error }}</p>

    <section class="card seg-tabla">
      <table>
        <thead>
          <tr>
            <th>Fecha</th><th>Usuario</th><th>Aplicación</th><th>Rol</th><th>Evento</th>
            <th>Resultado</th><th>IP</th><th>Duración</th><th>Detalle</th>
          </tr>
        </thead>
        <tbody v-if="cargando">
          <tr v-for="n in 8" :key="n" class="skeleton-row"><td colspan="9"><div class="skeleton-bar"></div></td></tr>
        </tbody>
        <tbody v-else-if="filas.length">
          <tr v-for="f in filas" :key="f.log_id">
            <td class="seg-small">{{ formatoFechaMysql(f.inicio_dt) }}</td>
            <td>{{ f.correo || '—' }}</td>
            <td>{{ f.app || '—' }}</td>
            <td class="seg-small">{{ f.rol || '—' }}</td>
            <td><span class="badge" :class="claseEvento(f.evento)">{{ ETIQUETAS_EVENTO[f.evento] || f.evento }}</span></td>
            <td><span class="badge" :class="f.resultado === 'EXITO' ? 'badge-ok' : 'badge-danger'">{{ f.resultado === 'EXITO' ? 'Éxito' : 'Fallo' }}</span></td>
            <td class="seg-mono">{{ f.ip || '—' }}</td>
            <td class="seg-small seg-mono">{{ f.evento === 'INGRESO_APP' ? (f.fin_dt ? formatoSegundos(f.duracion_seg) : 'abierta') : '—' }}</td>
            <td class="seg-detalle" :title="f.motivo">{{ f.motivo || '—' }}</td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-if="!cargando && !error && filas.length === 0" titulo="Sin registros" descripcion="No hay accesos que coincidan con los filtros." />
      <PaginationBar :page="filtros.page" :limit="filtros.limit" :total="total" @update:page="cargar" />
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { centralApi } from '../../api/central';
import { formatoFechaMysql, formatoSegundos, ETIQUETAS_EVENTO } from '../../utils/fechas';
import { mensajeDeError } from '../../utils/errores';
import PaginationBar from '../../components/PaginationBar.vue';
import EmptyState from '../../components/EmptyState.vue';
import './seguridad.css';

const APPS = [
  { codigo: 'libreria', nombre: 'Librería' },
  { codigo: 'almacen', nombre: 'Almacén' },
  { codigo: 'clientes', nombre: 'Clientes' },
  { codigo: 'seguridad', nombre: 'Seguridad' }
];

const filas = ref([]);
const total = ref(0);
const cargando = ref(true);
const error = ref('');
const vacio = () => ({ page: 1, limit: 15, desde: '', hasta: '', correo: '', evento: '', resultado: '', app: '' });
const filtros = reactive(vacio());

// El badge del evento: los cambios que hizo Seguridad se destacan
function claseEvento(evento) {
  if (evento === 'ACCESO_DESACTIVADO' || evento === 'MENU_DESACTIVADO') return 'badge-danger';
  if (evento === 'ACCESO_ACTIVADO') return 'seg-badge-info';
  if (evento === 'USUARIO_BLOQUEADO' || evento === 'TOKEN_RECHAZADO') return 'seg-badge-aviso';
  return 'seg-badge-info';
}

function limpiar() {
  Object.assign(filtros, vacio());
  cargar(1);
}

async function cargar(pagina) {
  if (typeof pagina === 'number') filtros.page = pagina;
  cargando.value = true;
  error.value = '';
  try {
    // Los filtros vacíos no se envían
    const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== '' && v !== null));
    const { data } = await centralApi.logs(params);
    filas.value = data.data.filas;
    total.value = data.data.total;
  } catch (err) {
    filas.value = [];
    total.value = 0;
    error.value = mensajeDeError(err, 'No se pudieron cargar los logs de acceso.');
  } finally {
    cargando.value = false;
  }
}

onMounted(() => cargar());
</script>

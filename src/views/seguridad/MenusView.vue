<template>
  <div>
    <div class="card seg-toolbar">
      <label>Aplicación
        <select v-model="app" :disabled="cargando" @change="cargar">
          <option v-for="a in aplicaciones" :key="a.codigo" :value="a.codigo">{{ a.nombre }}</option>
        </select>
      </label>
      <button class="btn btn-ghost btn-sm" type="button" @click="expandir(true)">Expandir todo</button>
      <button class="btn btn-ghost btn-sm" type="button" @click="expandir(false)">Contraer todo</button>
      <div class="seg-spacer"></div>
      <button class="btn btn-primary btn-sm" type="button" :disabled="!app" @click="abrirCrear(null)">+ Crear opción de menú</button>
    </div>

    <p class="ayuda">
      Lo que active o desactive aquí lo verá cada aplicación en menos de un minuto, sin volver a entrar. Nada se borra: puede reactivarlo cuando quiera
      y cada cambio queda en los logs de acceso. Al desactivar un menú padre, sus opciones hijas dejan de mostrarse.
    </p>

    <p v-if="error" class="seg-error" role="alert">{{ error }}</p>
    <div v-if="cargando && !menu.length" class="card"><div class="skeleton-bar"></div></div>
    <EmptyState v-else-if="!error && !menu.length" titulo="Sin opciones" descripcion="Esta aplicación todavía no tiene opciones de menú." />

    <section v-if="menu.length" class="card arbol">
      <div v-for="p in menu" :key="p.id" class="grupo">
        <div class="fila padre" :class="{ apagada: !p.efectivo }">
          <button class="plegar" type="button" :aria-label="abiertos[p.id] ? 'Contraer' : 'Expandir'" @click="abiertos[p.id] = !abiertos[p.id]">{{ abiertos[p.id] ? '▾' : '▸' }}</button>
          <div class="info">
            <strong>{{ p.nombre }}</strong>
            <span class="meta">{{ p.hijos.length }} {{ p.hijos.length === 1 ? 'hijo' : 'hijos' }}<template v-if="p.ruta"> · <span class="seg-mono">{{ p.ruta }}</span></template> · icono {{ p.icono }} · orden {{ p.orden }}</span>
          </div>
          <span class="badge" :class="estadoDeOpcion(p).clase">{{ estadoDeOpcion(p).texto }}</span>
          <div class="acciones">
            <button class="btn btn-ghost btn-sm" type="button" title="Agregar una opción hija" @click="abrirCrear(p)">+ Hija</button>
            <button class="btn btn-ghost btn-sm" type="button" @click="abrirEditar(p, true)">Editar</button>
            <button class="btn btn-sm" :class="p.activo ? 'btn-danger' : 'btn-primary'" type="button" :disabled="enCurso" @click="pedirEstado(p, true)">{{ p.activo ? 'Desactivar' : 'Activar' }}</button>
          </div>
        </div>

        <template v-if="abiertos[p.id]">
          <div v-for="h in p.hijos" :key="h.id" class="fila hijo" :class="{ apagada: !h.efectivo }">
            <span class="rama">↳</span>
            <div class="info">
              <strong>{{ h.nombre }}</strong>
              <span class="meta"><span class="seg-mono">{{ h.ruta }}</span> · icono {{ h.icono }} · orden {{ h.orden }}</span>
            </div>
            <span class="badge" :class="estadoDeOpcion(h).clase">{{ estadoDeOpcion(h).texto }}</span>
            <div class="acciones">
              <button class="btn btn-ghost btn-sm" type="button" @click="abrirEditar(h, false)">Editar</button>
              <button class="btn btn-sm" :class="h.activo ? 'btn-danger' : 'btn-primary'" type="button" :disabled="enCurso" @click="pedirEstado(h, false)">{{ h.activo ? 'Desactivar' : 'Activar' }}</button>
            </div>
          </div>
          <p v-if="!p.hijos.length" class="sin-hijos">Este menú todavía no tiene opciones hijas.</p>
        </template>
      </div>
    </section>

    <!-- Crear / editar -->
    <ModalDialog v-model="modalForm" :title="titulo" width="520px">
      <form id="form-opcion" novalidate @submit.prevent="guardar">
        <p v-if="modo === 'crear'" class="contexto">{{ padreContexto ? `Nueva opción dentro de «${padreContexto.nombre}»` : 'Nuevo menú padre (agrupa opciones)' }} · {{ nombreApp }}</p>
        <div class="field"><label for="m-nombre">Nombre</label><input id="m-nombre" v-model="form.nombre" maxlength="80" autocomplete="off" /><span v-if="errores.nombre" class="hint-error" role="alert">{{ errores.nombre }}</span></div>
        <div class="field">
          <label for="m-ruta">Ruta {{ esPadre ? '(opcional: un padre puede solo agrupar)' : '' }}</label>
          <input id="m-ruta" v-model="form.ruta" maxlength="150" autocomplete="off" placeholder="/productos" />
          <span v-if="errores.ruta" class="hint-error" role="alert">{{ errores.ruta }}</span>
          <span v-else class="pista">Debe ser una pantalla que ya exista en esa aplicación; si no, al entrar verá «no encontrada».</span>
        </div>
        <div class="dos">
          <div class="field"><label for="m-icono">Icono</label>
            <select id="m-icono" v-model="form.icono"><option v-for="i in ICONOS_MENU" :key="i.valor" :value="i.valor">{{ i.texto }}</option></select>
            <span v-if="errores.icono" class="hint-error" role="alert">{{ errores.icono }}</span></div>
          <div class="field"><label for="m-orden">Orden</label><input id="m-orden" v-model="form.orden" inputmode="numeric" maxlength="3" placeholder="al final" /><span v-if="errores.orden" class="hint-error" role="alert">{{ errores.orden }}</span></div>
        </div>
        <p v-if="errorModal" class="hint-error" role="alert">{{ errorModal }}</p>
      </form>
      <template #footer>
        <button class="btn btn-ghost" type="button" :disabled="enCurso" @click="modalForm = false">Cancelar</button>
        <button class="btn btn-primary" type="submit" form="form-opcion" :disabled="enCurso">{{ enCurso ? 'Guardando…' : 'Guardar' }}</button>
      </template>
    </ModalDialog>

    <!-- Confirmar activar / desactivar -->
    <ModalDialog v-model="modalEstado" :title="pendiente && pendiente.op.activo ? 'Desactivar opción' : 'Activar opción'" width="460px">
      <template v-if="pendiente">
        <p>¿{{ pendiente.op.activo ? 'Desactivar' : 'Activar' }} <strong>{{ pendiente.op.nombre }}</strong> en <strong>{{ nombreApp }}</strong>?</p>
        <p v-if="pendiente.op.activo && pendiente.esPadre && hijosQueSeOcultan(pendiente.op)" class="aviso">Dejarán de mostrarse sus {{ hijosQueSeOcultan(pendiente.op) }} opción(es) hija(s) activa(s).</p>
        <p v-if="pendiente.op.activo" class="pista">Las personas de esa aplicación dejarán de ver esta opción y de poder entrar a ella.</p>
        <p v-if="errorModal" class="hint-error" role="alert">{{ errorModal }}</p>
      </template>
      <template #footer>
        <button class="btn btn-ghost" type="button" :disabled="enCurso" @click="modalEstado = false">Cancelar</button>
        <button class="btn" :class="pendiente && pendiente.op.activo ? 'btn-danger' : 'btn-primary'" type="button" :disabled="enCurso" @click="confirmarEstado">{{ enCurso ? 'Guardando…' : 'Confirmar' }}</button>
      </template>
    </ModalDialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { centralApi } from '../../api/central';
import { ICONOS_MENU, validarOpcion, cuerpoDeOpcion, estadoDeOpcion, hijosQueSeOcultan } from '../../utils/menus';
import { mensajeDeError } from '../../utils/errores';
import { useNotificationStore } from '../../store/notifications';
import ModalDialog from '../../components/ModalDialog.vue';
import EmptyState from '../../components/EmptyState.vue';
import './seguridad.css';

const notify = useNotificationStore();
const aplicaciones = ref([]);
const app = ref('');
const menu = ref([]);
const abiertos = reactive({});
const cargando = ref(true);
const error = ref('');
const enCurso = ref(false);

const nombreApp = computed(() => (aplicaciones.value.find((a) => a.codigo === app.value) || {}).nombre || '');

// ---- crear / editar
const modalForm = ref(false);
const modo = ref('crear'); // crear | editar
const padreContexto = ref(null); // el padre cuando se crea una hija
const editando = ref(null);
const esPadre = ref(false);
const form = reactive({ nombre: '', ruta: '', icono: 'dash', orden: '' });
const errores = ref({});
const errorModal = ref('');
const titulo = computed(() => (modo.value === 'crear' ? 'Crear opción de menú' : 'Editar opción'));

// ---- activar / desactivar
const modalEstado = ref(false);
const pendiente = ref(null);

async function cargar() {
  cargando.value = true;
  error.value = '';
  try {
    const { data } = await centralApi.menus(app.value || undefined);
    aplicaciones.value = data.data.aplicaciones;
    app.value = data.data.aplicacion ? data.data.aplicacion.codigo : '';
    menu.value = data.data.menu;
    for (const p of menu.value) if (!(p.id in abiertos)) abiertos[p.id] = true;
  } catch (err) {
    menu.value = [];
    error.value = mensajeDeError(err, 'No se pudieron cargar las opciones de menú.');
  } finally { cargando.value = false; }
}

function expandir(valor) { for (const p of menu.value) abiertos[p.id] = valor; }

function abrirCrear(padre) {
  modo.value = 'crear'; padreContexto.value = padre; editando.value = null; esPadre.value = !padre;
  Object.assign(form, { nombre: '', ruta: '', icono: padre ? padre.icono : 'dash', orden: '' });
  errores.value = {}; errorModal.value = ''; modalForm.value = true;
}

function abrirEditar(op, padre) {
  modo.value = 'editar'; padreContexto.value = null; editando.value = op; esPadre.value = padre;
  Object.assign(form, { nombre: op.nombre, ruta: op.ruta || '', icono: op.icono, orden: String(op.orden) });
  errores.value = {}; errorModal.value = ''; modalForm.value = true;
}

async function guardar() {
  const v = validarOpcion(form, { esPadre: esPadre.value });
  errores.value = v.errores;
  if (!v.ok) return;
  enCurso.value = true; errorModal.value = '';
  try {
    const cuerpo = cuerpoDeOpcion(form);
    if (modo.value === 'crear') {
      await centralApi.crearMenu({ appCodigo: app.value, padreId: padreContexto.value ? padreContexto.value.id : undefined, ...cuerpo });
      notify.success('Opción creada. Ya la ven las personas de esa aplicación.');
    } else {
      // al editar, el orden vacío significa "no tocar"
      const { data } = await centralApi.cambiarMenu(editando.value.id, cuerpo);
      notify[data.data.cambio ? 'success' : 'info'](data.data.cambio ? 'Opción actualizada.' : 'No había cambios.');
    }
    modalForm.value = false;
    await cargar();
  } catch (err) {
    errorModal.value = mensajeDeError(err, 'No se pudo guardar la opción.');
  } finally { enCurso.value = false; }
}

function pedirEstado(op, padre) {
  pendiente.value = { op, esPadre: padre };
  errorModal.value = ''; modalEstado.value = true;
}

async function confirmarEstado() {
  if (!pendiente.value || enCurso.value) return;
  const { op } = pendiente.value;
  const activar = !op.activo;
  enCurso.value = true; errorModal.value = '';
  try {
    const { data } = await centralApi.cambiarMenu(op.id, { activo: activar });
    modalEstado.value = false;
    await cargar();
    notify.success(activar ? 'Opción activada.' : `Opción desactivada${data.data.hijosAfectados ? ` (${data.data.hijosAfectados} opción(es) hija(s) dejan de verse)` : ''}.`);
  } catch (err) {
    // Se queda abierto para leer el motivo (ej. "es el inicio de la aplicación")
    errorModal.value = mensajeDeError(err, 'No se pudo guardar el cambio.');
  } finally { enCurso.value = false; }
}

onMounted(cargar);
</script>

<style scoped>
.ayuda { margin: 0 0 1rem; font-size: .86rem; color: var(--color-ink-soft); line-height: 1.45; max-width: 820px; }
.arbol { padding: .4rem 0; }
.grupo { border-bottom: 1px solid var(--color-border); padding: .2rem 0; }
.grupo:last-child { border-bottom: 0; }
.fila { display: flex; align-items: center; gap: .8rem; padding: .55rem 1rem; }
.fila.hijo { padding-left: 2.6rem; background: var(--color-surface-raised); }
.fila.apagada .info { opacity: .55; }
.plegar { border: 0; background: transparent; cursor: pointer; font-size: 1rem; width: 1.4rem; color: var(--color-ink-soft); }
.rama { width: 1.4rem; color: var(--color-ink-soft); }
.info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.meta { font-size: .78rem; color: var(--color-ink-soft); }
.acciones { display: flex; gap: .4rem; flex-wrap: wrap; justify-content: flex-end; }
.sin-hijos { margin: 0; padding: .4rem 2.6rem .6rem; font-size: .82rem; color: var(--color-ink-soft); }
.contexto { margin: 0 0 1rem; font-size: .86rem; color: var(--color-ink-soft); }
.field { display: flex; flex-direction: column; gap: .3rem; margin-bottom: .9rem; }
.dos { display: grid; grid-template-columns: 1fr 1fr; gap: .8rem; }
.hint-error { color: var(--color-wine); font-size: .82rem; }
.pista { color: var(--color-ink-soft); font-size: .78rem; }
.aviso { background: #FBEEDA; color: #93610E; border-radius: var(--radius-sm); padding: .55rem .75rem; font-size: .86rem; }
@media (max-width: 720px) { .fila { flex-wrap: wrap; } .acciones { width: 100%; justify-content: flex-start; } }
</style>

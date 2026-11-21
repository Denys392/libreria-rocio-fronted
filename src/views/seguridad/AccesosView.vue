<template>
  <div>
    <div class="card seg-toolbar">
      <p class="ayuda">
        Aquí decide qué usuario puede entrar a cada aplicación. Al desactivar un acceso, la sesión abierta de esa persona
        en esa aplicación se cierra y la tarjeta deja de aparecerle al ingresar. Cada cambio queda en los logs de acceso.
      </p>
      <div class="seg-spacer"></div>
      <label>Buscar <input v-model.trim="busqueda" type="search" placeholder="Correo o nombre" /></label>
      <button class="btn btn-ghost btn-sm" type="button" :disabled="cargando" @click="cargar">Actualizar</button>
    </div>

    <p v-if="error" class="seg-error" role="alert">{{ error }}</p>

    <div v-if="cargando && !usuarios.length" class="card"><div class="skeleton-bar"></div></div>
    <EmptyState v-else-if="!error && !visibles.length" titulo="Sin usuarios" descripcion="No hay usuarios con roles que coincidan con la búsqueda." />

    <article v-for="u in visibles" :key="u.usuarioId" class="card usuario">
      <header>
        <div>
          <strong>{{ u.nombre }}</strong>
          <span class="correo">{{ u.correo }}</span>
        </div>
        <span v-if="u.usuarioId === yoId" class="badge seg-badge-info">Usted</span>
      </header>
      <ul class="accesos">
        <li v-for="a in u.accesos" :key="a.rolId" :class="{ apagado: !a.activo }">
          <div class="acc-info">
            <span class="acc-app">{{ a.aplicacion.nombre }}</span>
            <span class="acc-rol">{{ a.rol.nombre }}</span>
          </div>
          <span class="badge" :class="a.activo ? 'badge-ok' : 'badge-danger'">{{ a.activo ? 'Activo' : 'Desactivado' }}</span>
          <button
            class="btn btn-sm"
            :class="a.activo ? 'btn-danger' : 'btn-primary'"
            type="button"
            :disabled="enCurso"
            @click="pedirCambio(u, a)"
          >{{ a.activo ? 'Desactivar' : 'Activar' }}</button>
        </li>
      </ul>
      <div v-if="faltantes(u).length" class="agregar">
        <select v-model="elegido[u.usuarioId]" :aria-label="'Agregar acceso a ' + u.nombre">
          <option :value="undefined">Agregar acceso…</option>
          <option v-for="r in faltantes(u)" :key="r.rolId" :value="r.rolId">{{ r.aplicacion.nombre }} · {{ r.rol.nombre }}</option>
        </select>
        <button class="btn btn-ghost btn-sm" type="button" :disabled="!elegido[u.usuarioId] || enCurso" @click="agregar(u)">Agregar</button>
      </div>
    </article>

    <ModalDialog v-model="modal" :title="pendiente ? (pendiente.acceso.activo ? 'Desactivar acceso' : 'Activar acceso') : ''" width="460px">
      <template v-if="pendiente">
        <p>
          ¿{{ pendiente.acceso.activo ? 'Desactivar' : 'Activar' }} el acceso de <strong>{{ pendiente.usuario.nombre }}</strong>
          a <strong>{{ pendiente.acceso.aplicacion.nombre }}</strong> ({{ pendiente.acceso.rol.nombre }})?
        </p>
        <p v-if="pendiente.acceso.activo" class="aviso">Si tiene una sesión abierta en esa aplicación, se cerrará.</p>
        <div class="field">
          <label for="motivo">Motivo (opcional, queda en la auditoría)</label>
          <input id="motivo" v-model.trim="motivo" maxlength="120" type="text" placeholder="Ej.: baja temporal" @keyup.enter="confirmar" />
        </div>
        <p v-if="errorModal" class="hint-error" role="alert">{{ errorModal }}</p>
      </template>
      <template #footer>
        <button class="btn btn-ghost" type="button" :disabled="enCurso" @click="modal = false">Cancelar</button>
        <button
          class="btn"
          :class="pendiente && pendiente.acceso.activo ? 'btn-danger' : 'btn-primary'"
          type="button"
          :disabled="enCurso"
          @click="confirmar"
        >{{ enCurso ? 'Guardando…' : 'Confirmar' }}</button>
      </template>
    </ModalDialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { centralApi } from '../../api/central';
import { useAuthStore } from '../../store/auth';
import { useNotificationStore } from '../../store/notifications';
import { mensajeDeError } from '../../utils/errores';
import ModalDialog from '../../components/ModalDialog.vue';
import EmptyState from '../../components/EmptyState.vue';
import './seguridad.css';

const auth = useAuthStore();
const notify = useNotificationStore();

const usuarios = ref([]);
const catalogo = ref([]); // todos los roles que existen
const elegido = reactive({}); // usuarioId -> rol elegido en "Agregar acceso"
const cargando = ref(true);
const error = ref('');
const busqueda = ref('');
const modal = ref(false);
const pendiente = ref(null); // { usuario, acceso }
const motivo = ref('');
const errorModal = ref('');
const enCurso = ref(false);

const yoId = computed(() => auth.usuario && auth.usuario.id);
const visibles = computed(() => {
  const q = busqueda.value.toLowerCase();
  if (!q) return usuarios.value;
  return usuarios.value.filter((u) => u.correo.toLowerCase().includes(q) || u.nombre.toLowerCase().includes(q));
});

async function cargar() {
  cargando.value = true;
  error.value = '';
  try {
    const { data } = await centralApi.accesos();
    usuarios.value = data.data.usuarios;
    catalogo.value = data.data.roles || [];
  } catch (err) {
    usuarios.value = [];
    error.value = mensajeDeError(err, 'No se pudo cargar la lista de accesos.');
  } finally {
    cargando.value = false;
  }
}

// Roles que ese usuario todavía no tiene (los que ya tiene, aunque desactivados, se manejan con Activar)
const faltantes = (u) => catalogo.value.filter((r) => !u.accesos.some((a) => a.rolId === r.rolId));

async function agregar(u) {
  const rolId = elegido[u.usuarioId];
  if (!rolId || enCurso.value) return;
  enCurso.value = true;
  try {
    await centralApi.asignarRol({ usuarioId: u.usuarioId, rolId });
    elegido[u.usuarioId] = undefined;
    await cargar();
    notify.success('Acceso agregado.');
  } catch (err) {
    notify.error(mensajeDeError(err, 'No se pudo agregar el acceso.'));
  } finally {
    enCurso.value = false;
  }
}

function pedirCambio(usuario, acceso) {
  pendiente.value = { usuario, acceso };
  motivo.value = '';
  errorModal.value = '';
  modal.value = true;
}

async function confirmar() {
  if (!pendiente.value || enCurso.value) return;
  const { usuario, acceso } = pendiente.value;
  const activar = !acceso.activo;
  enCurso.value = true;
  errorModal.value = '';
  try {
    const { data } = await centralApi.cambiarAcceso({
      usuarioId: usuario.usuarioId, rolId: acceso.rolId, activo: activar, motivo: motivo.value
    });
    modal.value = false;
    await cargar();
    if (!data.data.cambio) notify.info('Ya estaba en ese estado.');
    else notify.success(activar ? 'Acceso activado.' : 'Acceso desactivado.');
  } catch (err) {
    // Se queda abierto el modal para que se lea el motivo del rechazo (ej. "no puede quitarse a sí mismo")
    errorModal.value = mensajeDeError(err, 'No se pudo guardar el cambio.');
  } finally {
    enCurso.value = false;
  }
}

onMounted(cargar);
</script>

<style scoped>
.ayuda { margin: 0; font-size: .86rem; color: var(--color-ink-soft); max-width: 640px; line-height: 1.45; }
.usuario { padding: 1rem 1.2rem; margin-bottom: 1rem; }
.usuario header { display: flex; justify-content: space-between; align-items: center; margin-bottom: .7rem; gap: .6rem; }
.correo { margin-left: .6rem; font-size: .84rem; color: var(--color-ink-soft); }
.accesos { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
.accesos li { display: grid; grid-template-columns: 1fr auto 110px; align-items: center; gap: .8rem; padding: .55rem 0; border-top: 1px solid var(--color-border); }
.accesos li.apagado .acc-info { opacity: .55; }
.acc-info { display: flex; flex-direction: column; }
.acc-app { font-weight: 600; }
.acc-rol { font-size: .8rem; color: var(--color-ink-soft); }
.agregar { display: flex; gap: .5rem; align-items: center; margin-top: .7rem; padding-top: .7rem; border-top: 1px solid var(--color-border); }
.agregar select { flex: 1; max-width: 320px; padding: .45rem .6rem; border: 1px solid var(--color-border-strong); border-radius: var(--radius-sm); background: var(--color-surface-raised); font-size: .86rem; }
.aviso { background: #FBEEDA; color: #93610E; border-radius: var(--radius-sm); padding: .55rem .75rem; font-size: .86rem; }
.hint-error { color: var(--color-wine); font-size: .85rem; margin: .6rem 0 0; }
@media (max-width: 560px) { .accesos li { grid-template-columns: 1fr; } }
</style>

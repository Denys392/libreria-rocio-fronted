<template>
  <div class="pagina">
    <!-- Resultado: se muestra la clave UNA vez para entregarla -->
    <section v-if="creado" class="card exito">
      <h3>Usuario creado</h3>
      <dl>
        <dt>Nombre</dt><dd>{{ creado.nombre }}</dd>
        <dt>Correo</dt><dd class="seg-mono">{{ creado.correo }}</dd>
        <dt>Clave inicial</dt>
        <dd class="clave-fila">
          <span class="seg-mono clave-valor">{{ claveEntregada }}</span>
          <button class="btn btn-ghost btn-sm" type="button" @click="copiarClave">{{ copiado ? 'Copiada' : 'Copiar' }}</button>
        </dd>
        <dt>Acceso a</dt>
        <dd>
          <span v-for="r in creado.roles" :key="r.rolId" class="badge badge-ok chip">{{ nombreRol(r.rolId) }}</span>
        </dd>
      </dl>
      <p class="nota">
        Entregue la clave a la persona por un canal seguro. <strong>No se volverá a mostrar</strong> (el sistema solo guarda una versión
        encriptada). En su primer ingreso la persona verá un código QR para activar la verificación en 2 pasos con su celular.
      </p>
      <button class="btn btn-primary" type="button" @click="otro">Crear otro usuario</button>
    </section>

    <form v-else class="card formulario" novalidate @submit.prevent="enviar">
      <p class="ayuda">
        Cree la cuenta de una persona y elija a qué aplicaciones podrá entrar. Toda creación queda registrada en los logs de acceso.
      </p>

      <div class="field">
        <label for="nombre">Nombre completo</label>
        <input id="nombre" v-model="form.nombre" type="text" maxlength="100" autocomplete="off" placeholder="Ej.: Ana Pérez" />
        <span v-if="errores.nombre" class="hint-error" role="alert">{{ errores.nombre }}</span>
      </div>

      <div class="field">
        <label for="correo">Correo corporativo</label>
        <input id="correo" v-model="form.correo" type="email" maxlength="100" autocomplete="off" :placeholder="'nombre@' + DOMINIO_CORREO" />
        <span v-if="errores.correo" class="hint-error" role="alert">{{ errores.correo }}</span>
      </div>

      <div class="field">
        <label for="password">Clave inicial</label>
        <div class="clave-fila">
          <input id="password" v-model="form.password" :type="verClave ? 'text' : 'password'" autocomplete="new-password" placeholder="Mínimo 8, con letras y números" />
          <button class="btn btn-ghost btn-sm" type="button" @click="verClave = !verClave">{{ verClave ? 'Ocultar' : 'Ver' }}</button>
          <button class="btn btn-ghost btn-sm" type="button" @click="generar">Generar</button>
        </div>
        <span v-if="errores.password" class="hint-error" role="alert">{{ errores.password }}</span>
      </div>

      <fieldset class="field roles">
        <legend>Aplicaciones a las que podrá entrar</legend>
        <p v-if="cargandoRoles" class="vacio">Cargando roles…</p>
        <div v-for="g in grupos" :key="g.app.codigo" class="grupo">
          <label v-for="r in g.roles" :key="r.rolId" class="opcion">
            <input v-model="form.rolIds" type="checkbox" :value="r.rolId" />
            <span><strong>{{ g.app.nombre }}</strong> <span class="rol">{{ r.rol.nombre }}</span></span>
          </label>
        </div>
        <span v-if="errores.roles" class="hint-error" role="alert">{{ errores.roles }}</span>
      </fieldset>

      <p v-if="errorServidor" class="seg-error" role="alert">{{ errorServidor }}</p>

      <div class="acciones">
        <button class="btn btn-primary" type="submit" :disabled="enviando || cargandoRoles">{{ enviando ? 'Creando…' : 'Crear usuario' }}</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { centralApi } from '../../api/central';
import { DOMINIO_CORREO } from '../../config';
import { agruparRolesPorApp, generarClave, validarFormulario } from '../../utils/usuarios';
import { mensajeDeError } from '../../utils/errores';
import './seguridad.css';

const vacio = () => ({ nombre: '', correo: '', password: '', rolIds: [] });
const form = reactive(vacio());
const errores = ref({});
const errorServidor = ref('');
const enviando = ref(false);
const verClave = ref(false);
const roles = ref([]);
const cargandoRoles = ref(true);
const creado = ref(null);
const claveEntregada = ref('');
const copiado = ref(false);

const grupos = computed(() => agruparRolesPorApp(roles.value));
const nombreRol = (rolId) => {
  const r = roles.value.find((x) => x.rolId === rolId);
  return r ? `${r.aplicacion.nombre} · ${r.rol.nombre}` : `Rol ${rolId}`;
};

function generar() {
  form.password = generarClave();
  verClave.value = true; // para que quien crea la cuenta pueda verla y entregarla
}

async function enviar() {
  errorServidor.value = '';
  const v = validarFormulario(form, DOMINIO_CORREO);
  errores.value = v.errores;
  if (!v.ok) return;

  enviando.value = true;
  try {
    const { data } = await centralApi.crearUsuario({
      nombre: form.nombre, correo: form.correo, password: form.password, rolIds: [...form.rolIds]
    });
    creado.value = data.data;
    claveEntregada.value = form.password;
    // La clave solo se conserva para mostrarla esta vez; el formulario se limpia
    Object.assign(form, vacio());
  } catch (err) {
    errorServidor.value = mensajeDeError(err, 'No se pudo crear el usuario.');
  } finally {
    enviando.value = false;
  }
}

async function copiarClave() {
  try {
    await navigator.clipboard.writeText(claveEntregada.value);
    copiado.value = true;
    setTimeout(() => { copiado.value = false; }, 2000);
  } catch { /* el navegador no dejó copiar: la clave sigue a la vista para copiarla a mano */ }
}

function otro() {
  creado.value = null;
  claveEntregada.value = ''; // se descarta de la memoria de la pantalla
  errores.value = {};
  errorServidor.value = '';
  verClave.value = false;
}

onMounted(async () => {
  try {
    const { data } = await centralApi.accesos();
    roles.value = data.data.roles;
  } catch (err) {
    errorServidor.value = mensajeDeError(err, 'No se pudo cargar la lista de roles.');
  } finally {
    cargandoRoles.value = false;
  }
});
</script>

<style scoped>
.pagina { max-width: 640px; }
.formulario, .exito { padding: 1.4rem 1.5rem; }
.ayuda { margin: 0 0 1.2rem; font-size: .88rem; color: var(--color-ink-soft); line-height: 1.45; }
.field { display: flex; flex-direction: column; gap: .35rem; margin-bottom: 1rem; border: 0; padding: 0; }
.field legend { padding: 0; margin-bottom: .4rem; font-size: .78rem; font-weight: 600; color: var(--color-ink-soft); text-transform: uppercase; letter-spacing: .04em; }
.clave-fila { display: flex; gap: .5rem; align-items: center; }
.clave-fila input { flex: 1; min-width: 0; }
.roles .grupo { display: flex; flex-direction: column; }
.opcion { display: flex; align-items: center; gap: .6rem; padding: .5rem .2rem; border-top: 1px solid var(--color-border); cursor: pointer; font-size: .92rem; }
.opcion input { width: 1.05rem; height: 1.05rem; }
.rol { color: var(--color-ink-soft); font-size: .84rem; margin-left: .3rem; }
.vacio { color: var(--color-ink-soft); margin: 0; font-size: .88rem; }
.acciones { display: flex; justify-content: flex-end; margin-top: 1.2rem; }
.exito h3 { margin-bottom: 1rem; }
.exito dl { display: grid; grid-template-columns: 120px 1fr; gap: .6rem 1rem; margin: 0 0 1rem; align-items: center; }
.exito dt { font-size: .78rem; font-weight: 600; color: var(--color-ink-soft); text-transform: uppercase; letter-spacing: .04em; }
.exito dd { margin: 0; }
.clave-valor { background: var(--color-surface-dimmed); padding: .35rem .6rem; border-radius: var(--radius-sm); font-size: .95rem; user-select: all; }
.chip { margin-right: .4rem; }
.nota { background: #FBEEDA; color: #93610E; border-radius: var(--radius-sm); padding: .7rem .9rem; font-size: .86rem; line-height: 1.45; margin: 0 0 1.2rem; }
</style>

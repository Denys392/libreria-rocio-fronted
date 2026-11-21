<template>
  <div class="pagina">
    <form class="card formulario" novalidate @submit.prevent="enviar">
      <p class="ayuda">Registre a un cliente. El documento no se podrá cambiar después, porque las ventas ya emitidas lo usan.</p>

      <div class="fila">
        <div class="field">
          <label for="tipo">Tipo de documento</label>
          <select id="tipo" v-model="form.tipoDocumento">
            <option v-for="t in TIPOS_DOCUMENTO" :key="t.valor" :value="t.valor">{{ t.texto }}</option>
          </select>
          <span v-if="errores.tipoDocumento" class="hint-error" role="alert">{{ errores.tipoDocumento }}</span>
        </div>
        <div class="field grande">
          <label for="num">Número de documento</label>
          <input id="num" v-model.trim="form.numeroDocumento" maxlength="12" autocomplete="off" />
          <span v-if="errores.numeroDocumento" class="hint-error" role="alert">{{ errores.numeroDocumento }}</span>
        </div>
      </div>

      <div class="field"><label for="nom">Nombre o razón social</label><input id="nom" v-model="form.razonSocial" maxlength="150" autocomplete="off" /><span v-if="errores.razonSocial" class="hint-error" role="alert">{{ errores.razonSocial }}</span></div>
      <div class="field"><label for="tel">Teléfono (opcional)</label><input id="tel" v-model="form.telefono" maxlength="20" autocomplete="off" /><span v-if="errores.telefono" class="hint-error" role="alert">{{ errores.telefono }}</span></div>
      <div class="field"><label for="mail">Correo (opcional)</label><input id="mail" v-model="form.email" type="email" maxlength="100" autocomplete="off" /><span v-if="errores.email" class="hint-error" role="alert">{{ errores.email }}</span></div>
      <div class="field"><label for="dir">Dirección (opcional)</label><input id="dir" v-model="form.direccion" maxlength="200" autocomplete="off" /><span v-if="errores.direccion" class="hint-error" role="alert">{{ errores.direccion }}</span></div>

      <p v-if="errorServidor" class="seg-error" role="alert">{{ errorServidor }}</p>

      <div class="acciones">
        <RouterLink class="btn btn-ghost" to="/clientes">Cancelar</RouterLink>
        <button class="btn btn-primary" type="submit" :disabled="enviando">{{ enviando ? 'Guardando…' : 'Registrar cliente' }}</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { clientesApi } from '../../api/clientes';
import { TIPOS_DOCUMENTO, validarCliente } from '../../utils/clientes';
import { mensajeDeError } from '../../utils/errores';
import { useNotificationStore } from '../../store/notifications';
import '../seguridad/seguridad.css';

const router = useRouter();
const notify = useNotificationStore();
const form = reactive({ tipoDocumento: 'DNI', numeroDocumento: '', razonSocial: '', telefono: '', email: '', direccion: '' });
const errores = ref({});
const errorServidor = ref('');
const enviando = ref(false);

async function enviar() {
  errorServidor.value = '';
  const v = validarCliente(form);
  errores.value = v.errores;
  if (!v.ok) return;
  enviando.value = true;
  try {
    await clientesApi.crear({ ...form });
    notify.success('Cliente registrado.');
    router.push('/clientes');
  } catch (err) {
    errorServidor.value = mensajeDeError(err, 'No se pudo registrar el cliente.');
  } finally { enviando.value = false; }
}
</script>

<style scoped>
.pagina { max-width: 640px; }
.formulario { padding: 1.4rem 1.5rem; }
.ayuda { margin: 0 0 1.2rem; font-size: .88rem; color: var(--color-ink-soft); line-height: 1.45; }
.fila { display: flex; gap: .8rem; }
.field { display: flex; flex-direction: column; gap: .3rem; margin-bottom: 1rem; }
.field.grande { flex: 1; }
.hint-error { color: var(--color-wine); font-size: .82rem; }
.acciones { display: flex; justify-content: flex-end; gap: .6rem; margin-top: 1rem; }
</style>

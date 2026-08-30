<template>
  <div class="auth-screen">
    <div class="auth-panel">
      <h1 class="auth-heading">Recuperar contraseña</h1>

      <template v-if="!mostrarReset">
        <p class="auth-lead">Ingresa tu correo y te enviaremos instrucciones para restablecer tu contraseña.</p>
        <form @submit.prevent="solicitar">
          <div class="field">
            <label for="email">Correo electrónico</label>
            <input id="email" v-model.trim="email" type="email" required />
          </div>
          <button class="btn btn-primary" type="submit" style="width:100%;" :disabled="cargando">
            {{ cargando ? 'Enviando…' : 'Enviar instrucciones' }}
          </button>
        </form>
      </template>

      <template v-else>
        <p class="auth-lead">Pega el token recibido y define tu nueva contraseña.</p>
        <form @submit.prevent="restablecer">
          <div class="field">
            <label for="token">Token</label>
            <input id="token" v-model.trim="token" required />
          </div>
          <div class="field">
            <label for="nuevoPassword">Nueva contraseña</label>
            <input id="nuevoPassword" v-model="nuevoPassword" type="password" minlength="6" required />
          </div>
          <button class="btn btn-primary" type="submit" style="width:100%;" :disabled="cargando">
            {{ cargando ? 'Guardando…' : 'Restablecer contraseña' }}
          </button>
        </form>
      </template>

      <div class="auth-links" style="justify-content:space-between;">
        <button class="link-btn" @click="mostrarReset = !mostrarReset">
          {{ mostrarReset ? 'Ya tengo un correo enviado' : 'Ya tengo un token' }}
        </button>
        <RouterLink to="/login">Volver a iniciar sesión</RouterLink>
      </div>
    </div>
    <div class="auth-side">
      <blockquote>“Cada libro devuelto a tiempo empieza con una buena contraseña.”</blockquote>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authApi } from '../../api/auth';
import { useNotificationStore } from '../../store/notifications';

const email = ref('');
const token = ref('');
const nuevoPassword = ref('');
const mostrarReset = ref(false);
const cargando = ref(false);
const notify = useNotificationStore();
const router = useRouter();

async function solicitar() {
  cargando.value = true;
  try {
    await authApi.solicitarReset(email.value);
    notify.success('Si el correo existe, se enviaron las instrucciones.');
    mostrarReset.value = true;
  } catch (err) {
    notify.error(err.response?.data?.message || 'No se pudo procesar la solicitud.');
  } finally {
    cargando.value = false;
  }
}

async function restablecer() {
  cargando.value = true;
  try {
    await authApi.resetPassword(token.value, nuevoPassword.value);
    notify.success('Contraseña restablecida. Ya puedes iniciar sesión.');
    router.push({ name: 'login' });
  } catch (err) {
    notify.error(err.response?.data?.message || 'Token inválido o expirado.');
  } finally {
    cargando.value = false;
  }
}
</script>

<style scoped>
.auth-screen { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; }
.auth-panel { display: flex; flex-direction: column; justify-content: center; padding: 3rem 4rem; background: var(--color-surface); }
.auth-heading { font-size: 2rem; margin-bottom: .3rem; }
.auth-lead { color: var(--color-ink-soft); margin: 0 0 1.6rem; }
.auth-links { display: flex; margin-top: 1.2rem; font-size: .85rem; align-items: center; }
.auth-links a, .link-btn { color: var(--color-forest); text-decoration: none; font-weight: 600; background: none; border: none; cursor: pointer; font-size: .85rem; padding: 0; }
.auth-links a:hover, .link-btn:hover { text-decoration: underline; }
.auth-side { background: linear-gradient(160deg, var(--color-forest-deep), var(--color-forest) 60%, #33502F); display: flex; align-items: center; justify-content: center; padding: 3rem; }
.auth-side blockquote { color: #F0EAD3; font-family: var(--font-display); font-size: 1.6rem; line-height: 1.4; max-width: 420px; margin: 0; font-weight: 500; }
@media (max-width: 860px) { .auth-screen { grid-template-columns: 1fr; } .auth-side { display: none; } .auth-panel { padding: 2.4rem 1.6rem; } }
</style>

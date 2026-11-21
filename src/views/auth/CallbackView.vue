<template>
  <div class="callback">
    <div class="callback-box">
      <div class="brand-mark">LR</div>

      <template v-if="!error">
        <h2>Ingresando…</h2>
        <p class="lead">Estamos validando su acceso con el sistema de seguridad.</p>
      </template>

      <template v-else>
        <h2>No se pudo completar el ingreso</h2>
        <p class="hint-error" role="alert">{{ error }}</p>
        <button class="btn btn-primary" type="button" @click="volver">Volver al inicio de sesión</button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../store/auth';
import { useNotificationStore } from '../../store/notifications';
import { APP_CODE, CENTRAL_URL } from '../../config';
import { extraerCodigo } from '../../utils/sesion';

// A esta pantalla llega el usuario desde el sistema central, con un código de UN solo uso:
//   /callback?codigo=...   (ya eligió su rol allá; este código es para esta aplicación)
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const notify = useNotificationStore();
const error = ref('');

function volver() {
  window.location.assign(CENTRAL_URL);
}

onMounted(async () => {
  const codigo = extraerCodigo(route.query);
  if (!codigo) {
    error.value = 'No llegó ningún código de acceso. Ingrese desde el sistema de seguridad.';
    return;
  }
  try {
    await auth.iniciarConCodigo(codigo, APP_CODE);
    await auth.cargarMenu();
    notify.success(`Bienvenido(a), ${auth.usuario?.nombre || ''}`);
    // replace: así el código ya usado no queda en el historial del navegador
    router.replace({ name: 'dashboard' });
  } catch (err) {
    error.value =
      (err.response && err.response.data && err.response.data.message) ||
      'No se pudo validar el acceso. Vuelva a ingresar desde el sistema de seguridad.';
  }
});
</script>

<style scoped>
.callback { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--color-bg); padding: 1.5rem; }
.callback-box { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: var(--shadow-card); padding: 2.4rem 2.2rem; max-width: 420px; width: 100%; text-align: center; display: flex; flex-direction: column; align-items: center; gap: .8rem; }
.brand-mark { width: 46px; height: 46px; border-radius: var(--radius-sm); background: var(--color-forest); color: var(--color-gold-soft); display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-weight: 700; }
h2 { font-size: 1.4rem; margin: .4rem 0 0; }
.lead { color: var(--color-ink-soft); margin: 0; }
.hint-error { color: var(--color-wine); background: var(--color-wine-soft); border-radius: var(--radius-sm); padding: .6rem .8rem; font-size: .88rem; margin: 0 0 .6rem; }
</style>

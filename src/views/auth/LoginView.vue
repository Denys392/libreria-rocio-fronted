<template>
  <div class="auth-screen">
    <div class="auth-panel">
      <div class="auth-brand">
        <div class="brand-mark">LR</div>
        <div>
          <p class="brand-title">Librería Rocío</p>
          <p class="brand-sub">Sistema de gestión interno</p>
        </div>
      </div>

      <h1 class="auth-heading">Iniciar sesión</h1>
      <p class="auth-lead">Ingresa tus credenciales para continuar.</p>

      <form @submit.prevent="onSubmit">
        <div class="field">
          <label for="email">Correo electrónico</label>
          <input id="email" v-model.trim="email" type="email" required autocomplete="username" placeholder="tucorreo@libreria.com" />
        </div>
        <div class="field">
          <label for="password">Contraseña</label>
          <input id="password" v-model="password" type="password" required autocomplete="current-password" placeholder="••••••••" />
        </div>

        <p v-if="error" class="hint-error" style="margin: -.4rem 0 1rem;">{{ error }}</p>

        <button class="btn btn-primary" type="submit" style="width:100%;" :disabled="cargando">
          {{ cargando ? 'Ingresando…' : 'Ingresar' }}
        </button>
      </form>

      <div class="auth-links">
        <RouterLink to="/recuperar-password">¿Olvidaste tu contraseña?</RouterLink>
        <RouterLink to="/registro">Crear una cuenta</RouterLink>
      </div>
    </div>

    <div class="auth-side">
      <blockquote>
        “Una librería es el único tipo de tienda donde el inventario nunca deja de tentar a quien lo cuida.”
      </blockquote>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../store/auth';
import { useNotificationStore } from '../../store/notifications';

const email = ref('');
const password = ref('');
const cargando = ref(false);
const error = ref('');

const auth = useAuthStore();
const notify = useNotificationStore();
const router = useRouter();
const route = useRoute();

async function onSubmit() {
  error.value = '';
  cargando.value = true;
  try {
    await auth.login(email.value, password.value);
    notify.success(`Bienvenido(a), ${auth.usuario?.nombre || ''}`);
    router.push(route.query.redirect || { name: 'dashboard' });
  } catch (err) {
    error.value = err.response?.data?.message || 'No se pudo iniciar sesión. Verifica tus datos.';
  } finally {
    cargando.value = false;
  }
}
</script>

<style scoped>
.auth-screen { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; }
.auth-panel { display: flex; flex-direction: column; justify-content: center; padding: 3rem 4rem; background: var(--color-surface); }
.auth-brand { display: flex; align-items: center; gap: .7rem; margin-bottom: 2.2rem; }
.brand-mark { width: 42px; height: 42px; border-radius: var(--radius-sm); background: var(--color-forest); color: var(--color-gold-soft); display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-weight: 700; }
.brand-title { margin: 0; font-family: var(--font-display); font-size: 1.05rem; color: var(--color-forest-deep); }
.brand-sub { margin: 0; font-size: .78rem; color: var(--color-ink-soft); }
.auth-heading { font-size: 2rem; margin-bottom: .3rem; }
.auth-lead { color: var(--color-ink-soft); margin: 0 0 1.6rem; }
.auth-links { display: flex; justify-content: space-between; margin-top: 1.2rem; font-size: .85rem; }
.auth-links a { color: var(--color-forest); text-decoration: none; font-weight: 600; }
.auth-links a:hover { text-decoration: underline; }

.auth-side {
  background: linear-gradient(160deg, var(--color-forest-deep), var(--color-forest) 60%, #33502F);
  display: flex; align-items: center; justify-content: center; padding: 3rem;
  position: relative; overflow: hidden;
}
.auth-side::before {
  content: ''; position: absolute; inset: 0; opacity: .12;
  background-image: repeating-linear-gradient(90deg, #F6F1E1 0 2px, transparent 2px 46px);
}
.auth-side blockquote {
  color: #F0EAD3; font-family: var(--font-display); font-size: 1.6rem; line-height: 1.4; max-width: 420px;
  margin: 0; position: relative; z-index: 1; font-weight: 500;
}

@media (max-width: 860px) {
  .auth-screen { grid-template-columns: 1fr; }
  .auth-side { display: none; }
  .auth-panel { padding: 2.4rem 1.6rem; }
}
</style>

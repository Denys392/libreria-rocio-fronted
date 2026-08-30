<template>
  <div class="auth-screen">
    <div class="auth-panel">
      <h1 class="auth-heading">Crear cuenta</h1>
      <p class="auth-lead">Regístrate para acceder al sistema. Un administrador podrá ajustar tu rol luego.</p>

      <form @submit.prevent="onSubmit">
        <div class="field">
          <label for="nombre">Nombre completo</label>
          <input id="nombre" v-model.trim="form.nombre" required placeholder="Rocío Fernández" />
        </div>
        <div class="field">
          <label for="email">Correo electrónico</label>
          <input id="email" v-model.trim="form.email" type="email" required placeholder="tucorreo@libreria.com" />
        </div>
        <div class="field">
          <label for="password">Contraseña</label>
          <input id="password" v-model="form.password" type="password" minlength="6" required placeholder="Mínimo 6 caracteres" />
        </div>
        <div class="field">
          <label for="rol">Rol</label>
          <select id="rol" v-model="form.rolId" required>
            <option value="" disabled>Selecciona un rol</option>
            <option v-for="r in roles" :key="r.rol_id" :value="r.rol_id">{{ r.nombre }}</option>
          </select>
        </div>

        <p v-if="error" class="hint-error" style="margin: -.4rem 0 1rem;">{{ error }}</p>

        <button class="btn btn-primary" type="submit" style="width:100%;" :disabled="cargando">
          {{ cargando ? 'Creando cuenta…' : 'Crear cuenta' }}
        </button>
      </form>

      <div class="auth-links" style="justify-content:center;">
        <RouterLink to="/login">Ya tengo una cuenta</RouterLink>
      </div>
    </div>

    <div class="auth-side">
      <blockquote>“Cada nuevo usuario suma otro par de manos cuidando los mismos estantes.”</blockquote>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { authApi } from '../../api/auth';
import http from '../../api/http';
import { useNotificationStore } from '../../store/notifications';

const form = reactive({ nombre: '', email: '', password: '', rolId: '' });
const roles = ref([]);
const cargando = ref(false);
const error = ref('');
const router = useRouter();
const notify = useNotificationStore();

// Los roles requieren estar autenticado en el backend; como fallback usamos IDs conocidos del seed.
onMounted(async () => {
  try {
    const { data } = await http.get('/usuarios/roles');
    roles.value = data.data;
  } catch {
    roles.value = [
      { rol_id: 1, nombre: 'ADMIN' },
      { rol_id: 2, nombre: 'VENDEDOR' },
      { rol_id: 3, nombre: 'ALMACENERO' }
    ];
  }
});

async function onSubmit() {
  error.value = '';
  cargando.value = true;
  try {
    await authApi.registro(form);
    notify.success('Cuenta creada correctamente. Ahora puedes iniciar sesión.');
    router.push({ name: 'login' });
  } catch (err) {
    error.value = err.response?.data?.message || 'No se pudo crear la cuenta.';
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
.auth-links { display: flex; margin-top: 1.2rem; font-size: .85rem; }
.auth-links a { color: var(--color-forest); text-decoration: none; font-weight: 600; }
.auth-links a:hover { text-decoration: underline; }
.auth-side { background: linear-gradient(160deg, var(--color-forest-deep), var(--color-forest) 60%, #33502F); display: flex; align-items: center; justify-content: center; padding: 3rem; }
.auth-side blockquote { color: #F0EAD3; font-family: var(--font-display); font-size: 1.6rem; line-height: 1.4; max-width: 420px; margin: 0; font-weight: 500; }
@media (max-width: 860px) { .auth-screen { grid-template-columns: 1fr; } .auth-side { display: none; } .auth-panel { padding: 2.4rem 1.6rem; } }
</style>

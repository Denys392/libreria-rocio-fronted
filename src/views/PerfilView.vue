<template>
  <div class="perfil-grid">
    <section class="card" style="padding: 1.4rem 1.6rem;">
      <h3 style="margin-bottom: 1rem;">Mis datos</h3>
      <dl class="dl">
        <dt>Nombre</dt><dd>{{ auth.usuario?.nombre }}</dd>
        <dt>Correo</dt><dd>{{ auth.usuario?.email }}</dd>
        <dt>Rol</dt><dd><span class="badge badge-ok">{{ auth.rol }}</span></dd>
        <dt>Estado</dt><dd>{{ auth.usuario?.estado === 0 ? 'Inactivo' : 'Activo' }}</dd>
      </dl>
    </section>

    <section class="card" style="padding: 1.4rem 1.6rem;">
      <h3 style="margin-bottom: 1rem;">Cambiar contraseña</h3>
      <form @submit.prevent="onSubmit">
        <div class="field">
          <label for="actual">Contraseña actual</label>
          <input id="actual" v-model="form.passwordActual" type="password" required />
        </div>
        <div class="field">
          <label for="nueva">Nueva contraseña</label>
          <input id="nueva" v-model="form.passwordNuevo" type="password" minlength="6" required />
        </div>
        <button class="btn btn-primary" type="submit" :disabled="cargando">
          {{ cargando ? 'Guardando…' : 'Actualizar contraseña' }}
        </button>
      </form>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useAuthStore } from '../store/auth';
import { usuariosApi } from '../api/usuarios';
import { useNotificationStore } from '../store/notifications';

const auth = useAuthStore();
const notify = useNotificationStore();
const form = reactive({ passwordActual: '', passwordNuevo: '' });
const cargando = ref(false);

async function onSubmit() {
  cargando.value = true;
  try {
    await usuariosApi.cambiarPassword(form);
    notify.success('Contraseña actualizada correctamente');
    form.passwordActual = '';
    form.passwordNuevo = '';
  } catch (err) {
    notify.error(err.response?.data?.message || 'No se pudo actualizar la contraseña');
  } finally {
    cargando.value = false;
  }
}
</script>

<style scoped>
.perfil-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem; align-items: start; }
.dl { display: grid; grid-template-columns: auto 1fr; gap: .5rem 1rem; margin: 0; }
.dl dt { color: var(--color-ink-soft); font-size: .82rem; font-weight: 600; }
.dl dd { margin: 0; }
@media (max-width: 780px) { .perfil-grid { grid-template-columns: 1fr; } }
</style>

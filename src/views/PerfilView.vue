<template>
  <div class="perfil-grid">
    <section class="card" style="padding: 1.4rem 1.6rem;">
      <h3 style="margin-bottom: 1rem;">Mis datos</h3>
      <dl class="dl">
        <dt>Nombre</dt><dd>{{ auth.usuario?.nombre }}</dd>
        <dt>Correo</dt><dd>{{ auth.usuario?.correo }}</dd>
        <dt>Aplicación</dt><dd>{{ auth.aplicacion?.nombre }}</dd>
        <dt>Rol</dt><dd><span class="badge badge-ok">{{ auth.rol }}</span></dd>
      </dl>
    </section>

    <section class="card" style="padding: 1.4rem 1.6rem;">
      <h3 style="margin-bottom: 1rem;">Seguridad de la cuenta</h3>
      <p style="margin: 0; color: var(--color-ink-soft); line-height: 1.5;">
        Su clave y su verificación en 2 pasos se administran en el sistema de seguridad.
        Para cambiar de rol, cierre sesión e ingrese de nuevo.
      </p>
    </section>
  </div>
</template>

<script setup>
import { useAuthStore } from '../store/auth';

const auth = useAuthStore();
</script>

<style scoped>
.perfil-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem; align-items: start; }
.dl { display: grid; grid-template-columns: auto 1fr; gap: .5rem 1rem; margin: 0; }
.dl dt { color: var(--color-ink-soft); font-size: .82rem; font-weight: 600; }
.dl dd { margin: 0; }
@media (max-width: 780px) { .perfil-grid { grid-template-columns: 1fr; } }
</style>

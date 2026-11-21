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

      <h1 class="auth-heading">Acceso al sistema</h1>
      <p class="auth-lead">
        El ingreso se hace con su correo corporativo en el sistema de seguridad,
        con verificación en 2 pasos. Allí elegirá el rol con el que desea entrar.
      </p>

      <p v-if="avisoSesion" class="aviso" role="status">Su sesión terminó. Ingrese de nuevo para continuar.</p>

      <button class="btn btn-primary" type="button" style="width: 100%;" @click="irAlCentral">
        Ingresar con el sistema de seguridad
      </button>
    </div>

    <div class="auth-side">
      <blockquote>
        “Una librería es el único tipo de tienda donde el inventario nunca deja de tentar a quien lo cuida.”
      </blockquote>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { CENTRAL_URL } from '../../config';

const route = useRoute();
const avisoSesion = computed(() => route.query.motivo === 'sesion');

// El login ya no es un formulario: la clave y el 2FA los maneja el sistema de seguridad central
function irAlCentral() {
  window.location.assign(CENTRAL_URL);
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
.auth-lead { color: var(--color-ink-soft); margin: 0 0 1.6rem; line-height: 1.5; }
.aviso { background: #FBEEDA; color: #93610E; border-radius: var(--radius-sm); padding: .6rem .8rem; font-size: .88rem; margin: 0 0 1.2rem; }

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

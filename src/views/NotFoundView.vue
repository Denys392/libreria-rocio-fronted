<template>
  <div class="notfound">
    <p class="notfound-code">404</p>
    <h1>Esta página se extravió entre los estantes</h1>
    <p>No encontramos lo que buscabas.</p>
    <RouterLink class="btn btn-primary" to="/">Volver al panel</RouterLink>
  </div>
</template>

<style scoped>
.notfound { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: .6rem; padding: 2rem; background: var(--color-bg); }
.notfound-code { font-family: var(--font-display); font-size: 4.5rem; margin: 0; color: var(--color-gold); font-weight: 700; }
.notfound h1 { font-size: 1.4rem; max-width: 420px; }
.notfound p { color: var(--color-ink-soft); margin: 0 0 .8rem; }
</style>

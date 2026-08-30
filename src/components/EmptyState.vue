<template>
  <div class="empty-state">
    <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
      <path d="M4 19.5V6a2 2 0 0 1 2-2h9l5 5v10.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <path d="M15 4v5h5" />
      <path d="M9 13h6M9 17h4" />
    </svg>
    <p style="margin: .8rem 0 .2rem; font-weight: 600; color: var(--color-ink);">{{ titulo }}</p>
    <p style="margin: 0; font-size: .85rem;">{{ descripcion }}</p>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  titulo: { type: String, default: 'Nada por aquí todavía' },
  descripcion: { type: String, default: '' }
});
</script>

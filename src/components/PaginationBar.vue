<template>
  <div class="pager">
    <span class="pager-info">
      {{ total === 0 ? 0 : (page - 1) * limit + 1 }}–{{ Math.min(page * limit, total) }} de {{ total }}
    </span>
    <div class="pager-btns">
      <button class="btn btn-ghost btn-sm" :disabled="page <= 1" @click="$emit('update:page', page - 1)">‹ Anterior</button>
      <span class="pager-page">Página {{ page }} / {{ totalPaginas }}</span>
      <button class="btn btn-ghost btn-sm" :disabled="page >= totalPaginas" @click="$emit('update:page', page + 1)">Siguiente ›</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  page: { type: Number, required: true },
  limit: { type: Number, required: true },
  total: { type: Number, required: true }
});
defineEmits(['update:page']);

const totalPaginas = computed(() => Math.max(1, Math.ceil(props.total / props.limit)));
</script>

<style scoped>
.pager { display: flex; align-items: center; justify-content: space-between; padding: .9rem 1.1rem; font-size: .82rem; color: var(--color-ink-soft); flex-wrap: wrap; gap: .6rem; }
.pager-btns { display: flex; align-items: center; gap: .8rem; }
.pager-page { font-weight: 600; color: var(--color-ink); }
</style>

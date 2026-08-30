<template>
  <teleport to="body">
    <transition name="modal-fade">
      <div v-if="modelValue" class="modal-backdrop" @click.self="$emit('update:modelValue', false)">
        <div class="modal-box card" :style="{ maxWidth: width }">
          <header class="modal-head">
            <h3>{{ title }}</h3>
            <button class="modal-close" @click="$emit('update:modelValue', false)" aria-label="Cerrar">×</button>
          </header>
          <div class="modal-body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="modal-foot">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
  title: { type: String, default: '' },
  width: { type: String, default: '520px' }
});
defineEmits(['update:modelValue']);
</script>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(22,38,27,0.42); backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center; z-index: 900; padding: 1rem;
}
.modal-box { width: 100%; max-height: 88vh; display: flex; flex-direction: column; box-shadow: var(--shadow-pop); }
.modal-head { display: flex; align-items: center; justify-content: space-between; padding: 1.1rem 1.3rem; border-bottom: 1px solid var(--color-border); }
.modal-close { background: none; border: none; font-size: 1.4rem; line-height: 1; cursor: pointer; color: var(--color-ink-soft); padding: .2rem .4rem; }
.modal-close:hover { color: var(--color-wine); }
.modal-body { padding: 1.3rem; overflow-y: auto; }
.modal-foot { padding: 1rem 1.3rem; border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; gap: .6rem; }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity .16s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>

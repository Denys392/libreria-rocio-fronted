<template>
  <div class="toast-wrap">
    <transition-group name="toast-anim">
      <div v-for="t in store.items" :key="t.id" class="toast" :class="`toast-${t.type}`">
        {{ t.message }}
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useNotificationStore } from '../store/notifications';
const store = useNotificationStore();
</script>

<style scoped>
.toast-anim-enter-active, .toast-anim-leave-active { transition: all .22s ease; }
.toast-anim-enter-from { opacity: 0; transform: translateX(20px); }
.toast-anim-leave-to { opacity: 0; transform: translateX(20px); }
</style>

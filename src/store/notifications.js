import { defineStore } from 'pinia';

let nextId = 1;

export const useNotificationStore = defineStore('notifications', {
  state: () => ({ items: [] }),
  actions: {
    push(message, type = 'info', timeout = 3800) {
      const id = nextId++;
      this.items.push({ id, message, type });
      setTimeout(() => this.remove(id), timeout);
    },
    success(message) { this.push(message, 'success'); },
    error(message) { this.push(message, 'error'); },
    info(message) { this.push(message, 'info'); },
    remove(id) { this.items = this.items.filter((n) => n.id !== id); }
  }
});

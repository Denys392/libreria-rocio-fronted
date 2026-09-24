<template>
  <div class="shell">
    <aside class="sidebar" :class="{ open: menuAbierto }">
      <div class="brand">
        <div class="brand-mark">LR</div>
        <div>
          <p class="brand-title">Librería Rocío</p>
          <p class="brand-sub">Panel de gestión</p>
        </div>
      </div>

      <nav class="nav">
        <p class="nav-group">General</p>
        <RouterLink to="/" class="nav-link" exact-active-class="active" @click="menuAbierto = false">
          <IconDash /> Panel principal
        </RouterLink>

        <p class="nav-group">Catálogo</p>
        <RouterLink to="/productos" class="nav-link" active-class="active" @click="menuAbierto = false">
          <IconBox /> Productos
        </RouterLink>
        <RouterLink to="/productos/categorias" class="nav-link" active-class="active" @click="menuAbierto = false">
          <IconTag /> Categorías
        </RouterLink>
        <RouterLink to="/proveedores" class="nav-link" active-class="active" @click="menuAbierto = false">
          <IconPeople /> Proveedores / Clientes
        </RouterLink>

        <p class="nav-group">Operaciones</p>
        <RouterLink to="/compras" class="nav-link" active-class="active" @click="menuAbierto = false">
          <IconCart /> Compras
        </RouterLink>
        <RouterLink to="/ventas" class="nav-link" active-class="active" @click="menuAbierto = false">
          <IconReceipt /> Ventas
        </RouterLink>

        <template v-if="auth.esAdmin">
          <p class="nav-group">Administración</p>
          <RouterLink to="/usuarios" class="nav-link" active-class="active" @click="menuAbierto = false">
            <IconUser /> Usuarios
          </RouterLink>
          <RouterLink to="/auditoria" class="nav-link" active-class="active" @click="menuAbierto = false">
            <IconShield /> Auditoría
          </RouterLink>
          <RouterLink to="/scraping" class="nav-link" active-class="active" @click="menuAbierto = false">
            <IconShield /> Scraping
          </RouterLink>
          <RouterLink to="/scraping/comparaciones" class="nav-link" active-class="active"
            @click="menuAbierto = false">
            <IconTag /> Comparación de precios
          </RouterLink>
          <RouterLink to="/integraciones" class="nav-link" active-class="active" @click="menuAbierto = false">
            <IconShield /> API pública
          </RouterLink>
        </template>
      </nav>

      <div class="sidebar-foot">
        <RouterLink to="/perfil" class="user-chip" @click="menuAbierto = false">
          <span class="avatar">{{ iniciales }}</span>
          <span class="user-info">
            <strong>{{ auth.usuario?.nombre }}</strong>
            <small>{{ auth.rol }}</small>
          </span>
        </RouterLink>
        <button class="btn btn-ghost btn-sm" style="width:100%; margin-top:.6rem;" @click="cerrarSesion">Cerrar
          sesión</button>
      </div>
    </aside>

    <div class="backdrop" v-if="menuAbierto" @click="menuAbierto = false"></div>

    <div class="main">
      <header class="topbar">
        <button class="hamburger" @click="menuAbierto = !menuAbierto" aria-label="Menú">☰</button>
        <h2 class="page-title">{{ tituloPagina }}</h2>
        <div class="topbar-spacer"></div>
      </header>

      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import {
  IconDash, IconBox, IconTag, IconPeople, IconCart, IconReceipt, IconUser, IconShield
} from '../components/icons';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const menuAbierto = ref(false);

const iniciales = computed(() => {
  const nombre = auth.usuario?.nombre || '?';
  return nombre.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
});

const titulos = {
  dashboard: 'Panel principal',
  perfil: 'Mi perfil',
  usuarios: 'Usuarios',
  productos: 'Productos',
  categorias: 'Categorías',
  proveedores: 'Proveedores y clientes',
  compras: 'Histórico de compras',
  'compras-nueva': 'Registrar compra',
  'compras-detalle': 'Detalle de compra',
  ventas: 'Histórico de ventas',
  'ventas-nueva': 'Registrar venta',
  'ventas-detalle': 'Detalle de venta',
  auditoria: 'Auditoría del sistema',
  scraping: 'Scraping',
  'scraping-comparaciones': 'Comparación de precios',
  'scraping-detalle': 'Detalle del job de scraping',
  integraciones: 'API pública'
};
const tituloPagina = computed(() => titulos[route.name] || 'Librería Rocío');

function cerrarSesion() {
  auth.logout();
  router.push({ name: 'login' });
}
</script>

<style scoped>
.shell {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 260px;
  flex-shrink: 0;
  background: var(--color-forest-deep);
  color: #EDE7D4;
  display: flex;
  flex-direction: column;
  padding: 1.3rem 1rem;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.brand {
  display: flex;
  align-items: center;
  gap: .7rem;
  padding: .3rem .3rem 1.2rem;
  border-bottom: 1px solid rgba(237, 231, 212, 0.12);
  margin-bottom: 1rem;
}

.brand-mark {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  background: var(--color-gold);
  color: #241800;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1rem;
}

.brand-title {
  font-family: var(--font-display);
  font-size: 1rem;
  margin: 0;
}

.brand-sub {
  margin: 0;
  font-size: .72rem;
  color: #B9AF8F;
}

.nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: .15rem;
}

.nav-group {
  font-size: .68rem;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: #9C9377;
  margin: .9rem .5rem .35rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: .65rem;
  padding: .55rem .7rem;
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: #E4DEC7;
  font-size: .875rem;
  font-weight: 500;
  transition: background .12s ease;
}

.nav-link:hover {
  background: rgba(237, 231, 212, 0.08);
}

.nav-link.active {
  background: var(--color-gold);
  color: #241800;
  font-weight: 700;
}

.nav-link svg {
  flex-shrink: 0;
}

.sidebar-foot {
  border-top: 1px solid rgba(237, 231, 212, 0.12);
  padding-top: 1rem;
  margin-top: .8rem;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: .6rem;
  text-decoration: none;
  color: inherit;
  padding: .3rem;
  border-radius: var(--radius-sm);
}

.user-chip:hover {
  background: rgba(237, 231, 212, 0.08);
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #3A5240;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .78rem;
  font-weight: 700;
}

.user-info {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.user-info strong {
  font-size: .84rem;
}

.user-info small {
  color: #B9AF8F;
  font-size: .72rem;
}

.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  align-items: center;
  gap: .8rem;
  padding: 1rem 1.6rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  position: sticky;
  top: 0;
  z-index: 20;
}

.page-title {
  font-size: 1.15rem;
}

.topbar-spacer {
  flex: 1;
}

.hamburger {
  display: none;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--color-forest);
}

.content {
  padding: 1.6rem;
  flex: 1;
}

.backdrop {
  display: none;
}

@media (max-width: 920px) {
  .sidebar {
    position: fixed;
    z-index: 40;
    transform: translateX(-100%);
    transition: transform .2s ease;
    box-shadow: var(--shadow-pop);
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .hamburger {
    display: block;
  }

  .backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(22, 38, 27, 0.4);
    z-index: 30;
  }

  .content {
    padding: 1.1rem;
  }
}
</style>
<template>
  <div>
    <div class="toolbar card">
      <input v-model="filtros.busqueda" class="search-input" placeholder="Buscar usuarios…" @keyup.enter="cargar" />
      <select v-model="filtros.estado" @change="cargar">
        <option value="">Todos los estados</option>
        <option value="1">Activos</option>
        <option value="0">Inactivos</option>
      </select>
      <div class="spacer"></div>
      <button class="btn btn-gold" @click="abrirCrear">+ Nuevo usuario</button>
    </div>

    <section class="card">
      <table>
        <thead>
          <tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Verificado</th><th></th></tr>
        </thead>
        <tbody v-if="cargando">
          <tr v-for="n in 4" :key="n" class="skeleton-row"><td colspan="6"><div class="skeleton-bar"></div></td></tr>
        </tbody>
        <tbody v-else-if="usuarios.length">
          <tr v-for="u in usuarios" :key="u.usuario_id">
            <td>{{ u.nombre }}</td>
            <td>{{ u.email }}</td>
            <td><span class="badge badge-ok">{{ u.rol_nombre }}</span></td>
            <td><span class="badge" :class="u.estado ? 'badge-ok' : 'badge-off'">{{ u.estado ? 'Activo' : 'Inactivo' }}</span></td>
            <td>{{ u.email_verificado ? 'Sí' : 'No' }}</td>
            <td style="text-align:right;">
              <button class="btn btn-ghost btn-sm" @click="abrirEditar(u)">Editar</button>
              <button v-if="u.estado" class="btn btn-danger btn-sm" @click="desactivar(u)">Desactivar</button>
            </td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-if="!cargando && usuarios.length === 0" titulo="No hay usuarios" descripcion="Crea el primer usuario del sistema." />
      <PaginationBar v-model:page="filtros.page" :limit="filtros.limit" :total="total" @update:page="cargar" />
    </section>

    <ModalDialog v-model="modalAbierto" :title="editando ? 'Editar usuario' : 'Nuevo usuario'">
      <form id="form-usuario" @submit.prevent="guardar">
        <div class="field">
          <label>Nombre</label>
          <input v-model.trim="form.nombre" required />
        </div>
        <div class="field">
          <label>Correo</label>
          <input v-model.trim="form.email" type="email" required />
        </div>
        <div class="field" v-if="!editando">
          <label>Contraseña</label>
          <input v-model="form.password" type="password" minlength="6" required />
        </div>
        <div class="field">
          <label>Rol</label>
          <select v-model="form.rolId" required>
            <option value="" disabled>Selecciona un rol</option>
            <option v-for="r in roles" :key="r.rol_id" :value="r.rol_id">{{ r.nombre }}</option>
          </select>
        </div>
        <div class="field" v-if="editando">
          <label>Estado</label>
          <select v-model="form.estado">
            <option :value="1">Activo</option>
            <option :value="0">Inactivo</option>
          </select>
        </div>
      </form>
      <template #footer>
        <button class="btn btn-ghost" @click="modalAbierto = false">Cancelar</button>
        <button class="btn btn-primary" form="form-usuario" type="submit" :disabled="guardando">
          {{ guardando ? 'Guardando…' : 'Guardar' }}
        </button>
      </template>
    </ModalDialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { usuariosApi } from '../../api/usuarios';
import { useNotificationStore } from '../../store/notifications';
import ModalDialog from '../../components/ModalDialog.vue';
import PaginationBar from '../../components/PaginationBar.vue';
import EmptyState from '../../components/EmptyState.vue';

const notify = useNotificationStore();
const usuarios = ref([]);
const roles = ref([]);
const total = ref(0);
const cargando = ref(true);
const guardando = ref(false);
const modalAbierto = ref(false);
const editando = ref(null);

const filtros = reactive({ page: 1, limit: 10, estado: '', busqueda: '' });
const form = reactive({ nombre: '', email: '', password: '', rolId: '', estado: 1 });

async function cargar() {
  cargando.value = true;
  try {
    const { data } = await usuariosApi.listar(filtros);
    usuarios.value = data.data.rows;
    total.value = data.data.total;
  } catch (err) {
    notify.error('No se pudieron cargar los usuarios');
  } finally {
    cargando.value = false;
  }
}

async function cargarRoles() {
  const { data } = await usuariosApi.roles();
  roles.value = data.data;
}

function abrirCrear() {
  editando.value = null;
  Object.assign(form, { nombre: '', email: '', password: '', rolId: '', estado: 1 });
  modalAbierto.value = true;
}

function abrirEditar(u) {
  editando.value = u;
  Object.assign(form, { nombre: u.nombre, email: u.email, password: '', rolId: u.rol_id, estado: u.estado });
  modalAbierto.value = true;
}

async function guardar() {
  guardando.value = true;
  try {
    if (editando.value) {
      await usuariosApi.actualizar(editando.value.usuario_id, {
        nombre: form.nombre, email: form.email, rolId: form.rolId, estado: form.estado
      });
      notify.success('Usuario actualizado correctamente');
    } else {
      await usuariosApi.crear(form);
      notify.success('Usuario creado correctamente');
    }
    modalAbierto.value = false;
    cargar();
  } catch (err) {
    notify.error(err.response?.data?.message || 'No se pudo guardar el usuario');
  } finally {
    guardando.value = false;
  }
}

async function desactivar(u) {
  if (!confirm(`¿Desactivar al usuario "${u.nombre}"?`)) return;
  try {
    await usuariosApi.eliminar(u.usuario_id);
    notify.success('Usuario desactivado');
    cargar();
  } catch (err) {
    notify.error(err.response?.data?.message || 'No se pudo desactivar');
  }
}

onMounted(() => { cargar(); cargarRoles(); });
</script>

<style scoped>
.toolbar { display: flex; align-items: center; gap: .7rem; padding: .9rem 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
.search-input { padding: .55rem .8rem; border: 1px solid var(--color-border-strong); border-radius: var(--radius-sm); min-width: 220px; background: var(--color-surface-raised); }
.toolbar select { padding: .55rem .7rem; border: 1px solid var(--color-border-strong); border-radius: var(--radius-sm); background: var(--color-surface-raised); }
.spacer { flex: 1; }
</style>

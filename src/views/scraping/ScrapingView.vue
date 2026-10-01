<template>
    <div>
        <div class="toolbar card">
            <input v-model="form.target" placeholder="Sitio web (ej. TaiLoy, Plaza Vea)" />
            <input v-model="form.url" placeholder="URL de la categoría o catálogo" style="flex: 1; min-width: 260px;" />
            <button class="btn btn-gold" :disabled="cargandoForm" @click="iniciarScraping">
                {{ cargandoForm ? 'Iniciando…' : '+ Ejecutar scraping' }}
            </button>
            <RouterLink to="/scraping/comparaciones" class="btn btn-ghost">Ver comparación de precios</RouterLink>
        </div>

        <div class="toolbar card">
            <div>
                <h3 style="margin: 0;">Fuentes de API externas</h3>
                <p class="subt">Para socios que exponen su propio catálogo en JSON (ej. Bazar Elena). Se
                    configuran una sola vez; luego solo hace falta darle a "Sincronizar ahora".</p>
            </div>
            <div class="spacer"></div>
            <button class="btn btn-gold" @click="abrirCrearFuente">+ Agregar fuente</button>
        </div>

        <section class="card" style="margin-bottom: 1rem;" v-if="!cargandoFuentes && fuentesExternas.length">
            <table>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>URL base</th>
                        <th>Estado</th>
                        <th>Última sincronización</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="f in fuentesExternas" :key="f.fuente_id">
                        <td>{{ f.nombre }}</td>
                        <td class="mono">{{ f.base_url }}</td>
                        <td><span class="badge" :class="f.activo ? 'badge-ok' : 'badge-off'">{{ f.activo ? 'Activa' :
                            'Desactivada' }}</span></td>
                        <td>{{ f.ultima_sincronizacion ? formatoFechaHora(f.ultima_sincronizacion) : 'Nunca' }}</td>
                        <td style="text-align:right; white-space: nowrap;">
                            <button class="btn btn-gold btn-sm" :disabled="sincronizandoId === f.fuente_id || !f.activo"
                                @click="sincronizar(f)">
                                {{ sincronizandoId === f.fuente_id ? 'Sincronizando…' : 'Sincronizar ahora' }}
                            </button>
                            <button class="btn btn-ghost btn-sm" @click="abrirEditarFuente(f)">Editar</button>
                            <button v-if="f.activo" class="btn btn-danger btn-sm" @click="cambiarEstadoFuente(f, false)">Desactivar</button>
                            <button v-else class="btn btn-ghost btn-sm" @click="cambiarEstadoFuente(f, true)">Activar</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </section>
        <EmptyState v-else-if="!cargandoFuentes" titulo="Sin fuentes configuradas"
            descripcion="Agrega una fuente (nombre, URL base y API key) para poder sincronizar su catálogo." />

        <!-- Modal: crear/editar fuente externa -->
        <ModalDialog v-model="modalFuenteAbierto" :title="fuenteEditando ? 'Editar fuente externa' : 'Nueva fuente externa'">
            <form id="form-fuente-externa" @submit.prevent="guardarFuente">
                <div class="field">
                    <label>Nombre de la fuente</label>
                    <input v-model.trim="formFuente.nombre" placeholder="Ej. Bazar Elena" required />
                </div>
                <div class="field">
                    <label>URL base de la API</label>
                    <input v-model.trim="formFuente.baseUrl"
                        placeholder="https://.../api/integracion/v1" required />
                </div>
                <div class="field">
                    <label>API Key {{ fuenteEditando ? '(déjalo vacío para no cambiarla)' : '' }}</label>
                    <input v-model.trim="formFuente.apiKey"
                        :placeholder="fuenteEditando ? '•••••••• (sin cambios)' : 'API key entregada por el socio'"
                        :required="!fuenteEditando" />
                </div>
            </form>
            <template #footer>
                <button class="btn btn-ghost" @click="modalFuenteAbierto = false">Cancelar</button>
                <button class="btn btn-primary" form="form-fuente-externa" type="submit" :disabled="guardandoFuente">
                    {{ guardandoFuente ? 'Guardando…' : 'Guardar' }}
                </button>
            </template>
        </ModalDialog>

        <div class="toolbar card" style="margin-top: 1.5rem;">
            <h3 style="margin: 0;">Historial de scraping</h3>
        </div>

        <div class="summary-bar card" v-if="!cargando">
            <div><span class="s-label">Jobs ejecutados</span><span class="s-value">{{ total }}</span></div>
            <div><span class="s-label">Productos capturados</span><span class="s-value">{{ sumaProductos }}</span></div>
        </div>

        <section class="card">
            <table>
                <thead>
                    <tr>
                        <th>Job</th>
                        <th>Estado</th>
                        <th>URLs</th>
                        <th>Productos</th>
                        <th>Inicio</th>
                        <th>Duración</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody v-if="cargando">
                    <tr v-for="n in 5" :key="n" class="skeleton-row">
                        <td colspan="7">
                            <div class="skeleton-bar"></div>
                        </td>
                    </tr>
                </tbody>
                <tbody v-else-if="historial.length">
                    <tr v-for="job in historial" :key="job.ejecucion_id">
                        <td class="mono">#{{ job.ejecucion_id }}</td>
                        <td>
                            <span class="badge" :class="badgeClase(job.estado)">{{ job.estado }}</span>
                        </td>
                        <td>{{ job.total_urls }}</td>
                        <td>{{ job.total_productos || 0 }}</td>
                        <td>{{ formatoFechaHora(job.fecha_inicio) }}</td>
                        <td>{{ formatoDuracion(job.fecha_inicio, job.fecha_fin) }}</td>
                        <td style="text-align:right;">
                            <RouterLink class="btn btn-ghost btn-sm" :to="`/scraping/${job.ejecucion_id}`">Ver detalle
                            </RouterLink>
                        </td>
                    </tr>
                </tbody>
            </table>
            <EmptyState v-if="!cargando && historial.length === 0" titulo="Aún no hay jobs de scraping"
                descripcion="Ejecuta una extracción con el formulario de arriba para comenzar." />
        </section>
    </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import {
    solicitarScraping, getHistorialScraping,
    getFuentesExternas, crearFuenteExterna, actualizarFuenteExterna,
    activarFuenteExterna, desactivarFuenteExterna, sincronizarFuenteExterna
} from '../../api/scraping';
import { useNotificationStore } from '../../store/notifications';
import { formatoFechaHora, formatoDuracion } from '../../utils/format';
import EmptyState from '../../components/EmptyState.vue';
import ModalDialog from '../../components/ModalDialog.vue';

const notify = useNotificationStore();
const historial = ref([]);
const cargando = ref(true);
const cargandoForm = ref(false);
const form = reactive({ target: '', url: '' });

// --- Fuentes externas (configuración persistente) ---
const fuentesExternas = ref([]);
const cargandoFuentes = ref(true);
const modalFuenteAbierto = ref(false);
const guardandoFuente = ref(false);
const sincronizandoId = ref(null);
const fuenteEditando = ref(null); // null = creando, objeto = editando
const formFuente = reactive({ nombre: '', baseUrl: '', apiKey: '' });

const total = computed(() => historial.value.length);
const sumaProductos = computed(() => historial.value.reduce((acc, j) => acc + (j.total_productos || 0), 0));

async function cargar() {
    cargando.value = true;
    try {
        const { data } = await getHistorialScraping();
        historial.value = data.data;
    } catch { notify.error('No se pudo cargar el historial de scraping'); }
    finally { cargando.value = false; }
}

async function iniciarScraping() {
    cargandoForm.value = true;
    try {
        await solicitarScraping({ ...form });
        notify.success('Scraping iniciado. Verás el job aquí en unos segundos…');
        form.target = ''; form.url = '';
        // El job se crea en segundo plano (Python), así que esperamos un
        // instante antes de refrescar por primera vez.
        setTimeout(cargar, 2000);
    } catch (err) { notify.error(err.response?.data?.message || 'No se pudo iniciar el scraping'); }
    finally { cargandoForm.value = false; }
}

async function sincronizar(fuente) {
    sincronizandoId.value = fuente.fuente_id;
    try {
        const { data } = await sincronizarFuenteExterna(fuente.fuente_id);
        notify.success(data.message || 'Sincronización completada');
        cargar(); // es síncrono: al terminar, el job ya aparece completo
        cargarFuentes();
    } catch (err) { notify.error(err.response?.data?.message || 'No se pudo sincronizar con la fuente externa'); }
    finally { sincronizandoId.value = null; }
}

async function cargarFuentes() {
    cargandoFuentes.value = true;
    try {
        const { data } = await getFuentesExternas();
        fuentesExternas.value = data.data;
    } catch { notify.error('No se pudieron cargar las fuentes externas'); }
    finally { cargandoFuentes.value = false; }
}

function abrirCrearFuente() {
    fuenteEditando.value = null;
    Object.assign(formFuente, { nombre: '', baseUrl: '', apiKey: '' });
    modalFuenteAbierto.value = true;
}

function abrirEditarFuente(fuente) {
    fuenteEditando.value = fuente;
    Object.assign(formFuente, { nombre: fuente.nombre, baseUrl: fuente.base_url, apiKey: '' });
    modalFuenteAbierto.value = true;
}

async function guardarFuente() {
    guardandoFuente.value = true;
    try {
        if (fuenteEditando.value) {
            // apiKey va vacío si no se quiere cambiar (el backend conserva la actual)
            await actualizarFuenteExterna(fuenteEditando.value.fuente_id, { ...formFuente });
            notify.success('Fuente actualizada correctamente');
        } else {
            await crearFuenteExterna({ ...formFuente });
            notify.success('Fuente guardada correctamente. Ya puedes sincronizarla cuando quieras.');
        }
        modalFuenteAbierto.value = false;
        cargarFuentes();
    } catch (err) {
        notify.error(err.response?.data?.message || 'No se pudo guardar la fuente');
    } finally {
        guardandoFuente.value = false;
    }
}

async function cambiarEstadoFuente(fuente, activo) {
    try {
        activo ? await activarFuenteExterna(fuente.fuente_id) : await desactivarFuenteExterna(fuente.fuente_id);
        notify.success(activo ? 'Fuente activada' : 'Fuente desactivada');
        cargarFuentes();
    } catch (err) { notify.error(err.response?.data?.message || 'No se pudo actualizar el estado'); }
}

// --- Polling: mientras exista algún job EN_PROCESO/PENDIENTE, refresca
// el historial cada 5s para reflejar el estado final sin que el usuario
// tenga que recargar la página manualmente.
let intervalId = null;
const jobsEnProceso = computed(() =>
    historial.value.some(j => j.estado === 'EN_PROCESO' || j.estado === 'PENDIENTE')
);

async function cargarConNotificacion() {
    const estadosPrevios = new Map(historial.value.map(j => [j.ejecucion_id, j.estado]));
    await cargar();
    for (const job of historial.value) {
        const previo = estadosPrevios.get(job.ejecucion_id);
        if (previo && previo !== job.estado && (job.estado === 'COMPLETADO' || job.estado === 'ERROR')) {
            job.estado === 'COMPLETADO'
                ? notify.success(`Análisis del job #${job.ejecucion_id} finalizado`)
                : notify.error(`Job #${job.ejecucion_id} terminó con error`);
        }
    }
}

onMounted(async () => {
    await cargar();
    cargarFuentes();
    intervalId = setInterval(() => {
        if (jobsEnProceso.value) cargarConNotificacion();
    }, 5000);
});
onUnmounted(() => clearInterval(intervalId));

function badgeClase(estado) {
    if (estado === 'COMPLETADO') return 'badge-ok';
    if (estado === 'EN_PROCESO' || estado === 'PENDIENTE') return 'badge-warn';
    return 'badge-danger'; // ERROR
}

</script>

<style scoped>
.toolbar {
    display: flex;
    align-items: center;
    gap: .7rem;
    padding: .9rem 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
}

.toolbar input {
    padding: .55rem .8rem;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-surface-raised);
}

.mono {
    font-family: var(--font-mono);
    font-size: .82rem;
}

.summary-bar {
    display: flex;
    gap: 2.2rem;
    padding: 1rem 1.3rem;
    margin-bottom: 1rem;
}

.s-label {
    display: block;
    font-size: .74rem;
    text-transform: uppercase;
    letter-spacing: .04em;
    color: var(--color-ink-soft);
    font-weight: 600;
}

.s-value {
    display: block;
    font-family: var(--font-display);
    font-size: 1.35rem;
    color: var(--color-forest-deep);
}
</style>
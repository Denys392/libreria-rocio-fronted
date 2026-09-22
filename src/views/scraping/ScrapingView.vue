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
import { computed, onMounted, reactive, ref } from 'vue';
import { solicitarScraping, getHistorialScraping } from '../../api/scraping';
import { useNotificationStore } from '../../store/notifications';
import { formatoFechaHora, formatoDuracion } from '../../utils/format';
import EmptyState from '../../components/EmptyState.vue';

const notify = useNotificationStore();
const historial = ref([]);
const cargando = ref(true);
const cargandoForm = ref(false);
const form = reactive({ target: '', url: '' });

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
    if (!form.target || !form.url) { notify.error('Completa el sitio web y la URL'); return; }
    cargandoForm.value = true;
    try {
        await solicitarScraping({ ...form });
        notify.success('Scraping iniciado correctamente');
        form.target = ''; form.url = '';
        await cargar();
    } catch (err) { notify.error(err.response?.data?.message || 'No se pudo iniciar el scraping'); }
    finally { cargandoForm.value = false; }
}

function badgeClase(estado) {
    if (estado === 'COMPLETADO') return 'badge-ok';
    if (estado === 'EN_PROCESO' || estado === 'PENDIENTE') return 'badge-warn';
    return 'badge-danger'; // ERROR
}

onMounted(cargar);
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
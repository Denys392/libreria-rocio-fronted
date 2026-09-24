<template>
    <div v-if="detalle" class="form-layout">
        <RouterLink to="/scraping" class="back-link">← Volver al historial</RouterLink>

        <section class="card" style="padding: 1.4rem 1.6rem; margin-top: .8rem;">
            <header class="detalle-head">
                <div>
                    <p class="eyebrow">Job de scraping</p>
                    <h2>#{{ detalle.ejecucion.ejecucion_id }}</h2>
                </div>
                <span class="badge" :class="badgeClase(detalle.ejecucion.estado)">{{ detalle.ejecucion.estado }}</span>
            </header>

            <dl class="dl">
                <dt>Inicio</dt>
                <dd>{{ formatoFechaHora(detalle.ejecucion.fecha_inicio) }}</dd>
                <dt>Fin</dt>
                <dd>{{ formatoFechaHora(detalle.ejecucion.fecha_fin) }}</dd>
                <dt>Duración</dt>
                <dd>{{ formatoDuracion(detalle.ejecucion.fecha_inicio, detalle.ejecucion.fecha_fin) }}</dd>
                <dt>URLs procesadas</dt>
                <dd>{{ detalle.ejecucion.total_urls }}</dd>
                <dt>Productos capturados</dt>
                <dd>{{ detalle.ejecucion.total_productos || 0 }}</dd>
                <dt v-if="detalle.ejecucion.mensaje_error">Error</dt>
                <dd v-if="detalle.ejecucion.mensaje_error" style="color: var(--color-wine);">{{
                    detalle.ejecucion.mensaje_error }}</dd>
            </dl>
        </section>

        <section class="card" style="margin-top: 1rem;">
            <div class="tabla-head">
                <h3>Productos capturados</h3>
                <div class="tabla-head-acciones">
                    <label class="chk">
                        <input type="checkbox" v-model="soloCoincidencias" />
                        Mostrar solo coincidencias
                    </label>
                    <button class="btn btn-primary btn-sm" :disabled="importando" @click="importarAlInventario">
                        {{ importando ? 'Importando…' : 'Importar todos al inventario' }}
                    </button>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th></th>
                        <th>Producto (competencia)</th>
                        <th>Precio competencia</th>
                        <th>Mi producto</th>
                        <th>Mi precio</th>
                        <th>Diferencia</th>
                    </tr>
                </thead>
                <tbody v-if="productosFiltrados.length">
                    <tr v-for="p in productosFiltrados" :key="p.scraping_producto_id">
                        <td>
                            <img v-if="p.imagen_url && p.imagen_url !== 'Sin imagen'" :src="p.imagen_url"
                                class="thumb" />
                            <div v-else class="thumb thumb-empty"></div>
                        </td>
                        <td>
                            <a :href="p.enlace_producto" target="_blank" class="prod-link">{{ p.nombre }}</a>
                            <div class="fuente">{{ p.fuente_url }}</div>
                        </td>
                        <td>{{ p.precio_texto || formatoMoneda(p.precio) }}</td>
                        <td>
                            <template v-if="p.producto_id">
                                {{ p.nombre_mi_producto }}
                                <div class="fuente mono">{{ p.codigo_sku || '—' }}</div>
                            </template>
                            <span v-else class="sin-match">Sin coincidencia</span>
                        </td>
                        <td>{{ p.producto_id ? formatoMoneda(p.precio_mi_tienda) : '—' }}</td>
                        <td>
                            <span v-if="p.producto_id" class="badge" :class="diferenciaClase(p.diferencia_precio)">
                                {{ p.diferencia_precio > 0 ? '+' : '' }}{{ formatoMoneda(p.diferencia_precio) }}
                                <small>({{ p.similitud_pct }}% similar)</small>
                            </span>
                            <span v-else>—</span>
                        </td>
                    </tr>
                </tbody>
            </table>
            <EmptyState v-if="!productosFiltrados.length" titulo="Sin productos"
                :descripcion="soloCoincidencias ? 'Ningún producto de este job coincide con tu inventario.' : 'Este job no capturó productos.'" />
        </section>
    </div>
    <EmptyState v-else-if="!cargando" titulo="Job no encontrado"
        descripcion="Vuelve al historial e intenta de nuevo." />
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { getDetalleJob, importarProductosScrapeados } from '../../api/scraping';
import { useNotificationStore } from '../../store/notifications';
import { formatoMoneda, formatoFechaHora, formatoDuracion } from '../../utils/format';
import EmptyState from '../../components/EmptyState.vue';

const route = useRoute();
const notify = useNotificationStore();
const detalle = ref(null);
const cargando = ref(true);
const importando = ref(false);
const soloCoincidencias = ref(false);

// Solo los productos que sí tuvieron coincidencia (match) contra el
// inventario propio, es decir, los que ya tienen producto_id asociado.
const productosFiltrados = computed(() => {
    if (!detalle.value) return [];
    if (!soloCoincidencias.value) return detalle.value.productos;
    return detalle.value.productos.filter((p) => p.producto_id);
});

async function cargar() {
    cargando.value = true;
    try {
        const { data } = await getDetalleJob(route.params.id);
        detalle.value = data.data;
    } catch { notify.error('No se pudo cargar el detalle del job'); }
    finally { cargando.value = false; }
}

async function importarAlInventario() {
    importando.value = true;
    try {
        const { data } = await importarProductosScrapeados({ jobId: route.params.id, categoriaId: 1 });
        notify.success(data.message || 'Productos importados correctamente');
    } catch (err) { notify.error(err.response?.data?.message || 'No se pudo importar'); }
    finally { importando.value = false; }
}

function badgeClase(estado) {
    if (estado === 'COMPLETADO') return 'badge-ok';
    if (estado === 'EN_PROCESO' || estado === 'PENDIENTE') return 'badge-warn';
    return 'badge-danger';
}

// diferencia_precio = precio_competencia - precio_mi_tienda
// positivo: la competencia está más cara (bueno para mí) -> ok
// negativo: yo estoy más caro -> alerta
function diferenciaClase(diferencia) {
    if (diferencia > 0) return 'badge-ok';
    if (diferencia < 0) return 'badge-danger';
    return 'badge-off';
}

onMounted(cargar);
</script>

<style scoped>
.form-layout {
    max-width: 1080px;
}

.back-link {
    font-size: .85rem;
    color: var(--color-forest);
    text-decoration: none;
    font-weight: 600;
}

.back-link:hover {
    text-decoration: underline;
}

.detalle-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
}

.eyebrow {
    margin: 0;
    font-size: .74rem;
    text-transform: uppercase;
    letter-spacing: .05em;
    color: var(--color-ink-soft);
    font-weight: 700;
}

.dl {
    display: grid;
    grid-template-columns: 160px 1fr;
    gap: .55rem 1rem;
    margin: 0;
}

.dl dt {
    color: var(--color-ink-soft);
    font-size: .82rem;
    font-weight: 600;
}

.dl dd {
    margin: 0;
}

.mono {
    font-family: var(--font-mono);
    font-size: .82rem;
}

.tabla-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.1rem 1.3rem .2rem;
}

.tabla-head h3 {
    margin: 0;
}

.tabla-head-acciones {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
}

.chk {
    display: flex;
    align-items: center;
    gap: .45rem;
    font-size: .85rem;
    font-weight: 600;
    color: var(--color-ink);
    white-space: nowrap;
}

.thumb {
    width: 42px;
    height: 42px;
    object-fit: cover;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
}

.thumb-empty {
    background: var(--color-bg);
}

.prod-link {
    color: var(--color-forest);
    font-weight: 600;
    text-decoration: none;
}

.prod-link:hover {
    text-decoration: underline;
}

.fuente {
    font-size: .74rem;
    color: var(--color-ink-soft);
    margin-top: .15rem;
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.sin-match {
    color: var(--color-ink-soft);
    font-style: italic;
    font-size: .85rem;
}

.badge small {
    font-weight: 600;
    text-transform: none;
    letter-spacing: 0;
    opacity: .85;
}
</style>
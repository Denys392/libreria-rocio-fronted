<template>
    <div>
        <RouterLink to="/scraping" class="back-link">← Volver al historial de scraping</RouterLink>

        <div class="toolbar card" style="margin-top: .8rem;">
            <div>
                <h2 style="margin: 0;">Comparación de Precios</h2>
                <p class="subt">Último precio de la competencia registrado por producto, frente a tu precio actual.</p>
            </div>
            <div class="spacer"></div>
            <label class="chk">
                <input type="checkbox" v-model="soloAlertas" @change="cargar" />
                Mostrar solo donde estoy más caro
            </label>
        </div>

        <div class="summary-bar card" v-if="!cargando">
            <div><span class="s-label">Productos comparados</span><span class="s-value">{{ comparaciones.length
                    }}</span></div>
            <div><span class="s-label">Más caros que la competencia</span><span class="s-value s-danger">{{ totalMasCaro
                    }}</span></div>
            <div><span class="s-label">Más baratos que la competencia</span><span class="s-value s-ok">{{ totalMasBarato
                    }}</span></div>
        </div>

        <section class="card">
            <table>
                <thead>
                    <tr>
                        <th></th>
                        <th>Mi producto</th>
                        <th>Producto competencia</th>
                        <th>Similitud</th>
                        <th>Mi precio</th>
                        <th>Precio competencia</th>
                        <th>Diferencia</th>
                        <th>Job</th>
                    </tr>
                </thead>
                <tbody v-if="cargando">
                    <tr v-for="n in 6" :key="n" class="skeleton-row">
                        <td colspan="8">
                            <div class="skeleton-bar"></div>
                        </td>
                    </tr>
                </tbody>
                <tbody v-else-if="comparaciones.length">
                    <tr v-for="c in comparaciones" :key="c.comparacion_id">
                        <td>
                            <img v-if="c.imagen_url && c.imagen_url !== 'Sin imagen'" :src="c.imagen_url"
                                class="thumb" />
                            <div v-else class="thumb thumb-empty"></div>
                        </td>
                        <td>
                            <div class="prod-nombre">{{ c.nombre_mi_producto }}</div>
                            <div class="fuente mono">{{ c.codigo_sku || '—' }}</div>
                        </td>
                        <td>
                            <a :href="c.enlace_producto" target="_blank" class="prod-link">{{ c.nombre_competencia
                                }}</a>
                            <div class="fuente">{{ c.fuente_url }}</div>
                        </td>
                        <td>{{ c.similitud_pct }}%</td>
                        <td>{{ formatoMoneda(c.precio_mi_tienda) }}</td>
                        <td>{{ formatoMoneda(c.precio_competencia) }}</td>
                        <td>
                            <span class="badge" :class="diferenciaClase(c.diferencia_precio)">
                                {{ c.diferencia_precio > 0 ? '+' : '' }}{{ formatoMoneda(c.diferencia_precio) }}
                            </span>
                        </td>
                        <td>
                            <RouterLink class="btn btn-ghost btn-sm" :to="`/scraping/${c.ejecucion_id}`">#{{
                                c.ejecucion_id }}</RouterLink>
                        </td>
                    </tr>
                </tbody>
            </table>
            <EmptyState v-if="!cargando && comparaciones.length === 0" titulo="Sin comparaciones"
                descripcion="Aún no hay productos comparados con la competencia, o ninguno coincide con el filtro." />
        </section>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { getComparacionesGlobales } from '../../api/scraping';
import { useNotificationStore } from '../../store/notifications';
import { formatoMoneda } from '../../utils/format';
import EmptyState from '../../components/EmptyState.vue';

const notify = useNotificationStore();
const comparaciones = ref([]);
const cargando = ref(true);
const soloAlertas = ref(false);

const totalMasCaro = computed(() => comparaciones.value.filter(c => c.diferencia_precio < 0).length);
const totalMasBarato = computed(() => comparaciones.value.filter(c => c.diferencia_precio > 0).length);

async function cargar() {
    cargando.value = true;
    try {
        const { data } = await getComparacionesGlobales(soloAlertas.value);
        comparaciones.value = data.data;
    } catch { notify.error('No se pudo cargar la comparación de precios'); }
    finally { cargando.value = false; }
}

// diferencia_precio = precio_competencia - precio_mi_tienda
// positivo: la competencia está más cara (bueno para mí)
// negativo: yo estoy más caro (alerta)
function diferenciaClase(diferencia) {
    if (diferencia > 0) return 'badge-ok';
    if (diferencia < 0) return 'badge-danger';
    return 'badge-off';
}

onMounted(cargar);
</script>

<style scoped>
.back-link {
    font-size: .85rem;
    color: var(--color-forest);
    text-decoration: none;
    font-weight: 600;
}

.back-link:hover {
    text-decoration: underline;
}

.toolbar {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.2rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
}

.subt {
    margin: .2rem 0 0;
    font-size: .82rem;
    color: var(--color-ink-soft);
}

.spacer {
    flex: 1;
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

.summary-bar {
    display: flex;
    gap: 2.2rem;
    padding: 1rem 1.3rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
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

.s-danger {
    color: var(--color-wine);
}

.s-ok {
    color: var(--color-ok);
}

.mono {
    font-family: var(--font-mono);
    font-size: .82rem;
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

.prod-nombre {
    font-weight: 600;
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
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
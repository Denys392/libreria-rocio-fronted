<template>
  <div>
    <div class="card seg-toolbar">
      <span class="seg-small">Datos de las últimas 24 horas (ingresos por aplicación: últimos 7 días).</span>
      <div class="seg-spacer"></div>
      <span v-if="actualizado" class="seg-small">Actualizado {{ actualizado }}</span>
      <button class="btn btn-ghost btn-sm" type="button" :disabled="cargando" @click="cargar">Actualizar</button>
    </div>

    <p v-if="error" class="seg-error" role="alert">{{ error }}</p>

    <template v-if="datos">
      <section class="tarjetas">
        <article v-for="t in tarjetas" :key="t.titulo" class="card tarjeta" :class="t.clase">
          <p class="tarjeta-num">{{ t.valor }}</p>
          <p class="tarjeta-tit">{{ t.titulo }}</p>
        </article>
      </section>

      <section class="dos-col">
        <article class="card panel">
          <h3>Ingresos por aplicación (7 días)</h3>
          <p v-if="!datos.porApp.length" class="vacio">Sin ingresos en este período.</p>
          <ul v-else class="barras">
            <li v-for="a in datos.porApp" :key="a.app">
              <span class="barra-nombre">{{ a.nombre }}</span>
              <span class="barra-pista"><span class="barra-relleno" :style="{ width: porcentaje(a.ingresos, maxApp) + '%' }"></span></span>
              <span class="barra-valor">{{ a.ingresos }}</span>
            </li>
          </ul>
        </article>

        <article class="card panel">
          <h3>Accesos por hora (hora local)</h3>
          <p v-if="!datos.porHora.length" class="vacio">Sin actividad en las últimas 24 horas.</p>
          <ul v-else class="barras">
            <li v-for="h in datos.porHora" :key="h.hora">
              <span class="barra-nombre">{{ h.hora.slice(5) }}</span>
              <span class="barra-pista">
                <span class="barra-relleno" :style="{ width: porcentaje(h.exitos, maxHora) + '%' }"></span>
                <span class="barra-relleno barra-fallo" :style="{ width: porcentaje(h.fallos, maxHora) + '%' }"></span>
              </span>
              <span class="barra-valor">{{ h.exitos }} / <span class="txt-fallo">{{ h.fallos }}</span></span>
            </li>
          </ul>
          <p class="leyenda"><span class="punto"></span> éxitos &nbsp; <span class="punto punto-fallo"></span> fallos</p>
        </article>
      </section>

      <section class="card panel">
        <h3>Alertas</h3>
        <p v-if="!hayAlertas" class="vacio">Sin alertas en las últimas 24 horas. 👍</p>

        <div v-if="datos.alertas.fuerzaBrutaPorIp.length" class="alerta">
          <h4><span class="badge badge-danger">Posible fuerza bruta</span> por IP</h4>
          <ul>
            <li v-for="(x, i) in datos.alertas.fuerzaBrutaPorIp" :key="'ip' + i">
              <span class="seg-mono">{{ x.ip }}</span> — {{ x.fallos }} intentos fallidos entre {{ formatoFechaMysql(x.desde) }} y {{ formatoFechaMysql(x.hasta) }}
            </li>
          </ul>
        </div>

        <div v-if="datos.alertas.fuerzaBrutaPorCorreo.length" class="alerta">
          <h4><span class="badge badge-danger">Posible fuerza bruta</span> por correo</h4>
          <ul>
            <li v-for="(x, i) in datos.alertas.fuerzaBrutaPorCorreo" :key="'co' + i">
              {{ x.correo }} — {{ x.fallos }} intentos fallidos entre {{ formatoFechaMysql(x.desde) }} y {{ formatoFechaMysql(x.hasta) }}
            </li>
          </ul>
        </div>

        <div v-if="datos.alertas.fueraDeHorario.length" class="alerta">
          <h4><span class="badge seg-badge-aviso">Ingreso en horario nocturno</span></h4>
          <ul>
            <li v-for="x in datos.alertas.fueraDeHorario" :key="x.log_id">
              {{ x.correo }} entró a <strong>{{ x.app }}</strong> el {{ formatoFechaMysql(x.inicio_dt) }} <span class="seg-mono">({{ x.ip || 'sin IP' }})</span>
            </li>
          </ul>
        </div>

        <div v-if="datos.alertas.ipNueva.length" class="alerta">
          <h4><span class="badge seg-badge-info">Ingreso desde una IP nueva</span></h4>
          <ul>
            <li v-for="x in datos.alertas.ipNueva" :key="x.log_id">
              {{ x.correo }} entró a <strong>{{ x.app }}</strong> desde <span class="seg-mono">{{ x.ip }}</span> el {{ formatoFechaMysql(x.inicio_dt) }}
            </li>
          </ul>
        </div>
      </section>
    </template>

    <div v-else-if="cargando" class="card panel"><div class="skeleton-bar"></div></div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { centralApi } from '../../api/central';
import { formatoFechaMysql } from '../../utils/fechas';
import { mensajeDeError } from '../../utils/errores';
import './seguridad.css';

const datos = ref(null);
const cargando = ref(true);
const error = ref('');
const actualizado = ref('');
let temporizador = null;

const maxApp = computed(() => Math.max(1, ...(datos.value?.porApp || []).map((a) => a.ingresos)));
const maxHora = computed(() => Math.max(1, ...(datos.value?.porHora || []).map((h) => h.exitos + h.fallos)));
const porcentaje = (valor, max) => Math.round((valor / max) * 100);

const tarjetas = computed(() => {
  const t = datos.value.totales;
  return [
    { titulo: 'Ingresos hoy', valor: t.ingresosHoy, clase: '' },
    { titulo: 'Intentos fallidos hoy', valor: t.fallidosHoy, clase: t.fallidosHoy > 0 ? 'tarjeta-alerta' : '' },
    { titulo: 'Usuarios que entraron hoy', valor: t.usuariosHoy, clase: '' },
    { titulo: 'Sesiones activas ahora', valor: t.sesionesActivas, clase: '' }
  ];
});

const hayAlertas = computed(() => {
  const a = datos.value.alertas;
  return a.fuerzaBrutaPorIp.length + a.fuerzaBrutaPorCorreo.length + a.fueraDeHorario.length + a.ipNueva.length > 0;
});

async function cargar() {
  cargando.value = true;
  error.value = '';
  try {
    const { data } = await centralApi.resumen();
    datos.value = data.data;
    actualizado.value = new Date().toLocaleTimeString('es-PE');
  } catch (err) {
    error.value = mensajeDeError(err, 'No se pudo cargar el dashboard de accesos.');
  } finally {
    cargando.value = false;
  }
}

onMounted(() => {
  cargar();
  temporizador = setInterval(cargar, 60000); // se refresca solo cada minuto
});
onBeforeUnmount(() => clearInterval(temporizador));
</script>

<style scoped>
.tarjetas { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
.tarjeta { padding: 1.1rem 1.2rem; }
.tarjeta-num { margin: 0; font-family: var(--font-display); font-size: 2rem; color: var(--color-forest-deep); }
.tarjeta-tit { margin: .2rem 0 0; font-size: .82rem; color: var(--color-ink-soft); }
.tarjeta-alerta .tarjeta-num { color: var(--color-wine); }
.dos-col { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
.panel { padding: 1.1rem 1.2rem; margin-bottom: 1rem; }
.dos-col .panel { margin-bottom: 0; }
.panel h3 { font-size: 1.05rem; margin-bottom: .8rem; }
.vacio { color: var(--color-ink-soft); margin: 0; font-size: .9rem; }
.barras { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .45rem; max-height: 320px; overflow-y: auto; }
.barras li { display: grid; grid-template-columns: 90px 1fr 70px; align-items: center; gap: .6rem; font-size: .82rem; }
.barra-pista { display: flex; height: 12px; background: var(--color-surface-dimmed); border-radius: 6px; overflow: hidden; }
.barra-relleno { background: var(--color-forest); height: 100%; }
.barra-fallo { background: var(--color-wine); }
.barra-valor { text-align: right; font-family: var(--font-mono); font-size: .78rem; }
.txt-fallo { color: var(--color-wine); }
.leyenda { font-size: .75rem; color: var(--color-ink-soft); margin: .7rem 0 0; }
.punto { display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: var(--color-forest); vertical-align: middle; }
.punto-fallo { background: var(--color-wine); }
.alerta { margin-top: 1rem; }
.alerta h4 { font-size: .9rem; margin-bottom: .4rem; display: flex; gap: .5rem; align-items: center; }
.alerta ul { margin: 0; padding-left: 1.1rem; font-size: .86rem; display: flex; flex-direction: column; gap: .25rem; }
</style>

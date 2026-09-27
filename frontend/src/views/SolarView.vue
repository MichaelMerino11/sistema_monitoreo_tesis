<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import SolarOverview from '@/components/solar/SolarOverview.vue'
import { useSolarStore } from '@/stores/solar.store'
import SolarDetailModal from '@/components/solar/SolarDetailModal.vue'
import type { SolarInstrument } from '@/config/solar-instruments'
import { SOLAR_DEVICE_ID, SOLAR_STALE_AFTER_MS } from '@/config/solar-monitoring'

const solarStore = useSolarStore()
const selectedInstrument = ref<SolarInstrument | null>(null)
const now = ref(Date.now())

let clockTimer: ReturnType<typeof setInterval> | null = null

const measurementAge = computed(() => {
  if (!solarStore.measurement) {
    return null
  }

  return now.value - new Date(solarStore.measurement.registradoEn).getTime()
})

const dataIsFresh = computed(() => {
  if (measurementAge.value === null) {
    return false
  }

  return measurementAge.value <= SOLAR_STALE_AFTER_MS
})

const apiStatusText = computed(() => {
  return solarStore.apiAvailable ? 'API disponible' : 'API sin conexión'
})

const dataStatusText = computed(() => {
  if (!solarStore.measurement) {
    return 'Sin datos'
  }

  return dataIsFresh.value ? 'Dato reciente' : 'Dato desactualizado'
})

onMounted(() => {
  solarStore.startPolling(SOLAR_DEVICE_ID)

  clockTimer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onBeforeUnmount(() => {
  solarStore.stopPolling()

  if (clockTimer) {
    clearInterval(clockTimer)
    clockTimer = null
  }
})
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h2>Sistema Fotovoltaico</h2>

        <p class="page-description">
          Monitoreo de voltaje, corriente, potencia y energía del sistema solar.
        </p>
      </div>

      <div class="solar-actions">
        <div class="connection-status">
          <span
            class="status-item"
            :class="{
              'status-error': !solarStore.apiAvailable,
            }"
          >
            {{ apiStatusText }}
          </span>

          <span
            class="status-item"
            :class="{
              'status-warning': solarStore.apiAvailable && !dataIsFresh,
            }"
          >
            {{ dataStatusText }}
          </span>

          <span v-if="solarStore.refreshing" class="refreshing"> Actualizando... </span>
        </div>

        <button
          class="refresh-button"
          :disabled="solarStore.refreshing"
          @click="solarStore.fetchLatest(SOLAR_DEVICE_ID, true)"
        >
          Actualizar
        </button>
      </div>
    </div>

    <div v-if="solarStore.loading" class="placeholder-panel">Consultando sistema solar...</div>

    <div v-else-if="solarStore.error && !solarStore.measurement" class="message-panel">
      {{ solarStore.error }}
    </div>

    <div v-else-if="!solarStore.measurement" class="placeholder-panel">
      No existen mediciones solares.
    </div>

    <template v-else>
      <SolarOverview :measurement="solarStore.measurement" @select="selectedInstrument = $event" />

      <div class="measurement-info">
        <span>
          Dispositivo:
          {{ solarStore.measurement.dispositivoId }}
        </span>

        <span>
          Última medición:
          {{ new Date(solarStore.measurement.registradoEn).toLocaleString() }}
        </span>
      </div>
    </template>
    <SolarDetailModal
      v-if="selectedInstrument && solarStore.measurement"
      :instrument="selectedInstrument"
      :measurement="solarStore.measurement"
      @close="selectedInstrument = null"
    />
  </main>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.refresh-button {
  padding: 8px 14px;

  background: #505050;
  color: #ffffff;

  border: 1px solid #707070;

  cursor: pointer;
}

.refresh-button:hover:not(:disabled) {
  background: #606060;
}

.refresh-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.measurement-info {
  display: flex;
  justify-content: space-between;
  gap: 16px;

  margin-top: 14px;
  padding: 8px 10px;

  color: #505050;

  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;

  border-top: 1px solid #909090;
}

.message-panel {
  padding: 20px;

  background: #c4c4c4;

  border: 1px solid #808080;
}

.solar-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-item {
  padding: 5px 8px;

  background: #707070;
  color: #ffffff;

  border: 1px solid #606060;

  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
}

.status-warning {
  background: #cc6600;
}

.status-error {
  background: #cc0000;
}

.refreshing {
  color: #505050;

  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
}

@media (max-width: 700px) {
  .solar-actions {
    width: 100%;
    align-items: flex-start;
    flex-direction: column;
  }

  .connection-status {
    flex-wrap: wrap;
  }
}

@media (max-width: 600px) {
  .page-header {
    flex-direction: column;
  }

  .measurement-info {
    flex-direction: column;
  }
}
</style>

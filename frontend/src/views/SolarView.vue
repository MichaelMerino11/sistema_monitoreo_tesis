<script setup lang="ts">
import { onMounted } from 'vue'

import SolarOverview from '@/components/solar/SolarOverview.vue'
import { useSolarStore } from '@/stores/solar.store'
import { ref } from 'vue'

import SolarDetailModal from '@/components/solar/SolarDetailModal.vue'
import type { SolarInstrument } from '@/config/solar-instruments'

const solarStore = useSolarStore()
const selectedInstrument = ref<SolarInstrument | null>(null)

onMounted(() => {
  solarStore.fetchLatest(2)
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

      <button
        class="refresh-button"
        :disabled="solarStore.loading"
        @click="solarStore.fetchLatest(2)"
      >
        Actualizar
      </button>
    </div>

    <div v-if="solarStore.loading" class="placeholder-panel">Consultando sistema solar...</div>

    <div v-else-if="solarStore.error" class="message-panel">
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

@media (max-width: 600px) {
  .page-header {
    flex-direction: column;
  }

  .measurement-info {
    flex-direction: column;
  }
}
</style>

<script setup lang="ts">
import { onMounted } from 'vue'

import IndustrialOverview from '@/components/industrial/IndustrialOverview.vue'

import { INDUSTRIAL_DEVICE_ID } from '@/config/industrial-monitoring'
import { useIndustrialStore } from '@/stores/industrial.store'

const industrialStore = useIndustrialStore()

onMounted(() => {
  industrialStore.fetchLatest(INDUSTRIAL_DEVICE_ID)
})
</script>

<template>
  <main class="page">
    <div class="page-header">
      <div>
        <h2>Sistema Industrial</h2>

        <p class="page-description">Monitoreo de variables eléctricas mediante Modbus RS-485.</p>
      </div>

      <button
        class="refresh-button"
        :disabled="industrialStore.loading"
        @click="industrialStore.fetchLatest(INDUSTRIAL_DEVICE_ID)"
      >
        Actualizar
      </button>
    </div>

    <div v-if="industrialStore.loading" class="placeholder-panel">
      Consultando sistema industrial...
    </div>

    <div v-else-if="industrialStore.error" class="placeholder-panel">
      {{ industrialStore.error }}
    </div>

    <div v-else-if="!industrialStore.measurement" class="placeholder-panel">
      No existen mediciones industriales.
    </div>

    <template v-else>
      <IndustrialOverview :measurement="industrialStore.measurement" />

      <div class="measurement-info">
        <span>
          Dispositivo:
          {{ industrialStore.measurement.dispositivoId }}
        </span>

        <span>
          Última medición:
          {{ new Date(industrialStore.measurement.registradoEn).toLocaleString() }}
        </span>
      </div>
    </template>
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

  border-top: 1px solid #909090;

  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
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

<script setup lang="ts">
import { onMounted } from 'vue'

import { INDUSTRIAL_DEVICE_ID } from '@/config/industrial-monitoring'
import { useIndustrialStore } from '@/stores/industrial.store'

const industrialStore = useIndustrialStore()

onMounted(() => {
  industrialStore.fetchLatest(INDUSTRIAL_DEVICE_ID)
})
</script>

<template>
  <main class="page">
    <h2>Sistema Industrial</h2>

    <p class="page-description">Monitoreo de variables eléctricas mediante Modbus RS-485.</p>

    <div v-if="industrialStore.loading" class="placeholder-panel">
      Consultando sistema industrial...
    </div>

    <div v-else-if="industrialStore.error" class="placeholder-panel">
      {{ industrialStore.error }}
    </div>

    <div v-else-if="!industrialStore.measurement" class="placeholder-panel">
      No existen mediciones industriales.
    </div>

    <div v-else class="industrial-debug">
      <h3>Última medición</h3>

      <pre>{{ industrialStore.measurement }}</pre>
    </div>
  </main>
</template>

<style scoped>
.industrial-debug {
  padding: 20px;

  background: #c4c4c4;
  border: 1px solid #808080;
}

.industrial-debug h3 {
  margin-top: 0;
}

.industrial-debug pre {
  margin-bottom: 0;

  overflow-x: auto;

  font-family: 'IBM Plex Mono', monospace;
  font-size: 14px;
}
</style>

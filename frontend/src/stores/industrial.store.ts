import { ref } from 'vue'
import { defineStore } from 'pinia'

import { INDUSTRIAL_DEVICE_ID } from '@/config/industrial-monitoring'
import { getLatestIndustrialMeasurement } from '@/services/industrial.service'

import type { IndustrialMeasurement } from '@/types/industrial'

export const useIndustrialStore = defineStore('industrial', () => {
  const measurement = ref<IndustrialMeasurement | null>(null)

  const loading = ref(false)

  const error = ref<string | null>(null)

  async function fetchLatest(dispositivoId = INDUSTRIAL_DEVICE_ID) {
    loading.value = true
    error.value = null

    try {
      measurement.value = await getLatestIndustrialMeasurement(dispositivoId)
    } catch (err) {
      measurement.value = null

      error.value =
        err instanceof Error ? err.message : 'Error desconocido consultando el sistema industrial'
    } finally {
      loading.value = false
    }
  }

  return {
    measurement,
    loading,
    error,
    fetchLatest,
  }
})

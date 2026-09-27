import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getLatestSolarMeasurement } from '@/services/solar.service'
import type { SolarMeasurement } from '@/types/solar'

export const useSolarStore = defineStore('solar', () => {
  const measurement = ref<SolarMeasurement | null>(null)

  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchLatest(dispositivoId = 2) {
    loading.value = true
    error.value = null

    try {
      measurement.value = await getLatestSolarMeasurement(dispositivoId)
    } catch (err) {
      measurement.value = null

      error.value =
        err instanceof Error ? err.message : 'Error desconocido consultando el sistema solar'
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

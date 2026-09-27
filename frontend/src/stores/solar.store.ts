import { ref } from 'vue'
import { defineStore } from 'pinia'

import type { SolarMeasurement } from '@/types/solar'
import { getLatestSolarMeasurement, getSolarHistory } from '@/services/solar.service'

export const useSolarStore = defineStore('solar', () => {
  const measurement = ref<SolarMeasurement | null>(null)

  const loading = ref(false)
  const error = ref<string | null>(null)
  const history = ref<SolarMeasurement[]>([])

  const historyLoading = ref(false)
  const historyError = ref<string | null>(null)

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

  async function fetchHistory(dispositivoId: number, from: Date, to: Date) {
    historyLoading.value = true
    historyError.value = null

    try {
      history.value = await getSolarHistory(dispositivoId, from, to)
    } catch (err) {
      history.value = []

      historyError.value =
        err instanceof Error ? err.message : 'Error desconocido consultando histórico solar'
    } finally {
      historyLoading.value = false
    }
  }

  return {
    measurement,
    loading,
    error,

    history,
    historyLoading,
    historyError,

    fetchLatest,
    fetchHistory,
  }
})

import { ref } from 'vue'
import { defineStore } from 'pinia'

import { SOLAR_DEVICE_ID, SOLAR_POLL_INTERVAL_MS } from '@/config/solar-monitoring'

import { getLatestSolarMeasurement, getSolarHistory } from '@/services/solar.service'

import type { SolarMeasurement } from '@/types/solar'

export const useSolarStore = defineStore('solar', () => {
  const measurement = ref<SolarMeasurement | null>(null)

  const loading = ref(false)
  const refreshing = ref(false)

  const error = ref<string | null>(null)

  const apiAvailable = ref(false)

  const lastSuccessfulFetch = ref<string | null>(null)

  const history = ref<SolarMeasurement[]>([])

  const historyLoading = ref(false)

  const historyError = ref<string | null>(null)

  let pollingTimer: ReturnType<typeof setInterval> | null = null

  async function fetchLatest(dispositivoId = SOLAR_DEVICE_ID, silent = false) {
    if (silent) {
      refreshing.value = true
    } else {
      loading.value = true
    }

    error.value = null

    try {
      const latest = await getLatestSolarMeasurement(dispositivoId)

      measurement.value = latest

      apiAvailable.value = true

      lastSuccessfulFetch.value = new Date().toISOString()
    } catch (err) {
      apiAvailable.value = false

      error.value =
        err instanceof Error ? err.message : 'Error desconocido consultando el sistema solar'

      /*
       * Importante:
       * no borramos measurement.
       *
       * Conservamos el último dato válido
       * aunque la comunicación falle.
       */
    } finally {
      loading.value = false
      refreshing.value = false
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

  function startPolling(dispositivoId = SOLAR_DEVICE_ID, intervalMs = SOLAR_POLL_INTERVAL_MS) {
    stopPolling()

    void fetchLatest(dispositivoId)

    pollingTimer = setInterval(() => {
      void fetchLatest(dispositivoId, true)
    }, intervalMs)
  }

  function stopPolling() {
    if (!pollingTimer) {
      return
    }

    clearInterval(pollingTimer)

    pollingTimer = null
  }

  return {
    measurement,

    loading,
    refreshing,
    error,

    apiAvailable,
    lastSuccessfulFetch,

    history,
    historyLoading,
    historyError,

    fetchLatest,
    fetchHistory,

    startPolling,
    stopPolling,
  }
})

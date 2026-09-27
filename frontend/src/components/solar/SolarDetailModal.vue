<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

import SolarHistoryChart from '@/components/solar/SolarHistoryChart.vue'
import type { SolarInstrument } from '@/config/solar-instruments'
import { useSolarStore } from '@/stores/solar.store'

import type { SolarHistoryRange, SolarMeasurement } from '@/types/solar'

const props = defineProps<{
  instrument: SolarInstrument
  measurement: SolarMeasurement
}>()

const emit = defineEmits<{
  close: []
}>()

const solarStore = useSolarStore()

const selectedRange = ref<SolarHistoryRange>('24h')

const ranges: SolarHistoryRange[] = ['1h', '6h', '24h', '7d']

const rangeMilliseconds: Record<SolarHistoryRange, number> = {
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
}

async function loadHistory() {
  const to = new Date()

  const from = new Date(to.getTime() - rangeMilliseconds[selectedRange.value])

  await solarStore.fetchHistory(props.measurement.dispositivoId, from, to)
}

onMounted(() => {
  loadHistory()
})

watch(
  () => props.instrument.tag,
  () => {
    loadHistory()
  },
)

watch(selectedRange, () => {
  loadHistory()
})
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <section
      class="modal"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="`modal-${instrument.tag}`"
    >
      <header class="modal-header">
        <div>
          <span class="modal-tag">
            {{ instrument.tag }}
          </span>

          <h3 :id="`modal-${instrument.tag}`">
            {{ instrument.label }}
          </h3>
        </div>

        <button class="close-button" type="button" aria-label="Cerrar" @click="emit('close')">
          ×
        </button>
      </header>

      <div class="current-value">
        <span class="value">
          {{ measurement[instrument.valueKey].toFixed(instrument.decimals ?? 2) }}
        </span>

        <span class="unit">
          {{ instrument.unit }}
        </span>
      </div>

      <div class="detail-grid">
        <div>
          <span class="detail-label">LO-LO</span>
          <strong>{{ instrument.lolo }}</strong>
        </div>

        <div>
          <span class="detail-label">LO</span>
          <strong>{{ instrument.lo }}</strong>
        </div>

        <div>
          <span class="detail-label">HI</span>
          <strong>{{ instrument.hi }}</strong>
        </div>

        <div>
          <span class="detail-label">HI-HI</span>
          <strong>{{ instrument.hihi }}</strong>
        </div>
      </div>

      <section class="history-section">
        <header class="history-header">
          <h4>Histórico</h4>

          <div class="range-selector">
            <button
              v-for="range in ranges"
              :key="range"
              type="button"
              :class="{
                active: selectedRange === range,
              }"
              @click="selectedRange = range"
            >
              {{ range }}
            </button>
          </div>
        </header>

        <div v-if="solarStore.historyLoading" class="history-message">Consultando histórico...</div>

        <div v-else-if="solarStore.historyError" class="history-message">
          {{ solarStore.historyError }}
        </div>

        <SolarHistoryChart v-else :instrument="instrument" :measurements="solarStore.history" />
      </section>

      <div class="instrument-info">
        <span>
          Rango:
          {{ instrument.min }} –
          {{ instrument.max }}
          {{ instrument.unit }}
        </span>

        <span>
          Última medición:
          {{ new Date(measurement.registradoEn).toLocaleString() }}
        </span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  z-index: 1000;
  inset: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 20px;

  background: rgba(0, 0, 0, 0.55);
}

.modal {
  width: min(850px, 100%);
  max-height: calc(100vh - 40px);

  overflow-y: auto;

  background: #bdbdbd;
  border: 1px solid #505050;
}

.modal-header {
  position: sticky;
  z-index: 1;
  top: 0;

  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  padding: 14px 16px;

  background: #484848;
  color: #ffffff;
}

.modal-tag {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  font-weight: 700;
}

.modal-header h3 {
  margin: 4px 0 0;
  font-size: 18px;
}

.close-button {
  padding: 0 7px;

  background: transparent;
  color: #ffffff;

  border: 0;

  font-size: 28px;
  line-height: 1;

  cursor: pointer;
}

.current-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 10px;

  padding: 32px 20px;

  border-bottom: 1px solid #808080;
}

.value {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 42px;
  font-weight: 700;
}

.unit {
  color: #505050;

  font-family: 'IBM Plex Mono', monospace;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);

  margin: 18px;

  border: 1px solid #808080;
}

.detail-grid > div {
  padding: 14px;

  text-align: center;

  border-right: 1px solid #909090;
}

.detail-grid > div:last-child {
  border-right: 0;
}

.detail-label {
  display: block;

  margin-bottom: 6px;

  color: #505050;

  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
}

.history-section {
  padding: 18px;

  border-top: 1px solid #808080;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;

  margin-bottom: 12px;
}

.history-header h4 {
  margin: 0;
  font-size: 14px;
}

.range-selector {
  display: flex;
  gap: 4px;
}

.range-selector button {
  padding: 5px 9px;

  background: #707070;
  color: #ffffff;

  border: 1px solid #606060;

  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;

  cursor: pointer;
}

.range-selector button.active {
  background: #303030;
}

.history-message {
  min-height: 150px;

  display: flex;
  align-items: center;
  justify-content: center;

  color: #505050;

  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
}

.instrument-info {
  display: flex;
  justify-content: space-between;
  gap: 15px;

  padding: 12px 18px;

  color: #505050;

  border-top: 1px solid #909090;

  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
}

@media (max-width: 600px) {
  .modal-backdrop {
    padding: 8px;
  }

  .detail-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .detail-grid > div {
    border-bottom: 1px solid #909090;
  }

  .history-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .instrument-info {
    flex-direction: column;
  }
}
</style>

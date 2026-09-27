<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

import Chart from 'chart.js/auto'

import type { SolarInstrument } from '@/config/solar-instruments'
import type { SolarMeasurement } from '@/types/solar'

const props = defineProps<{
  instrument: SolarInstrument
  measurements: SolarMeasurement[]
}>()

const canvas = ref<HTMLCanvasElement | null>(null)

let chart: Chart | null = null

function renderChart() {
  chart?.destroy()
  chart = null

  if (!canvas.value || props.measurements.length === 0) {
    return
  }

  const labels = props.measurements.map((measurement) =>
    new Date(measurement.registradoEn).toLocaleString([], {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
  )

  const values = props.measurements.map((measurement) => measurement[props.instrument.valueKey])

  chart = new Chart(canvas.value, {
    type: 'line',

    data: {
      labels,

      datasets: [
        {
          label: `${props.instrument.tag} — ${props.instrument.label}`,
          data: values,

          borderColor: '#303030',
          backgroundColor: '#303030',

          borderWidth: 2,

          pointRadius: 3,
          pointHoverRadius: 5,

          tension: 0.15,
        },
      ],
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      animation: false,

      plugins: {
        legend: {
          display: false,
        },
      },

      scales: {
        x: {
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8,
          },
        },

        y: {
          suggestedMin: props.instrument.min,
          suggestedMax: props.instrument.max,

          title: {
            display: true,
            text: props.instrument.unit,
          },
        },
      },
    },
  })
}

watch(
  () => [props.instrument.tag, props.measurements],
  async () => {
    await nextTick()
    renderChart()
  },
  {
    deep: true,
    immediate: true,
  },
)

onBeforeUnmount(() => {
  chart?.destroy()
})
</script>

<template>
  <div class="history-chart">
    <div v-if="measurements.length === 0" class="empty-history">
      No existen mediciones para este período.
    </div>

    <canvas v-else ref="canvas" />
  </div>
</template>

<style scoped>
.history-chart {
  position: relative;

  min-height: 260px;

  padding: 10px;

  background: #c8c8c8;
  border: 1px solid #909090;
}

.empty-history {
  min-height: 240px;

  display: flex;
  align-items: center;
  justify-content: center;

  color: #606060;

  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
}
</style>

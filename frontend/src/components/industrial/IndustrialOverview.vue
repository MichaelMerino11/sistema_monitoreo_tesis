<script setup lang="ts">
import { computed } from 'vue'

import IndustrialFaceplate from '@/components/industrial/IndustrialFaceplate.vue'

import {
  industrialInstruments,
  type IndustrialInstrumentGroup,
} from '@/config/industrial-instruments'

import type { IndustrialMeasurement } from '@/types/industrial'

const props = defineProps<{
  measurement: IndustrialMeasurement
}>()

function instrumentsFor(group: IndustrialInstrumentGroup) {
  return industrialInstruments.filter((instrument) => instrument.group === group)
}

const voltageInstruments = computed(() => instrumentsFor('voltage'))

const currentInstruments = computed(() => instrumentsFor('current'))

const powerInstruments = computed(() => instrumentsFor('power'))

const summaryInstruments = computed(() => instrumentsFor('summary'))
</script>

<template>
  <div class="industrial-overview">
    <section class="instrument-section">
      <h3>Tensiones</h3>

      <div class="instrument-grid">
        <IndustrialFaceplate
          v-for="instrument in voltageInstruments"
          :key="instrument.tag"
          :instrument="instrument"
          :value="props.measurement[instrument.valueKey]"
        />
      </div>
    </section>

    <section class="instrument-section">
      <h3>Corrientes</h3>

      <div class="instrument-grid">
        <IndustrialFaceplate
          v-for="instrument in currentInstruments"
          :key="instrument.tag"
          :instrument="instrument"
          :value="props.measurement[instrument.valueKey]"
        />
      </div>
    </section>

    <section class="instrument-section">
      <h3>Potencias</h3>

      <div class="instrument-grid">
        <IndustrialFaceplate
          v-for="instrument in powerInstruments"
          :key="instrument.tag"
          :instrument="instrument"
          :value="props.measurement[instrument.valueKey]"
        />
      </div>
    </section>

    <section class="instrument-section">
      <h3>Resumen eléctrico</h3>

      <div class="instrument-grid">
        <IndustrialFaceplate
          v-for="instrument in summaryInstruments"
          :key="instrument.tag"
          :instrument="instrument"
          :value="props.measurement[instrument.valueKey]"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.industrial-overview {
  display: flex;
  flex-direction: column;

  gap: 24px;
}

.instrument-section h3 {
  margin: 0 0 9px;

  color: #303030;

  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;

  letter-spacing: 0.5px;
}

.instrument-grid {
  display: grid;

  grid-template-columns: repeat(3, minmax(0, 1fr));

  gap: 12px;
}

@media (max-width: 900px) {
  .instrument-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .instrument-grid {
    grid-template-columns: 1fr;
  }
}
</style>

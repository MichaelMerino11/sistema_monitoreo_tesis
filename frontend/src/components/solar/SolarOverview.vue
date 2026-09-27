<script setup lang="ts">
import SolarFaceplate from '@/components/solar/SolarFaceplate.vue'
import { solarInstruments } from '@/config/solar-instruments'

import type { SolarMeasurement } from '@/types/solar'
import type { SolarInstrument } from '@/config/solar-instruments'

const emit = defineEmits<{
  select: [instrument: SolarInstrument]
}>()

defineProps<{
  measurement: SolarMeasurement
}>()
</script>

<template>
  <section class="solar-overview">
    <SolarFaceplate
      v-for="instrument in solarInstruments"
      :key="instrument.tag"
      :instrument="instrument"
      :value="measurement[instrument.valueKey]"
      @select="emit('select', $event)"
    />
  </section>
</template>

<style scoped>
.solar-overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

@media (max-width: 900px) {
  .solar-overview {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .solar-overview {
    grid-template-columns: 1fr;
  }
}
</style>

<script setup lang="ts">
import { computed } from 'vue'

import type { SolarInstrument } from '@/config/solar-instruments'
import { getSolarPosition, getSolarState } from '@/services/solar-status.service'

const props = defineProps<{
  instrument: SolarInstrument
  value: number
}>()

const state = computed(() => getSolarState(props.value, props.instrument))

const position = computed(() => getSolarPosition(props.value, props.instrument))

const decimals = computed(() => props.instrument.decimals ?? 2)

function zonePosition(value: number) {
  return getSolarPosition(value, props.instrument)
}
</script>

<template>
  <article class="faceplate">
    <header class="faceplate-header">
      <span>{{ instrument.tag }}</span>

      <span class="faceplate-unit-header">
        {{ instrument.unit }}
      </span>
    </header>

    <div class="faceplate-content">
      <div class="faceplate-value" :class="`state-${state.level}`">
        {{ value.toFixed(decimals) }}
      </div>

      <div class="faceplate-state" :class="`state-${state.level}`">
        {{ state.label }}
      </div>
    </div>

    <div v-if="instrument.alarmEnabled !== false" class="process">
      <div class="process-labels">
        <span>{{ instrument.min }}</span>
        <span>RANGO</span>
        <span>{{ instrument.max }}</span>
      </div>

      <div class="process-bar">
        <div
          class="zone zone-p1-low"
          :style="{
            width: zonePosition(instrument.lolo) + '%',
          }"
        />

        <div
          class="zone zone-p2-low"
          :style="{
            left: zonePosition(instrument.lolo) + '%',
            width: zonePosition(instrument.lo) - zonePosition(instrument.lolo) + '%',
          }"
        />

        <div
          class="zone zone-normal"
          :style="{
            left: zonePosition(instrument.lo) + '%',
            width: zonePosition(instrument.hi) - zonePosition(instrument.lo) + '%',
          }"
        />

        <div
          class="zone zone-p2-high"
          :style="{
            left: zonePosition(instrument.hi) + '%',
            width: zonePosition(instrument.hihi) - zonePosition(instrument.hi) + '%',
          }"
        />

        <div
          class="zone zone-p1-high"
          :style="{
            left: zonePosition(instrument.hihi) + '%',
            width: 100 - zonePosition(instrument.hihi) + '%',
          }"
        />

        <div class="process-indicator" :style="{ left: position + '%' }" />
      </div>
    </div>

    <footer class="faceplate-footer">
      {{ instrument.label }}
    </footer>
  </article>
</template>

<style scoped>
.faceplate {
  display: flex;
  min-height: 175px;
  flex-direction: column;

  background: #c8c8c8;
  border: 1px solid #707070;
}

.faceplate-header {
  display: flex;
  justify-content: space-between;

  padding: 8px 10px;

  background: #505050;
  color: #fff;

  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  font-weight: 700;
}

.faceplate-unit-header {
  color: #c0c0c0;
  font-size: 10px;
}

.faceplate-content {
  flex: 1;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 14px;
}

.faceplate-value {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 31px;
  font-weight: 600;
}

.faceplate-state {
  margin-top: 7px;

  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  font-weight: 600;
}

.state-normal {
  color: #303030;
}

.state-p2 {
  color: #cc6600;
}

.state-p1 {
  color: #cc0000;
}

.process {
  padding: 0 10px 10px;
}

.process-labels {
  display: flex;
  justify-content: space-between;

  margin-bottom: 3px;

  color: #606060;

  font-family: 'IBM Plex Mono', monospace;
  font-size: 8px;
}

.process-bar {
  position: relative;

  height: 9px;

  overflow: hidden;

  background: #303030;
  border: 1px solid #606060;
}

.zone {
  position: absolute;
  top: 0;
  bottom: 0;
}

.zone-p1-low,
.zone-p1-high {
  background: #555555;
}

.zone-p2-low,
.zone-p2-high {
  background: #626262;
}

.zone-normal {
  background: #787878;
}

.process-indicator {
  position: absolute;
  top: -2px;
  bottom: -2px;

  width: 3px;

  background: #ffffff;

  transform: translateX(-50%);
}

.faceplate-footer {
  padding: 7px 10px;

  text-align: center;

  color: #404040;

  font-size: 11px;

  border-top: 1px solid #909090;
}
</style>

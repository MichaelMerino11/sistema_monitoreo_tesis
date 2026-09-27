<script setup lang="ts">
import type { IndustrialInstrument } from '@/config/industrial-instruments'

defineProps<{
  instrument: IndustrialInstrument
  value: number
}>()
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
      <span class="faceplate-value">
        {{ value.toFixed(instrument.decimals ?? 2) }}
      </span>

      <span v-if="instrument.unit" class="faceplate-unit">
        {{ instrument.unit }}
      </span>
    </div>

    <footer class="faceplate-footer">
      {{ instrument.label }}
    </footer>
  </article>
</template>

<style scoped>
.faceplate {
  display: flex;
  min-height: 145px;
  flex-direction: column;

  background: #c8c8c8;

  border: 1px solid #707070;
}

.faceplate-header {
  display: flex;
  justify-content: space-between;

  padding: 8px 10px;

  background: #505050;
  color: #ffffff;

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
  align-items: baseline;
  justify-content: center;
  gap: 8px;

  padding: 22px 12px;
}

.faceplate-value {
  color: #202020;

  font-family: 'IBM Plex Mono', monospace;
  font-size: 31px;
  font-weight: 600;
}

.faceplate-unit {
  color: #505050;

  font-family: 'IBM Plex Mono', monospace;
  font-size: 13px;
}

.faceplate-footer {
  padding: 7px 10px;

  text-align: center;

  color: #404040;

  border-top: 1px solid #909090;

  font-size: 11px;
}
</style>

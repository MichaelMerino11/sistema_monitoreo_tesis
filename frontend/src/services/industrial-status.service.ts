import type { IndustrialInstrument } from '@/config/industrial-instruments'

export type IndustrialStateLevel = 'normal' | 'p2' | 'p1' | 'info'

export interface IndustrialState {
  level: IndustrialStateLevel
  label: string
}

export function getIndustrialState(
  value: number,
  instrument: IndustrialInstrument,
): IndustrialState {
  if (!instrument.alarmEnabled) {
    return {
      level: 'info',
      label: 'MONITOREO',
    }
  }

  const { lolo, lo, hi, hihi } = instrument

  if (lolo === undefined || lo === undefined || hi === undefined || hihi === undefined) {
    return {
      level: 'info',
      label: 'MONITOREO',
    }
  }

  if (value <= lolo || value >= hihi) {
    return {
      level: 'p1',
      label: 'ALARMA P1',
    }
  }

  if (value <= lo || value >= hi) {
    return {
      level: 'p2',
      label: 'ALARMA P2',
    }
  }

  return {
    level: 'normal',
    label: 'NORMAL',
  }
}

export function getIndustrialPosition(value: number, instrument: IndustrialInstrument): number {
  const range = instrument.max - instrument.min

  if (range <= 0) {
    return 0
  }

  const position = ((value - instrument.min) / range) * 100

  return Math.min(100, Math.max(0, position))
}

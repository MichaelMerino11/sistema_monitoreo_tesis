import type { SolarInstrument } from '@/config/solar-instruments'

export type SolarStateLevel = 'normal' | 'p2' | 'p1'

export interface SolarState {
  level: SolarStateLevel
  label: string
}

export function getSolarState(value: number, instrument: SolarInstrument): SolarState {
  if (instrument.alarmEnabled === false) {
    return {
      level: 'normal',
      label: 'ACUMULADO',
    }
  }

  if (value <= instrument.lolo || value >= instrument.hihi) {
    return {
      level: 'p1',
      label: 'ALARMA P1',
    }
  }

  if (value <= instrument.lo || value >= instrument.hi) {
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

export function getSolarPosition(value: number, instrument: SolarInstrument): number {
  const range = instrument.max - instrument.min

  if (range <= 0) {
    return 0
  }

  const position = ((value - instrument.min) / range) * 100

  return Math.min(100, Math.max(0, position))
}

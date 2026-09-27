export type SolarValueKey =
  | 'voltajePanel'
  | 'voltajeBateria'
  | 'voltajeInversor'
  | 'corrientePanel'
  | 'corrienteBateria'
  | 'corrienteInversor'
  | 'potenciaEntrada'
  | 'potenciaSalida'
  | 'energiaKwh'

export interface SolarInstrument {
  tag: string
  label: string
  unit: string
  valueKey: SolarValueKey

  min: number
  max: number

  lolo: number
  lo: number
  hi: number
  hihi: number

  decimals?: number
  alarmEnabled?: boolean
}

export const solarInstruments: SolarInstrument[] = [
  {
    tag: 'VT-P',
    label: 'Voltaje Panel',
    unit: 'V DC',
    valueKey: 'voltajePanel',
    min: 0,
    max: 25,
    lolo: 5,
    lo: 10,
    hi: 21.8,
    hihi: 23,
  },
  {
    tag: 'VT-B',
    label: 'Voltaje Batería',
    unit: 'V DC',
    valueKey: 'voltajeBateria',
    min: 0,
    max: 16,
    lolo: 10.5,
    lo: 11.5,
    hi: 14.4,
    hihi: 15,
  },

  // Corrección respecto al dashboard legacy:
  // este punto mide el lado DC del inversor, no 120 V AC.
  {
    tag: 'VT-I',
    label: 'Voltaje Entrada Inversor',
    unit: 'V DC',
    valueKey: 'voltajeInversor',
    min: 0,
    max: 16,
    lolo: 10.5,
    lo: 11.5,
    hi: 14.4,
    hihi: 15,
  },
  {
    tag: 'IT-P',
    label: 'Corriente Panel',
    unit: 'A DC',
    valueKey: 'corrientePanel',
    min: 0,
    max: 13,
    lolo: 0,
    lo: 0.5,
    hi: 10.96,
    hihi: 11.62,
  },
  {
    tag: 'IT-B',
    label: 'Corriente Batería',
    unit: 'A DC',
    valueKey: 'corrienteBateria',
    min: 0,
    max: 22,
    lolo: 0,
    lo: 0.5,
    hi: 18,
    hihi: 20,
  },
  {
    tag: 'IT-I',
    label: 'Corriente Inversor',
    unit: 'A DC',
    valueKey: 'corrienteInversor',
    min: 0,
    max: 15,
    lolo: 0,
    lo: 0.5,
    hi: 12.5,
    hihi: 13.5,
  },
  {
    tag: 'PT-ENT',
    label: 'Potencia Entrada',
    unit: 'W',
    valueKey: 'potenciaEntrada',
    min: 0,
    max: 220,
    lolo: 0,
    lo: 5,
    hi: 200,
    hihi: 206,
  },
  {
    tag: 'PT-SAL',
    label: 'Potencia Salida',
    unit: 'W',
    valueKey: 'potenciaSalida',
    min: 0,
    max: 1700,
    lolo: 0,
    lo: 5,
    hi: 1500,
    hihi: 1600,
  },
  {
    tag: 'ET-DIA',
    label: 'Energía Diaria',
    unit: 'kWh',
    valueKey: 'energiaKwh',
    min: 0,
    max: 10,
    lolo: 0,
    lo: 0,
    hi: 9.5,
    hihi: 10,
    decimals: 3,
    alarmEnabled: false,
  },
]

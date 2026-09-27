export type IndustrialValueKey =
  | 'voltajeL1'
  | 'voltajeL2'
  | 'voltajeL3'
  | 'corrienteL1'
  | 'corrienteL2'
  | 'corrienteL3'
  | 'potenciaActiva'
  | 'potenciaReactiva'
  | 'potenciaAparente'
  | 'factorPotencia'
  | 'frecuencia'
  | 'energiaKwh'

export type IndustrialInstrumentGroup = 'voltage' | 'current' | 'power' | 'summary'

export interface IndustrialInstrument {
  tag: string
  label: string
  unit: string
  valueKey: IndustrialValueKey
  group: IndustrialInstrumentGroup
  decimals?: number
}

export const industrialInstruments: IndustrialInstrument[] = [
  {
    tag: 'VT-L1',
    label: 'Voltaje L1',
    unit: 'V',
    valueKey: 'voltajeL1',
    group: 'voltage',
    decimals: 1,
  },
  {
    tag: 'VT-L2',
    label: 'Voltaje L2',
    unit: 'V',
    valueKey: 'voltajeL2',
    group: 'voltage',
    decimals: 1,
  },
  {
    tag: 'VT-L3',
    label: 'Voltaje L3',
    unit: 'V',
    valueKey: 'voltajeL3',
    group: 'voltage',
    decimals: 1,
  },

  {
    tag: 'IT-L1',
    label: 'Corriente L1',
    unit: 'A',
    valueKey: 'corrienteL1',
    group: 'current',
    decimals: 2,
  },
  {
    tag: 'IT-L2',
    label: 'Corriente L2',
    unit: 'A',
    valueKey: 'corrienteL2',
    group: 'current',
    decimals: 2,
  },
  {
    tag: 'IT-L3',
    label: 'Corriente L3',
    unit: 'A',
    valueKey: 'corrienteL3',
    group: 'current',
    decimals: 2,
  },

  {
    tag: 'PT-ACT',
    label: 'Potencia Activa',
    unit: 'kW',
    valueKey: 'potenciaActiva',
    group: 'power',
    decimals: 2,
  },
  {
    tag: 'PT-REA',
    label: 'Potencia Reactiva',
    unit: 'kVAr',
    valueKey: 'potenciaReactiva',
    group: 'power',
    decimals: 2,
  },
  {
    tag: 'PT-APR',
    label: 'Potencia Aparente',
    unit: 'kVA',
    valueKey: 'potenciaAparente',
    group: 'power',
    decimals: 2,
  },

  {
    tag: 'FP-001',
    label: 'Factor de Potencia',
    unit: '',
    valueKey: 'factorPotencia',
    group: 'summary',
    decimals: 3,
  },
  {
    tag: 'FT-001',
    label: 'Frecuencia',
    unit: 'Hz',
    valueKey: 'frecuencia',
    group: 'summary',
    decimals: 2,
  },
  {
    tag: 'ET-IND',
    label: 'Energía',
    unit: 'kWh',
    valueKey: 'energiaKwh',
    group: 'summary',
    decimals: 2,
  },
]

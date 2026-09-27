export interface IndustrialMeasurementApi {
  id: number
  dispositivo_id: number

  voltaje_l1: string
  voltaje_l2: string
  voltaje_l3: string

  corriente_l1: string
  corriente_l2: string
  corriente_l3: string

  potencia_activa: string
  potencia_reactiva: string
  potencia_aparente: string

  factor_potencia: string
  frecuencia: string
  energia_kwh: string

  registrado_en: string
}

export interface IndustrialMeasurement {
  id: number
  dispositivoId: number

  voltajeL1: number
  voltajeL2: number
  voltajeL3: number

  corrienteL1: number
  corrienteL2: number
  corrienteL3: number

  potenciaActiva: number
  potenciaReactiva: number
  potenciaAparente: number

  factorPotencia: number
  frecuencia: number
  energiaKwh: number

  registradoEn: string
}

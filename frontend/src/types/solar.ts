export interface SolarMeasurementApi {
  id: number
  dispositivo_id: number

  voltaje_panel: string
  voltaje_bateria: string
  voltaje_inversor: string

  corriente_panel: string
  corriente_bateria: string
  corriente_inversor: string

  potencia_entrada: string
  potencia_salida: string

  energia_kwh: string

  registrado_en: string
}

export interface SolarMeasurement {
  id: number
  dispositivoId: number

  voltajePanel: number
  voltajeBateria: number
  voltajeInversor: number

  corrientePanel: number
  corrienteBateria: number
  corrienteInversor: number

  potenciaEntrada: number
  potenciaSalida: number

  energiaKwh: number

  registradoEn: string
}

import type { SolarMeasurement, SolarMeasurementApi } from '@/types/solar'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

function normalizeSolarMeasurement(data: SolarMeasurementApi): SolarMeasurement {
  return {
    id: data.id,
    dispositivoId: data.dispositivo_id,

    voltajePanel: Number(data.voltaje_panel),
    voltajeBateria: Number(data.voltaje_bateria),
    voltajeInversor: Number(data.voltaje_inversor),

    corrientePanel: Number(data.corriente_panel),
    corrienteBateria: Number(data.corriente_bateria),
    corrienteInversor: Number(data.corriente_inversor),

    potenciaEntrada: Number(data.potencia_entrada),
    potenciaSalida: Number(data.potencia_salida),

    energiaKwh: Number(data.energia_kwh),

    registradoEn: data.registrado_en,
  }
}

function formatDate(date: Date): string {
  const year = date.getFullYear()

  const month = String(date.getMonth() + 1).padStart(2, '0')

  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function nextDay(date: Date): Date {
  const result = new Date(date)

  result.setDate(result.getDate() + 1)

  return result
}

export async function getLatestSolarMeasurement(
  dispositivoId = 2,
): Promise<SolarMeasurement | null> {
  const response = await fetch(`${API_BASE_URL}/api/solar/ultimo?dispositivo_id=${dispositivoId}`)

  if (!response.ok) {
    throw new Error(`Error consultando medición solar: HTTP ${response.status}`)
  }

  const data = (await response.json()) as SolarMeasurementApi | null

  if (!data) {
    return null
  }

  return normalizeSolarMeasurement(data)
}

export async function getSolarHistory(
  dispositivoId: number,
  from: Date,
  to: Date,
): Promise<SolarMeasurement[]> {
  /*
   * El endpoint existente trabaja correctamente
   * con fechas YYYY-MM-DD.
   *
   * Consultamos hasta el día siguiente y luego
   * filtramos exactamente por timestamp en Vue.
   */
  const desde = formatDate(from)
  const hasta = formatDate(nextDay(to))

  const params = new URLSearchParams({
    dispositivo_id: String(dispositivoId),
    desde,
    hasta,
  })

  const response = await fetch(`${API_BASE_URL}/api/solar/historico?${params.toString()}`)

  if (!response.ok) {
    throw new Error(`Error consultando histórico solar: HTTP ${response.status}`)
  }

  const data = (await response.json()) as SolarMeasurementApi[]

  const measurements = data.map(normalizeSolarMeasurement)

  const fromTimestamp = from.getTime()
  const toTimestamp = to.getTime()

  return measurements.filter((measurement) => {
    const timestamp = new Date(measurement.registradoEn).getTime()

    return timestamp >= fromTimestamp && timestamp <= toTimestamp
  })
}

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

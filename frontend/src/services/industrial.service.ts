import type { IndustrialMeasurement, IndustrialMeasurementApi } from '@/types/industrial'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

function normalizeIndustrialMeasurement(data: IndustrialMeasurementApi): IndustrialMeasurement {
  return {
    id: data.id,
    dispositivoId: data.dispositivo_id,

    voltajeL1: Number(data.voltaje_l1),
    voltajeL2: Number(data.voltaje_l2),
    voltajeL3: Number(data.voltaje_l3),

    corrienteL1: Number(data.corriente_l1),
    corrienteL2: Number(data.corriente_l2),
    corrienteL3: Number(data.corriente_l3),

    potenciaActiva: Number(data.potencia_activa),

    potenciaReactiva: Number(data.potencia_reactiva),

    potenciaAparente: Number(data.potencia_aparente),

    factorPotencia: Number(data.factor_potencia),

    frecuencia: Number(data.frecuencia),
    energiaKwh: Number(data.energia_kwh),

    registradoEn: data.registrado_en,
  }
}

export async function getLatestIndustrialMeasurement(
  dispositivoId = 3,
): Promise<IndustrialMeasurement | null> {
  const response = await fetch(
    `${API_BASE_URL}/api/industrial/ultimo?dispositivo_id=${dispositivoId}`,
  )

  if (!response.ok) {
    throw new Error(`Error consultando medición industrial: HTTP ${response.status}`)
  }

  const data = (await response.json()) as IndustrialMeasurementApi | null

  if (!data) {
    return null
  }

  return normalizeIndustrialMeasurement(data)
}

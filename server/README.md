# SOLCA IoT — Servidor de Monitoreo

## Requisitos
- Node.js v18+
- MySQL o MariaDB instalado

## Instalación

### 1. Clonar / copiar el proyecto
```bash
cd solca-server
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Crear la base de datos
Abre MySQL y ejecuta el schema:
```bash
mysql -u root -p < sql/schema.sql
```

### 4. Configurar variables de entorno
```bash
cp .env.example .env
# Edita .env con tu contraseña de MySQL
```

### 5. Iniciar el servidor
```bash
# Producción
npm start

# Desarrollo (recarga automática)
npm run dev
```

El servidor corre en `http://0.0.0.0:3000`

---

## Endpoints disponibles

### Caldero
| Método | URL | Descripción |
|--------|-----|-------------|
| POST | `/api/caldero/medicion` | Guardar temperatura/nivel |
| GET | `/api/caldero/ultimo?dispositivo_id=1` | Última medición |
| GET | `/api/caldero/historico?dispositivo_id=1&desde=YYYY-MM-DD&hasta=YYYY-MM-DD` | Histórico |

### Solar
| Método | URL | Descripción |
|--------|-----|-------------|
| POST | `/api/solar/medicion` | Guardar voltaje, corriente, potencias, etc. |
| GET | `/api/solar/ultimo?dispositivo_id=2` | Última medición |
| GET | `/api/solar/diario?dispositivo_id=2&fecha=YYYY-MM-DD` | Resumen del día |
| GET | `/api/solar/mensual?dispositivo_id=2&anio=2025&mes=4` | Resumen del mes |
| GET | `/api/solar/historico?dispositivo_id=2&desde=...&hasta=...` | Histórico |

### Alarmas
| Método | URL | Descripción |
|--------|-----|-------------|
| POST | `/api/alarmas` | Registrar alarma |
| GET | `/api/alarmas/activas` | Alarmas activas |
| PUT | `/api/alarmas/:id/resolver` | Marcar alarma como resuelta |
| GET | `/api/alarmas/historico` | Historial de alarmas |

### General
| Método | URL | Descripción |
|--------|-----|-------------|
| GET | `/api/status` | Health check del servidor |

---

## Tipos de alarma disponibles
- `ENCENDIDO_SP` — Alarma de encendido del SP
- `MODO_CONEXION` — Cambio de modo (WiFi / Bluetooth)
- `SOBRECARGA` — Switch SW_AL1
- `FLUJO` — Switch SW_AL2
- `EMERGENCIA` — Switch SW_AL3
- `NIVEL_CRITICO` — Nivel fuera de rango
- `TEMP_CRITICA` — Temperatura fuera de rango

---

## IDs de dispositivos (datos iniciales)
| ID | Nombre | Planta |
|----|--------|--------|
| 1 | ESP32_SOLCA | Planta Caldero |
| 2 | ESP32_SOLAR | Planta Solar |
| 3 | ESP32_IND | Planta Industrial |

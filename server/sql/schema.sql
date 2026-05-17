-- ============================================================
--  SOLCA IOT - Sistema de Monitoreo
--  Base de Datos: solca_iot
--  Motor: MySQL / MariaDB
-- ============================================================

CREATE DATABASE IF NOT EXISTS solca_iot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE solca_iot;

-- ------------------------------------------------------------
-- PLANTAS
-- Registra cada planta física del sistema
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plantas (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(100)  NOT NULL,          -- 'Planta Caldero', 'Planta Solar', etc.
  descripcion   VARCHAR(255),
  activa        BOOLEAN DEFAULT TRUE,
  creado_en     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- DISPOSITIVOS
-- Cada ESP32 u otro nodo que envía datos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dispositivos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  planta_id     INT NOT NULL,
  nombre        VARCHAR(100) NOT NULL,           -- 'ESP32_SOLCA', 'ESP32_SOLAR'
  mac_address   VARCHAR(20),
  ip_asignada   VARCHAR(20),
  activo        BOOLEAN DEFAULT TRUE,
  creado_en     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (planta_id) REFERENCES plantas(id)
);

-- ------------------------------------------------------------
-- MEDICIONES - Caldero (temperatura y nivel)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mediciones_caldero (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  dispositivo_id  INT NOT NULL,
  temperatura     DECIMAL(6,2),                  -- °C
  nivel           DECIMAL(6,2),                  -- cm
  registrado_en   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id),
  INDEX idx_fecha (registrado_en),
  INDEX idx_dispositivo (dispositivo_id)
);

-- ------------------------------------------------------------
-- MEDICIONES - Panel Solar
-- Voltaje, corriente, potencia activa/reactiva, impedancia
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mediciones_solar (
  id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
  dispositivo_id     INT NOT NULL,
  voltaje_panel      DECIMAL(8,3),                  -- V panel
  voltaje_bateria    DECIMAL(8,3),                  -- V batería
  voltaje_inversor   DECIMAL(8,3),                  -- V inversor
  corriente_panel    DECIMAL(8,3),                  -- A panel
  corriente_bateria  DECIMAL(8,3),                  -- A batería
  corriente_inversor DECIMAL(8,3),                  -- A inversor
  potencia_entrada   DECIMAL(10,3),                 -- W entrada
  potencia_salida    DECIMAL(10,3),                 -- W salida
  energia_kwh        DECIMAL(10,4),                 -- kWh acumulado del día
  registrado_en      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id),
  INDEX idx_fecha (registrado_en),
  INDEX idx_dispositivo (dispositivo_id)
);

-- ------------------------------------------------------------
-- ALARMAS
-- Registro de cada evento de alarma generado
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alarmas (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  dispositivo_id  INT NOT NULL,
  tipo            ENUM('ENCENDIDO_SP','MODO_CONEXION','SOBRECARGA','FLUJO','EMERGENCIA','NIVEL_CRITICO','TEMP_CRITICA') NOT NULL,
  descripcion     VARCHAR(255),
  activa          BOOLEAN DEFAULT TRUE,           -- TRUE = sigue activa, FALSE = resuelta
  modo_conexion   ENUM('WIFI','BLUETOOTH') DEFAULT NULL,  -- Para alarma tipo MODO_CONEXION
  notificado      BOOLEAN DEFAULT FALSE,          -- Si ya se envió notificación
  registrado_en   DATETIME DEFAULT CURRENT_TIMESTAMP,
  resuelta_en     DATETIME DEFAULT NULL,
  FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id),
  INDEX idx_fecha (registrado_en),
  INDEX idx_activa (activa),
  INDEX idx_tipo (tipo)
);

-- ------------------------------------------------------------
-- RESUMEN DIARIO - Solar
-- Consumo diario calculado (para histórico rápido)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS resumen_diario_solar (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  dispositivo_id  INT NOT NULL,
  fecha           DATE NOT NULL,
  energia_total_kwh  DECIMAL(10,4) DEFAULT 0,    -- kWh del día
  potencia_max_w     DECIMAL(10,3) DEFAULT 0,
  potencia_min_w     DECIMAL(10,3) DEFAULT 0,
  potencia_prom_w    DECIMAL(10,3) DEFAULT 0,
  registros_count    INT DEFAULT 0,
  UNIQUE KEY uq_disp_fecha (dispositivo_id, fecha),
  FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id)
);

-- ------------------------------------------------------------
-- RESUMEN MENSUAL - Solar
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS resumen_mensual_solar (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  dispositivo_id  INT NOT NULL,
  anio            YEAR NOT NULL,
  mes             TINYINT NOT NULL,               -- 1-12
  energia_total_kwh  DECIMAL(12,4) DEFAULT 0,
  costo_estimado     DECIMAL(10,2) DEFAULT 0,     -- En USD
  UNIQUE KEY uq_disp_mes (dispositivo_id, anio, mes),
  FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id)
);

-- ------------------------------------------------------------
-- DATOS INICIALES
-- ------------------------------------------------------------
INSERT INTO plantas (nombre, descripcion) VALUES
  ('Planta Caldero',     'Monitoreo de temperatura y nivel'),
  ('Planta Solar',       'Monitoreo de paneles fotovoltaicos'),
  ('Planta Industrial',  'Monitoreo industrial general');

INSERT INTO dispositivos (planta_id, nombre, mac_address, ip_asignada) VALUES
  (1, 'ESP32_SOLCA',  NULL, '192.168.100.150'),
  (2, 'ESP32_SOLAR',  NULL, NULL),
  (3, 'ESP32_IND',    NULL, NULL);

// server/src/routes/gateway.js
// Estado de la Tinkerboard (heartbeat) y velocidad RS-485 configurable POR MEDIDOR.
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Se guarda como .conf (no .json) para que nodemon no reinicie el servidor al cambiar la velocidad
const CONFIG_FILE = path.join(__dirname, '..', '..', 'gateway.conf');
const BAUDRATES = [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200];
const TIMEOUT_S = 10; // Sin señal por más de 10 s = desconectada

let ultimoHeartbeat = null;
let fallidas = [];      // IDs de variables que no respondieron en la última lectura
let estadoMedidores = {}; // slave_id -> { baud, revisadas, total, verificado, detectando, baud_probando }

// Formato: { baudrate_defecto: 9600, medidores: { "1": 38400, "2": 9600 } }
function leerConfig() {
  try {
    const c = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    return {
      baudrate_defecto: c.baudrate_defecto || c.baudrate || 9600, // compatible con el formato anterior
      medidores: c.medidores || {}
    };
  } catch (e) {
    return { baudrate_defecto: 9600, medidores: {} };
  }
}

function guardarConfig(cfg) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
}

function limpiarEstado(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  Object.entries(raw).forEach(([slave, e]) => {
    if (!e || typeof e !== 'object') return;
    out[String(slave)] = {
      baud: e.baud != null ? parseInt(e.baud, 10) : null,
      revisadas: parseInt(e.revisadas, 10) || 0,
      total: parseInt(e.total, 10) || 0,
      verificado: !!e.verificado,
      detectando: !!e.detectando,
      baud_probando: e.baud_probando != null ? parseInt(e.baud_probando, 10) : null
    };
  });
  return out;
}

// La Tinkerboard avisa cada 3 s que está viva, envía el estado por medidor y recibe las velocidades
router.post('/heartbeat', (req, res) => {
  ultimoHeartbeat = new Date();
  const b = req.body || {};
  fallidas = (Array.isArray(b.fallidas) ? b.fallidas : []).map(Number).filter(n => !isNaN(n));
  estadoMedidores = limpiarEstado(b.medidores);
  res.json({ ok: true, ...leerConfig() });
});

// Los dashboards consultan el estado
router.get('/estado', (req, res) => {
  const ahora = new Date();
  const segundos = ultimoHeartbeat ? (ahora - ultimoHeartbeat) / 1000 : null;
  const conectada = segundos !== null && segundos <= TIMEOUT_S;
  res.json({
    conectada,
    fallidas: conectada ? fallidas : [],
    bus: { medidores: conectada ? estadoMedidores : {}, config: leerConfig() },
    ultimo_heartbeat: ultimoHeartbeat,
    segundos,
    ahora
  });
});

router.get('/config', (req, res) => {
  res.json(leerConfig());
});

// Cambiar la velocidad de un medidor (por su Slave ID)
router.put('/config/medidor/:slave', (req, res) => {
  const slave = parseInt(req.params.slave, 10);
  const baudrate = parseInt(req.body.baudrate, 10);
  if (isNaN(slave) || slave < 1 || slave > 247) {
    return res.status(400).json({ ok: false, error: 'Slave ID no válido' });
  }
  if (!BAUDRATES.includes(baudrate)) {
    return res.status(400).json({ ok: false, error: 'Velocidad no válida' });
  }
  try {
    const cfg = leerConfig();
    cfg.medidores[String(slave)] = baudrate;
    guardarConfig(cfg);
    res.json({ ok: true, slave_id: slave, baudrate });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
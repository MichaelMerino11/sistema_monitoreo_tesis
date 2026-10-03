// server/src/routes/gateway.js
// Estado de conexión de la Tinkerboard (heartbeat) y velocidad RS-485 configurable.
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Se guarda como .conf (no .json) para que nodemon no reinicie el servidor al cambiar la velocidad
const CONFIG_FILE = path.join(__dirname, '..', '..', 'gateway.conf');
const BAUDRATES = [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200];
const TIMEOUT_S = 10; // Sin señal por más de 10 s = desconectada

let ultimoHeartbeat = null;
let fallidas = []; // IDs de variables que no respondieron en la última lectura
let bus = { baud_aplicado: null, revisadas: 0, total: 0, verificado: false };

function leerConfig() {
    try {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (e) {
        return { baudrate: 9600 };
    }
}

// La Tinkerboard avisa que está viva cada 3 s y recibe la velocidad configurada
router.post('/heartbeat', (req, res) => {
    ultimoHeartbeat = new Date();
    const lista = req.body && Array.isArray(req.body.fallidas) ? req.body.fallidas : [];
    fallidas = lista.map(Number).filter(n => !isNaN(n));
    const b = req.body || {};
    bus = {
        baud_aplicado: b.baud_aplicado != null ? parseInt(b.baud_aplicado, 10) : null,
        revisadas: parseInt(b.revisadas, 10) || 0,
        total: parseInt(b.total, 10) || 0,
        verificado: !!b.verificado
    };
    res.json({ ok: true, ...leerConfig() });
});

// Los dashboards consultan si la Tinkerboard está conectada
router.get('/estado', (req, res) => {
    const ahora = new Date();
    const segundos = ultimoHeartbeat ? (ahora - ultimoHeartbeat) / 1000 : null;
    const conectada = segundos !== null && segundos <= TIMEOUT_S;
    res.json({
        conectada,
        fallidas: conectada ? fallidas : [],
        bus: { ...bus, baud_config: leerConfig().baudrate },
        ultimo_heartbeat: ultimoHeartbeat,
        segundos,
        ahora
    });
});

router.get('/config', (req, res) => {
    res.json(leerConfig());
});

router.put('/config', (req, res) => {
    const baudrate = parseInt(req.body.baudrate, 10);
    if (!BAUDRATES.includes(baudrate)) {
        return res.status(400).json({ ok: false, error: 'Velocidad no válida' });
    }
    const cfg = { ...leerConfig(), baudrate };
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
        res.json({ ok: true, ...cfg });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

module.exports = router;
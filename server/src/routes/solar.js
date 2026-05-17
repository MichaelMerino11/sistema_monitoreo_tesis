const express = require('express');
const router  = express.Router();
const db      = require('../db');

// POST /api/solar/medicion
// Body: { dispositivo_id, voltaje_panel, voltaje_bateria, voltaje_inversor, corriente_panel, corriente_bateria, corriente_inversor, potencia_entrada, potencia_salida, energia_kwh }
router.post('/medicion', async (req, res) => {
  const { dispositivo_id, voltaje_panel, voltaje_bateria, voltaje_inversor,
          corriente_panel, corriente_bateria, corriente_inversor,
          potencia_entrada, potencia_salida, energia_kwh } = req.body;
  if (!dispositivo_id) return res.status(400).json({ error: 'dispositivo_id requerido' });

  try {
    const [result] = await db.execute(
      `INSERT INTO mediciones_solar
        (dispositivo_id, voltaje_panel, voltaje_bateria, voltaje_inversor,
         corriente_panel, corriente_bateria, corriente_inversor,
         potencia_entrada, potencia_salida, energia_kwh)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [dispositivo_id,
       voltaje_panel ?? null, voltaje_bateria ?? null, voltaje_inversor ?? null,
       corriente_panel ?? null, corriente_bateria ?? null, corriente_inversor ?? null,
       potencia_entrada ?? null, potencia_salida ?? null, energia_kwh ?? null]
    );

    await actualizarResumenDiario(dispositivo_id, potencia_entrada, energia_kwh);
    res.json({ ok: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function actualizarResumenDiario(dispositivo_id, potencia_activa, energia_kwh) {
  const hoy = new Date().toISOString().slice(0, 10);
  await db.execute(
    `INSERT INTO resumen_diario_solar (dispositivo_id, fecha, energia_total_kwh, potencia_max_w, potencia_min_w, potencia_prom_w, registros_count)
     VALUES (?, ?, ?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE
       energia_total_kwh = GREATEST(energia_total_kwh, VALUES(energia_total_kwh)),
       potencia_max_w    = GREATEST(potencia_max_w, VALUES(potencia_max_w)),
       potencia_min_w    = LEAST(potencia_min_w, VALUES(potencia_min_w)),
       potencia_prom_w   = (potencia_prom_w * registros_count + VALUES(potencia_prom_w)) / (registros_count + 1),
       registros_count   = registros_count + 1`,
    [dispositivo_id, hoy, energia_kwh ?? 0, potencia_activa ?? 0, potencia_activa ?? 0, potencia_activa ?? 0]
  );
}

// GET /api/solar/ultimo?dispositivo_id=2
router.get('/ultimo', async (req, res) => {
  const { dispositivo_id } = req.query;
  if (!dispositivo_id) return res.status(400).json({ error: 'dispositivo_id requerido' });

  try {
    const [rows] = await db.execute(
      'SELECT * FROM mediciones_solar WHERE dispositivo_id = ? ORDER BY registrado_en DESC LIMIT 1',
      [dispositivo_id]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/solar/diario?dispositivo_id=2&fecha=2025-04-19
router.get('/diario', async (req, res) => {
  const { dispositivo_id, fecha } = req.query;
  const dia = fecha || new Date().toISOString().slice(0, 10);

  try {
    const [rows] = await db.execute(
      'SELECT * FROM resumen_diario_solar WHERE dispositivo_id = ? AND fecha = ?',
      [dispositivo_id, dia]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/solar/mensual?dispositivo_id=2&anio=2025&mes=4
router.get('/mensual', async (req, res) => {
  const { dispositivo_id, anio, mes } = req.query;
  const now = new Date();

  try {
    const [rows] = await db.execute(
      'SELECT * FROM resumen_mensual_solar WHERE dispositivo_id = ? AND anio = ? AND mes = ?',
      [dispositivo_id, anio || now.getFullYear(), mes || (now.getMonth() + 1)]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/solar/historico?dispositivo_id=2&desde=2025-04-01&hasta=2025-04-19
router.get('/historico', async (req, res) => {
  const { dispositivo_id, desde, hasta } = req.query;
  if (!dispositivo_id) return res.status(400).json({ error: 'dispositivo_id requerido' });

  const fechaDesde = desde || new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const fechaHasta = hasta || new Date().toISOString().slice(0, 10);

  try {
    const [rows] = await db.execute(
      `SELECT * FROM mediciones_solar
       WHERE dispositivo_id = ?
         AND registrado_en BETWEEN ? AND ?
       ORDER BY registrado_en ASC
       LIMIT 1000`,
      [dispositivo_id, `${fechaDesde} 00:00:00`, `${fechaHasta} 23:59:59`]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

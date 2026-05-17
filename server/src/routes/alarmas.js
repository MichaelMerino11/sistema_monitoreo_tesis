const express = require('express');
const router  = express.Router();
const db      = require('../db');

// POST /api/alarmas
// Body: { dispositivo_id, tipo, descripcion, modo_conexion }
router.post('/', async (req, res) => {
  const { dispositivo_id, tipo, descripcion, modo_conexion } = req.body;
  if (!dispositivo_id || !tipo) return res.status(400).json({ error: 'dispositivo_id y tipo requeridos' });

  try {
    const [result] = await db.execute(
      `INSERT INTO alarmas (dispositivo_id, tipo, descripcion, modo_conexion)
       VALUES (?, ?, ?, ?)`,
      [dispositivo_id, tipo, descripcion || null, modo_conexion || null]
    );
    res.json({ ok: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/alarmas/activas?dispositivo_id=1
router.get('/activas', async (req, res) => {
  const { dispositivo_id } = req.query;
  try {
    const whereClause = dispositivo_id
      ? 'WHERE activa = TRUE AND dispositivo_id = ?'
      : 'WHERE activa = TRUE';
    const params = dispositivo_id ? [dispositivo_id] : [];
    const [rows] = await db.execute(
      `SELECT a.*, d.nombre AS dispositivo, p.nombre AS planta
       FROM alarmas a
       JOIN dispositivos d ON a.dispositivo_id = d.id
       JOIN plantas p ON d.planta_id = p.id
       ${whereClause}
       ORDER BY a.registrado_en DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/alarmas/:id/resolver
router.put('/:id/resolver', async (req, res) => {
  try {
    await db.execute(
      'UPDATE alarmas SET activa = FALSE, resuelta_en = NOW() WHERE id = ?',
      [req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/alarmas/historico?dispositivo_id=1&desde=2025-04-01
router.get('/historico', async (req, res) => {
  const { dispositivo_id, desde, hasta } = req.query;
  const fechaDesde = desde || new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const fechaHasta = hasta || new Date().toISOString().slice(0, 10);

  try {
    const [rows] = await db.execute(
      `SELECT a.*, d.nombre AS dispositivo, p.nombre AS planta
       FROM alarmas a
       JOIN dispositivos d ON a.dispositivo_id = d.id
       JOIN plantas p ON d.planta_id = p.id
       WHERE a.registrado_en BETWEEN ? AND ?
         ${dispositivo_id ? 'AND a.dispositivo_id = ?' : ''}
       ORDER BY a.registrado_en DESC
       LIMIT 500`,
      dispositivo_id
        ? [`${fechaDesde} 00:00:00`, `${fechaHasta} 23:59:59`, dispositivo_id]
        : [`${fechaDesde} 00:00:00`, `${fechaHasta} 23:59:59`]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

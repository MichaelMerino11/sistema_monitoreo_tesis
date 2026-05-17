const express = require('express');
const router  = express.Router();
const db      = require('../db');

// POST /api/caldero/medicion
// Body: { dispositivo_id, temperatura, nivel }
router.post('/medicion', async (req, res) => {
  const { dispositivo_id, temperatura, nivel } = req.body;
  if (!dispositivo_id) return res.status(400).json({ error: 'dispositivo_id requerido' });

  try {
    const [result] = await db.execute(
      'INSERT INTO mediciones_caldero (dispositivo_id, temperatura, nivel) VALUES (?, ?, ?)',
      [dispositivo_id, temperatura ?? null, nivel ?? null]
    );
    res.json({ ok: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/caldero/ultimo?dispositivo_id=1
// Retorna la última medición
router.get('/ultimo', async (req, res) => {
  const { dispositivo_id } = req.query;
  if (!dispositivo_id) return res.status(400).json({ error: 'dispositivo_id requerido' });

  try {
    const [rows] = await db.execute(
      'SELECT * FROM mediciones_caldero WHERE dispositivo_id = ? ORDER BY registrado_en DESC LIMIT 1',
      [dispositivo_id]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/caldero/historico?dispositivo_id=1&desde=2025-04-01&hasta=2025-04-19
router.get('/historico', async (req, res) => {
  const { dispositivo_id, desde, hasta } = req.query;
  if (!dispositivo_id) return res.status(400).json({ error: 'dispositivo_id requerido' });

  const fechaDesde = desde || new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const fechaHasta = hasta || new Date().toISOString().slice(0, 10);

  try {
    const [rows] = await db.execute(
      `SELECT * FROM mediciones_caldero
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

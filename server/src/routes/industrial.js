const express = require('express');
const router  = express.Router();
const db      = require('../db');

// Última medición
router.get('/ultimo', async (req, res) => {
  const { dispositivo_id } = req.query;
  try {
    const [rows] = await db.query(
      `SELECT * FROM mediciones_industrial 
       WHERE dispositivo_id = ? 
       ORDER BY registrado_en DESC LIMIT 1`,
      [dispositivo_id]
    );
    res.json(rows[0] || null);
  } catch (e) { res.json({ error: e.message }); }
});

// Insertar medición (Node-RED → POST)
router.post('/medicion', async (req, res) => {
  const {
    dispositivo_id, voltaje_l1, voltaje_l2, voltaje_l3,
    corriente_l1, corriente_l2, corriente_l3,
    potencia_activa, potencia_reactiva, potencia_aparente,
    factor_potencia, frecuencia, energia_kwh
  } = req.body;
  try {
    await db.query(
      `INSERT INTO mediciones_industrial 
       (dispositivo_id, voltaje_l1, voltaje_l2, voltaje_l3,
        corriente_l1, corriente_l2, corriente_l3,
        potencia_activa, potencia_reactiva, potencia_aparente,
        factor_potencia, frecuencia, energia_kwh)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [dispositivo_id, voltaje_l1||0, voltaje_l2||0, voltaje_l3||0,
       corriente_l1||0, corriente_l2||0, corriente_l3||0,
       potencia_activa||0, potencia_reactiva||0, potencia_aparente||0,
       factor_potencia||0, frecuencia||0, energia_kwh||0]
    );
    res.json({ ok: true });
  } catch (e) { res.json({ error: e.message }); }
});

// Histórico
router.get('/historico', async (req, res) => {
  const { dispositivo_id } = req.query;
  try {
    const [rows] = await db.query(
      `SELECT * FROM mediciones_industrial 
       WHERE dispositivo_id = ? 
       ORDER BY registrado_en DESC LIMIT 100`,
      [dispositivo_id]
    );
    res.json(rows);
  } catch (e) { res.json({ error: e.message }); }
});

module.exports = router;
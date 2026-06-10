const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ── MEDIDORES ──────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM medidores ORDER BY id');
    res.json(rows);
  } catch (e) { res.json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const { nombre, slave_id, descripcion } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO medidores (nombre, slave_id, descripcion) VALUES (?,?,?)',
      [nombre, slave_id, descripcion || '']
    );
    res.json({ ok: true, id: r.insertId });
  } catch (e) { res.json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  const { nombre, slave_id, descripcion, activo } = req.body;
  try {
    await db.query(
      'UPDATE medidores SET nombre=?, slave_id=?, descripcion=?, activo=? WHERE id=?',
      [nombre, slave_id, descripcion || '', activo ?? 1, req.params.id]
    );
    res.json({ ok: true });
  } catch (e) { res.json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM medidores WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.json({ error: e.message }); }
});

// ── VARIABLES ──────────────────────────────────────────

router.get('/:id/variables', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM variables_config WHERE medidor_id=? ORDER BY id',
      [req.params.id]
    );
    res.json(rows);
  } catch (e) { res.json({ error: e.message }); }
});

router.get('/variables/activas', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT v.*, m.slave_id, m.nombre as medidor_nombre
      FROM variables_config v
      JOIN medidores m ON v.medidor_id = m.id
      WHERE v.activo = 1 AND m.activo = 1
      ORDER BY m.id, v.id
    `);
    res.json(rows);
  } catch (e) { res.json({ error: e.message }); }
});

router.post('/:id/variables', async (req, res) => {
  const { nombre, registro, tipo, unidad, tipo_registro } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO variables_config (medidor_id, nombre, registro, tipo, unidad, tipo_registro) VALUES (?,?,?,?,?,?)',
      [req.params.id, nombre, registro, tipo || 'float32', unidad || '', tipo_registro || 'holding']
    );
    res.json({ ok: true, id: r.insertId });
  } catch (e) { res.json({ error: e.message }); }
});

router.put('/variables/:id', async (req, res) => {
  const { nombre, registro, tipo, unidad, activo, tipo_registro } = req.body;
  try {
    await db.query(
      'UPDATE variables_config SET nombre=?, registro=?, tipo=?, unidad=?, activo=?, tipo_registro=? WHERE id=?',
      [nombre, registro, tipo || 'float32', unidad || '', activo ?? 1, tipo_registro || 'holding', req.params.id]
    );
    res.json({ ok: true });
  } catch (e) { res.json({ error: e.message }); }
});

router.delete('/variables/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM variables_config WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.json({ error: e.message }); }
});

// ── LECTURAS ──────────────────────────────────────────

router.post('/lecturas', async (req, res) => {
  const { variable_id, valor } = req.body;
  try {
    await db.query(
      'INSERT INTO lecturas (variable_id, valor) VALUES (?,?)',
      [variable_id, valor]
    );
    res.json({ ok: true });
  } catch (e) { res.json({ error: e.message }); }
});

router.get('/lecturas/ultimo', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT v.id, v.nombre, v.unidad, v.registro, v.tipo, v.tipo_registro,
             m.nombre as medidor_nombre, m.slave_id,
             l.valor, l.registrado_en
      FROM variables_config v
      JOIN medidores m ON v.medidor_id = m.id
      LEFT JOIN lecturas l ON l.id = (
        SELECT id FROM lecturas
        WHERE variable_id = v.id
        ORDER BY registrado_en DESC LIMIT 1
      )
      WHERE v.activo = 1 AND m.activo = 1
      ORDER BY m.id, v.id
    `);
    res.json(rows);
  } catch (e) { res.json({ error: e.message }); }
});

// ── ALARMAS CONFIG ─────────────────────────────────────

router.get('/variables/:id/alarma', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM alarmas_config WHERE variable_id=? LIMIT 1',
      [req.params.id]
    );
    res.json(rows[0] || null);
  } catch (e) { res.json({ error: e.message }); }
});

router.post('/variables/:id/alarma', async (req, res) => {
  const { lolo, lo, hi, hihi } = req.body;
  try {
    const [exists] = await db.query(
      'SELECT id FROM alarmas_config WHERE variable_id=?', [req.params.id]
    );
    if (exists.length) {
      await db.query(
        'UPDATE alarmas_config SET lolo=?,lo=?,hi=?,hihi=? WHERE variable_id=?',
        [lolo ?? null, lo ?? null, hi ?? null, hihi ?? null, req.params.id]
      );
    } else {
      await db.query(
        'INSERT INTO alarmas_config (variable_id,lolo,lo,hi,hihi) VALUES (?,?,?,?,?)',
        [req.params.id, lolo ?? null, lo ?? null, hi ?? null, hihi ?? null]
      );
    }
    res.json({ ok: true });
  } catch (e) { res.json({ error: e.message }); }
});

// ── ALARMAS LOG ────────────────────────────────────────

router.post('/alarmas/log', async (req, res) => {
  const { variable_id, valor, tipo, prioridad } = req.body;
  try {
    await db.query(
      `UPDATE alarmas_log SET activa=0, fin_en=NOW()
       WHERE variable_id=? AND tipo=? AND activa=1`,
      [variable_id, tipo]
    );
    const [r] = await db.query(
      'INSERT INTO alarmas_log (variable_id,valor,tipo,prioridad) VALUES (?,?,?,?)',
      [variable_id, valor, tipo, prioridad]
    );
    res.json({ ok: true, id: r.insertId });
  } catch (e) { res.json({ error: e.message }); }
});

router.put('/alarmas/log/:id/resolver', async (req, res) => {
  try {
    await db.query(
      'UPDATE alarmas_log SET activa=0, fin_en=NOW() WHERE id=?',
      [req.params.id]
    );
    res.json({ ok: true });
  } catch (e) { res.json({ error: e.message }); }
});

router.get('/alarmas/log/activas', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT al.*, v.nombre as variable_nombre, v.unidad,
             m.nombre as medidor_nombre
      FROM alarmas_log al
      JOIN variables_config v ON al.variable_id = v.id
      JOIN medidores m ON v.medidor_id = m.id
      WHERE al.activa = 1
      ORDER BY al.prioridad ASC, al.inicio_en DESC
    `);
    res.json(rows);
  } catch (e) { res.json({ error: e.message }); }
});

router.get('/alarmas/log/historico', async (req, res) => {
  const { variable_id, desde, hasta } = req.query;
  try {
    let q = `
      SELECT al.*, v.nombre as variable_nombre, v.unidad,
             m.nombre as medidor_nombre
      FROM alarmas_log al
      JOIN variables_config v ON al.variable_id = v.id
      JOIN medidores m ON v.medidor_id = m.id
      WHERE 1=1
    `;
    const params = [];
    if (variable_id) { q += ' AND al.variable_id=?'; params.push(variable_id); }
    if (desde)       { q += ' AND al.inicio_en>=?';  params.push(desde); }
    if (hasta)       { q += ' AND al.inicio_en<=?';  params.push(hasta); }
    q += ' ORDER BY al.inicio_en DESC LIMIT 500';
    const [rows] = await db.query(q, params);
    res.json(rows);
  } catch (e) { res.json({ error: e.message }); }
});

// ── HISTÓRICO DE LECTURAS ──────────────────────────────

router.get('/variables/:id/historico', async (req, res) => {
  const { desde, hasta, limite } = req.query;
  try {
    let q = 'SELECT valor, registrado_en FROM lecturas WHERE variable_id=?';
    const params = [req.params.id];
    if (desde) { q += ' AND registrado_en>=?'; params.push(desde); }
    if (hasta) { q += ' AND registrado_en<=?'; params.push(hasta); }
    q += ` ORDER BY registrado_en DESC LIMIT ${parseInt(limite) || 200}`;
    const [rows] = await db.query(q, params);
    res.json(rows.reverse());
  } catch (e) { res.json({ error: e.message }); }
});

router.get('/variables/:id/stats', async (req, res) => {
  const { desde, hasta } = req.query;
  try {
    let q = `SELECT MIN(valor) as minimo, MAX(valor) as maximo,
             AVG(valor) as promedio, COUNT(*) as total
             FROM lecturas WHERE variable_id=?`;
    const params = [req.params.id];
    if (desde) { q += ' AND registrado_en>=?'; params.push(desde); }
    if (hasta) { q += ' AND registrado_en<=?'; params.push(hasta); }
    const [rows] = await db.query(q, params);
    res.json(rows[0]);
  } catch (e) { res.json({ error: e.message }); }
});

module.exports = router;
const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());

// Dashboard estático
app.use(express.static(path.join(__dirname, '../dashboard')));

// --- Rutas ---
app.use('/api/caldero', require('./routes/caldero'));
app.use('/api/solar',   require('./routes/solar'));
app.use('/api/alarmas', require('./routes/alarmas'));
app.use('/api/industrial', require('./routes/industrial'));

// --- Health check ---
app.get('/api/status', (req, res) => {
  res.json({ ok: true, servidor: 'SOLCA IoT', timestamp: new Date().toISOString() });
});

// --- Inicio ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor SOLCA IoT corriendo en http://0.0.0.0:${PORT}`);
});

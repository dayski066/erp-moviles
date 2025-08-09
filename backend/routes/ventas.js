// routes/ventas.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Módulo de ventas - En desarrollo',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

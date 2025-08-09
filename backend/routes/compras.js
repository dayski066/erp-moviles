// routes/compras.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Módulo de compras - En desarrollo',
    timestamp: new Date().toISOString()
  });
});

module.exports = router
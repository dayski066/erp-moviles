// models/modules/catalogos/index.js - Exportar todos los modelos de catálogos
const MarcaModel = require('./MarcaModel');
const ModeloModel = require('./ModeloModel');
const AveriaModel = require('./AveriaModel');
const IntervencionModel = require('./IntervencionModel');
const EstadoModel = require('./EstadoModel');

module.exports = {
  MarcaModel,
  ModeloModel,
  AveriaModel,
  IntervencionModel,
  EstadoModel
};
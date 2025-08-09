// routes/catalogos.js - ARCHIVO COMPLETO ACTUALIZADO
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const catalogosService = require('../services/catalogosService');

// ===== CONFIGURACIÓN MULTER PARA SUBIR LOGOS =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'public', 'logos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Crear nombre de archivo más limpio
    const marcaNombre = req.body.nombre
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const ext = path.extname(file.originalname);
    const nombreArchivo = `${marcaNombre}-${Date.now()}${ext}`;
    cb(null, nombreArchivo);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  },
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

// ===== MIDDLEWARE =====
const validateInput = (req, res, next) => {
    // Validaciones básicas
    next();
};


// ===== CLIENTES =====
router.get('/clientes/buscar', async (req, res) => {
    try {
        const { termino } = req.query;
        
        if (!termino || termino.length < 2) {
            return res.json({ success: true, data: [] });
        }

        const clientes = await catalogosService.buscarClientesPorDni(termino);
        res.json({ success: true, data: clientes });
    } catch (error) {
        console.error('Error buscando clientes:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/clientes/buscar/:dni', async (req, res) => {
    try {
        const { dni } = req.params;
        
        if (!dni || dni.length < 3) {
            return res.json({ 
                success: true, 
                encontrado: false, 
                cliente: null 
            });
        }

        // Búsqueda exacta por DNI
        const clientes = await catalogosService.buscarClientePorDniExacto(dni);
        
        if (clientes.length > 0) {
            res.json({ 
                success: true, 
                encontrado: true, 
                cliente: clientes[0] 
            });
        } else {
            res.json({ 
                success: true, 
                encontrado: false, 
                cliente: null 
            });
        }
    } catch (error) {
        console.error('Error buscando cliente por DNI:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ===== MARCAS ===== 
router.get('/marcas', async (req, res) => {
    try {
        const marcas = await catalogosService.obtenerMarcas();
        res.json({ success: true, data: marcas });
    } catch (error) {
        console.error('❌ ERROR en /marcas:', error.message);
        res.status(500).json({ 
            success: false, 
            message: error.message
        });
    }
});

// Crear nueva marca (con soporte para imágenes)
router.post('/marcas', upload.single('icono'), async (req, res) => {
    try {
        const { nombre, logo_emoji, tipo_icono } = req.body;
        
        console.log('📥 Datos recibidos:', { nombre, logo_emoji, tipo_icono });
        console.log('📁 Archivo:', req.file ? req.file.filename : 'ninguno');
        
        if (!nombre || nombre.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de la marca es requerido'
            });
        }

        let iconoPath = null;
        let tipoIconoFinal = tipo_icono || 'emoji';
        let logoEmojiFinal = logo_emoji || '📱';

        // Si se subió archivo, usar imagen
        if (req.file) {
            iconoPath = req.file.filename; // Solo el nombre del archivo
            tipoIconoFinal = 'imagen';
            console.log('✅ Archivo guardado:', iconoPath);
        }

        // Crear marca en la base de datos
        const id = await catalogosService.crearMarca(
            nombre.trim(),
            logoEmojiFinal,
            iconoPath,
            tipoIconoFinal
        );

        console.log('✅ Marca creada con ID:', id);

        res.json({
            success: true,
            data: {
                id,
                nombre: nombre.trim(),
                logo_emoji: logoEmojiFinal,
                icono_path: iconoPath,
                tipo_icono: tipoIconoFinal
            },
            message: 'Marca creada exitosamente'
        });

    } catch (error) {
        console.error('❌ Error creando marca:', error);
        
        // Si hubo error y se subió archivo, eliminarlo
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
                console.log('🗑️ Archivo eliminado por error:', req.file.filename);
            } catch (unlinkError) {
                console.error('Error eliminando archivo:', unlinkError);
            }
        }
        
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ success: false, message: 'La marca ya existe' });
        } else {
            res.status(500).json({ success: false, message: error.message });
        }
    }
});

// Actualizar marca existente (con soporte para imágenes)
router.put('/marcas/:id', upload.single('icono'), async (req, res) => {
    try {
        const marcaId = parseInt(req.params.id);
        const { nombre, logo_emoji, tipo_icono } = req.body;
        
        console.log('📝 Actualizando marca ID:', marcaId);
        console.log('📥 Datos:', { nombre, logo_emoji, tipo_icono });
        console.log('📁 Nuevo archivo:', req.file ? req.file.filename : 'ninguno');
        
        if (!nombre || nombre.trim().length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'El nombre es requerido' 
            });
        }

        // Obtener marca actual
        const marcaActual = await catalogosService.obtenerMarcaPorId(marcaId);
        if (!marcaActual) {
            return res.status(404).json({
                success: false,
                message: 'Marca no encontrada'
            });
        }

        let iconoPath = marcaActual.icono_path;
        let tipoIconoFinal = tipo_icono || marcaActual.tipo_icono;
        let logoEmojiFinal = logo_emoji || marcaActual.logo_emoji;

        // Si se subió nueva imagen
        if (req.file) {
            // Eliminar imagen anterior si existe
            if (marcaActual.icono_path) {
                const rutaAnterior = path.join(__dirname, '..', 'public', 'logos', marcaActual.icono_path);
                try {
                    if (fs.existsSync(rutaAnterior)) {
                        fs.unlinkSync(rutaAnterior);
                        console.log('🗑️ Imagen anterior eliminada:', marcaActual.icono_path);
                    }
                } catch (error) {
                    console.log('⚠️ No se pudo eliminar imagen anterior:', error.message);
                }
            }
            
            iconoPath = req.file.filename;
            tipoIconoFinal = 'imagen';
            console.log('✅ Nueva imagen guardada:', iconoPath);
        }

        // Actualizar en base de datos
        const actualizado = await catalogosService.actualizarMarca(marcaId, {
            nombre: nombre.trim(),
            logo_emoji: logoEmojiFinal,
            icono_path: iconoPath,
            tipo_icono: tipoIconoFinal
        });

        if (actualizado) {
            res.json({
                success: true,
                data: {
                    id: marcaId,
                    nombre: nombre.trim(),
                    logo_emoji: logoEmojiFinal,
                    icono_path: iconoPath,
                    tipo_icono: tipoIconoFinal
                },
                message: 'Marca actualizada exitosamente'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'No se pudo actualizar la marca'
            });
        }
        
    } catch (error) {
        console.error('❌ Error actualizando marca:', error);
        
        // Si hubo error y se subió archivo, eliminarlo
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
                console.log('🗑️ Archivo eliminado por error:', req.file.filename);
            } catch (unlinkError) {
                console.error('Error eliminando archivo:', unlinkError);
            }
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor'
        });
    }
});

router.delete('/marcas/:id', async (req, res) => {
    try {
        await catalogosService.eliminarMarca(req.params.id);
        res.json({ success: true, message: 'Marca eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== MODELOS =====
router.get('/modelos/marca/:marcaId', async (req, res) => {
    try {
        const modelos = await catalogosService.obtenerModelosPorMarca(req.params.marcaId);
        res.json({ success: true, data: modelos });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/modelos', async (req, res) => {
    try {
        const { marca_id, nombre } = req.body;
        
        if (!marca_id || !nombre) {
            return res.status(400).json({ success: false, message: 'Marca y nombre son requeridos' });
        }

        const id = await catalogosService.crearModelo(marca_id, nombre);
        res.json({ success: true, data: { id, marca_id, nombre } });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ success: false, message: 'El modelo ya existe para esta marca' });
        } else {
            res.status(500).json({ success: false, message: error.message });
        }
    }
});

router.put('/modelos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, marca_id } = req.body;
        
        if (!nombre || !marca_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nombre y marca_id son requeridos' 
            });
        }

        // Verificar que el modelo existe
        const { executeQuery } = require('../config/database');
        const [modeloExistente] = await executeQuery(
            'SELECT id FROM modelos WHERE id = ?', [id]
        );
        
        if (!modeloExistente) {
            return res.status(404).json({
                success: false,
                message: 'Modelo no encontrado'
            });
        }

        // Actualizar modelo
        await executeQuery(
            'UPDATE modelos SET nombre = ?, marca_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [nombre.trim(), marca_id, id]
        );

        res.json({
            success: true,
            data: { id: parseInt(id), nombre: nombre.trim(), marca_id },
            message: 'Modelo actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error actualizando modelo:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ 
                success: false, 
                message: 'El modelo ya existe para esta marca' 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    }
});

router.delete('/modelos/:id', async (req, res) => {
    try {
        await catalogosService.eliminarModelo(req.params.id);
        res.json({ success: true, message: 'Modelo eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== AVERÍAS =====
router.get('/averias', async (req, res) => {
    try {
        const averias = await catalogosService.obtenerAverias();
        res.json({ success: true, data: averias });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/averias/modelo/:modeloId/frecuentes', async (req, res) => {
    try {
        const limite = parseInt(req.query.limite) || 5;
        const frecuentes = await catalogosService.obtenerAveriasFrecuentesPorModelo(req.params.modeloId, limite);
        res.json({ success: true, data: frecuentes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/averias', async (req, res) => {
    try {
        const { nombre, descripcion, categoria_id } = req.body;
        
        if (!nombre) {
            return res.status(400).json({ success: false, message: 'Nombre es requerido' });
        }

        const id = await catalogosService.crearAveria(nombre, descripcion, categoria_id);
        res.json({ success: true, data: { id, nombre, descripcion, categoria_id } });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ success: false, message: 'La avería ya existe' });
        } else {
            res.status(500).json({ success: false, message: error.message });
        }
    }
});

// ===== REPARACIONES =====
router.get('/reparaciones/modelo/:modeloId', async (req, res) => {
    try {
        const reparaciones = await catalogosService.obtenerReparacionesPorModelo(req.params.modeloId);
        res.json({ success: true, data: reparaciones });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/reparaciones/modelo/:modeloId/populares', async (req, res) => {
    try {
        const limite = parseInt(req.query.limite) || 5;
        const populares = await catalogosService.obtenerReparacionesPopularesPorModelo(req.params.modeloId, limite);
        res.json({ success: true, data: populares });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/reparaciones', async (req, res) => {
    try {
        const { modelo_id, nombre, descripcion, precio, tipo, tiempo_estimado } = req.body;
        
        if (!modelo_id || !nombre || !precio || !tipo) {
            return res.status(400).json({ success: false, message: 'Campos requeridos incompletos' });
        }

        const id = await catalogosService.crearReparacionModelo(modelo_id, {
            nombre, descripcion, precio, tipo, tiempo_estimado
        });
        res.json({ success: true, data: { id } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/reparaciones/:id', async (req, res) => {
    try {
        await catalogosService.actualizarReparacion(req.params.id, req.body);
        res.json({ success: true, message: 'Reparación actualizada exitosamente' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/reparaciones/:id', async (req, res) => {
    try {
        await catalogosService.eliminarReparacion(req.params.id);
        res.json({ success: true, message: 'Reparación eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== CONTADORES =====
router.post('/averias/:id/incrementar-uso', async (req, res) => {
    try {
        await catalogosService.incrementarContadorAveriaGlobal(req.params.id);
        res.json({ success: true, message: 'Contador incrementado' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/averias/:averiaId/modelo/:modeloId/registrar-uso', async (req, res) => {
    try {
        await catalogosService.registrarUsoAveriaEnModelo(req.params.modeloId, req.params.averiaId);
        res.json({ success: true, message: 'Uso registrado en modelo' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/reparaciones/:id/incrementar-uso', async (req, res) => {
    try {
        await catalogosService.incrementarContadorReparacion(req.params.id);
        res.json({ success: true, message: 'Contador incrementado' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== INTERVENCIONES =====
// Endpoint con query parameters (para el frontend)
router.get('/intervenciones/filtradas', async (req, res) => {
  try {
    const { averia_id, modelo_id } = req.query;
    
    if (!averia_id || !modelo_id) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren los parámetros averia_id y modelo_id'
      });
    }

    const intervenciones = await catalogosService.obtenerIntervencionesPorAveriaYModelo(averia_id, modelo_id);
    res.json({
      success: true,
      data: intervenciones,
      message: `Encontradas ${intervenciones.length} intervenciones para avería ${averia_id} y modelo ${modelo_id}`
    });
  } catch (error) {
    console.error('Error obteniendo intervenciones filtradas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Endpoint con path parameters (compatibilidad)
router.get('/intervenciones/averia/:averiaId/modelo/:modeloId', async (req, res) => {
  try {
    const { averiaId, modeloId } = req.params;
    const intervenciones = await catalogosService.obtenerIntervencionesPorAveriaYModelo(averiaId, modeloId);
    res.json({
      success: true,
      data: intervenciones,
      message: `Encontradas ${intervenciones.length} intervenciones para avería ${averiaId} y modelo ${modeloId}`
    });
  } catch (error) {
    console.error('Error obteniendo intervenciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

router.get('/intervenciones', async (req, res) => {
  try {
    const intervenciones = await catalogosService.obtenerTodasIntervenciones();
    res.json({
      success: true,
      data: intervenciones,
      message: `Encontradas ${intervenciones.length} intervenciones`
    });
  } catch (error) {
    console.error('Error obteniendo todas las intervenciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

router.post('/intervenciones', async (req, res) => {
  try {
    console.log('📥 POST /intervenciones - Datos recibidos:', JSON.stringify(req.body, null, 2));
    
    const { modelo_id, averia_id, nombre, descripcion, precio_base, tipo, tiempo_estimado_minutos, dificultad, requiere_especialista, garantia_dias } = req.body;
    
    if (!modelo_id || !averia_id || !nombre || !precio_base) {
      console.log('❌ Validación fallida:', { modelo_id, averia_id, nombre, precio_base });
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: modelo_id, averia_id, nombre, precio_base'
      });
    }

    const datos = {
      modelo_id,
      averia_id,
      nombre,
      descripcion,
      precio_base,
      tipo: tipo || 'mano_obra',
      tiempo_estimado_minutos: tiempo_estimado_minutos || 60,
      dificultad: dificultad || 'media',
      requiere_especialista: requiere_especialista || 0,
      garantia_dias: garantia_dias || 30,
      activo: 1,
      establecimiento_id: 1,
      created_by: 1
    };

    const resultado = await catalogosService.crearIntervencion(datos);
    
    res.status(201).json({
      success: true,
      data: { id: resultado.insertId, ...datos },
      message: 'Intervención creada exitosamente'
    });
  } catch (error) {
    console.error('Error creando intervención:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        success: false,
        message: 'Ya existe una intervención con ese concepto para esta avería y modelo'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
});

router.put('/intervenciones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const datos = req.body;
    
    await catalogosService.actualizarIntervencion(id, datos);
    
    res.json({
      success: true,
      message: 'Intervención actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando intervención:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

router.delete('/intervenciones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await catalogosService.eliminarIntervencion(id);
    
    res.json({
      success: true,
      message: 'Intervención eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando intervención:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// ===== PLANTILLAS DINÁMICAS =====
router.get('/plantillas', async (req, res) => {
  try {
    console.log('📋 Generando plantillas dinámicas desde averías...');
    
    const averias = await catalogosService.obtenerAverias();
    console.log(`📊 Encontradas ${averias.length} averías en BD`);
    
    if (averias.length === 0) {
      return res.json({
        success: true,
        data: [],
        categorias: [],
        message: 'No hay averías en la base de datos - no se pueden generar plantillas'
      });
    }

    // Mapear averías a plantillas con IDs reales - USAR CATEGORÍAS DE BD
    const plantillasDinamicas = averias.map(averia => ({
      id: `averia-${averia.id}`,
      averia_id: averia.id, // ID real de la avería
      nombre: averia.nombre, // 🔧 USAR EXACTAMENTE el nombre de la BD
      descripcion: averia.descripcion || `Diagnóstico para: ${averia.nombre}`,
      categoria: averia.categoria_nombre || 'otros', // 🔧 USAR categoría de BD
      icono: averia.categoria_icono || '🔧', // 🔧 USAR icono de BD
      color: averia.categoria_color || 'gray', // 🔧 USAR color de BD
      tipo_servicio: 'reparacion',
      problemas_reportados: [averia.nombre], // 🔧 USAR EXACTAMENTE el nombre de la BD
      sintomas_adicionales: averia.descripcion || `Problema detectado: ${averia.nombre}`,
      prioridad: 'normal',
      requiere_backup: ['pantalla', 'software'].includes(averia.categoria_nombre),
      observaciones_tecnicas: `Revisar ${averia.nombre.toLowerCase()}. Verificar estado general del dispositivo.`,
      frecuencia_uso: averia.veces_usada || 0,
      tiempo_estimado: 1.5,
      precio_aproximado: null
    }));

    // 🔧 USAR CATEGORÍAS REALES DE LA BD
    // Extraer categorías únicas de las averías y agrupar plantillas
    const categoriasUsadas = [...new Set(averias.map(a => a.categoria_nombre).filter(Boolean))];
    
    const categoriasDinamicas = categoriasUsadas.map(categoriaNombre => {
      // Encontrar la primera avería de esta categoría para obtener info completa
      const averiaEjemplo = averias.find(a => a.categoria_nombre === categoriaNombre);
      
      return {
        id: categoriaNombre,
        nombre: categoriaNombre.charAt(0).toUpperCase() + categoriaNombre.slice(1),
        icono: averiaEjemplo.categoria_icono || '🔧',
        color: averiaEjemplo.categoria_color || 'gray',
        plantillas: plantillasDinamicas.filter(p => p.categoria === categoriaNombre)
      };
    }).filter(categoria => categoria.plantillas.length > 0);

    console.log(`✅ Generadas ${plantillasDinamicas.length} plantillas en ${categoriasDinamicas.length} categorías`);

    res.json({
      success: true,
      data: plantillasDinamicas,
      categorias: categoriasDinamicas,
      message: `Plantillas generadas dinámicamente desde ${averias.length} averías`
    });

  } catch (error) {
    console.error('❌ Error generando plantillas:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando plantillas dinámicas',
      error: error.message
    });
  }
});

// Funciones helper eliminadas - ahora se usan categorías predefinidas con iconos y colores fijos

// ===== CATEGORÍAS DE AVERÍAS =====
router.get('/categorias-averias', async (req, res) => {
  try {
    const categorias = await catalogosService.obtenerCategoriasAverias();
    res.json({
      success: true,
      data: categorias
    });
  } catch (error) {
    console.error('Error obteniendo categorías de averías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

router.post('/categorias-averias', async (req, res) => {
  try {
    const { nombre, descripcion, icono, color } = req.body;
    
    if (!nombre?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la categoría es requerido'
      });
    }

    const resultado = await catalogosService.crearCategoriaAveria({
      nombre: nombre.trim(),
      descripcion: descripcion?.trim(),
      icono: icono || '🔧',
      color: color || 'gray'
    });

    res.status(201).json({
      success: true,
      data: { id: resultado.insertId },
      message: 'Categoría creada exitosamente'
    });
  } catch (error) {
    console.error('Error creando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// ===== ESTADOS =====
router.get('/estados', async (req, res) => {
  try {
    const { categoria } = req.query;
    const resultado = await catalogosService.obtenerEstados(categoria);
    res.json(resultado);
  } catch (error) {
    console.error('Error obteniendo estados:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

router.post('/estados', async (req, res) => {
  try {
    const resultado = await catalogosService.crearEstado(req.body);
    res.status(201).json(resultado);
  } catch (error) {
    console.error('Error creando estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

router.put('/estados/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await catalogosService.actualizarEstado(parseInt(id), req.body);
    res.json(resultado);
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

router.delete('/estados/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await catalogosService.eliminarEstado(parseInt(id));
    res.json(resultado);
  } catch (error) {
    console.error('Error eliminando estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;
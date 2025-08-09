// hooks/useSugerenciasInteligentes.ts - REFACTORIZADO PARA USAR BD REAL
import { useState, useCallback, useEffect } from 'react';
import type { ClienteData } from '../types/Cliente';
import type { DispositivoData } from '../types/Dispositivo';
import type { PlantillaReparacion } from '../types/PlantillaReparacion';
// PLANTILLAS_PREDEFINIDAS eliminado - usar plantillas dinámicas de BD

// Tipos para los datos reales de la BD
interface ReparacionBD {
  id: number;
  numero_orden: string;
  cliente_id: number;
  fecha_creacion: string;
  estado: string;
  total: number;
  cliente: ClienteData;
  dispositivos: DispositivoData[];
  diagnosticos?: Array<{
    problemas_reportados: string[];
    tipo_servicio: string;
    prioridad: string;
  }>;
  presupuestos?: Array<{
    items: Array<{
      concepto: string;
      precio: number;
      cantidad: number;
      tipo: string;
    }>;
  }>;
}

export interface SugerenciaCliente {
  tipo: 'cliente_frecuente' | 'cliente_reciente';
  cliente: ClienteData;
  frecuencia?: number;
  ultimaReparacion?: Date;
  dispositivos_comunes?: string[];
}

export interface SugerenciaDispositivo {
  tipo: 'dispositivo_popular' | 'dispositivo_cliente';
  marca: string;
  modelo: string;
  frecuencia: number;
  cliente_relacionado?: string;
}

export interface SugerenciaPlantilla {
  tipo: 'plantilla_popular' | 'plantilla_marca' | 'plantilla_cliente' | 'plantilla_modelo';
  plantilla: PlantillaReparacion;
  razon: string;
  confianza: number; // 0-100
}

export interface HistorialReparacion {
  id: number;
  cliente: ClienteData;
  dispositivos: DispositivoData[];
  plantillas_usadas: string[];
  fecha: Date;
  total: number;
}

export const useSugerenciasInteligentes = () => {
  const [historial, setHistorial] = useState<HistorialReparacion[]>([]);
  const [cargandoSugerencias, setCargandoSugerencias] = useState(false);
  const [plantillasDinamicas, setPlantillasDinamicas] = useState<PlantillaReparacion[]>([]);

  // ✅ Cargar historial REAL y plantillas dinámicas desde la base de datos
  const cargarHistorialReal = useCallback(async () => {
    try {
      setCargandoSugerencias(true);
      console.log('🔄 Cargando historial real desde BD...');

      // Cargar historial
      const response = await fetch('http://localhost:5001/api/reparaciones?estado=entregada&incluir_detalles=true');
      const data = await response.json();

      if (data.success && data.data) {
        // Convertir datos de BD al formato del historial
        const historialConvertido: HistorialReparacion[] = data.data.map((reparacion: ReparacionBD) => ({
          id: reparacion.id,
          cliente: reparacion.cliente,
          dispositivos: reparacion.dispositivos,
          plantillas_usadas: reparacion.diagnosticos?.flatMap(d => d.problemas_reportados) || [],
          fecha: new Date(reparacion.fecha_creacion),
          total: reparacion.total
        }));

        setHistorial(historialConvertido);
        console.log(`✅ Historial real cargado: ${historialConvertido.length} reparaciones`);
      } else {
        console.log('ℹ️ No hay reparaciones completadas aún');
        setHistorial([]);
      }

      // 🔧 NUEVO: Cargar plantillas dinámicas
      const plantillasResponse = await fetch('http://localhost:5001/api/catalogos/plantillas');
      const plantillasData = await plantillasResponse.json();
      
      if (plantillasData.success && plantillasData.data) {
        setPlantillasDinamicas(plantillasData.data);
        console.log(`✅ Plantillas dinámicas cargadas: ${plantillasData.data.length} plantillas`);
      }

    } catch (error) {
      console.error('❌ Error cargando historial real:', error);
      // Si falla la conexión, usar arrays vacíos
      setHistorial([]);
      setPlantillasDinamicas([]);
    } finally {
      setCargandoSugerencias(false);
    }
  }, []);

  // Cargar historial real al montar el hook
  useEffect(() => {
    cargarHistorialReal();
  }, [cargarHistorialReal]);


  // ✅ Obtener sugerencias de clientes
  const obtenerSugerenciasClientes = useCallback((terminoBusqueda?: string): SugerenciaCliente[] => {
    if (!historial.length) return [];

    // Agrupar por cliente
    const clientesMap = new Map<string, { cliente: ClienteData; reparaciones: HistorialReparacion[] }>();

    historial.forEach(reparacion => {
      const key = reparacion.cliente.dni;
      if (!clientesMap.has(key)) {
        clientesMap.set(key, { cliente: reparacion.cliente, reparaciones: [] });
      }
      clientesMap.get(key)!.reparaciones.push(reparacion);
    });

    const sugerencias: SugerenciaCliente[] = [];

    clientesMap.forEach(({ cliente, reparaciones }) => {
      // Cliente frecuente (más de 1 reparación)
      if (reparaciones.length > 1) {
        const dispositivos_comunes = reparaciones
          .flatMap(r => r.dispositivos && Array.isArray(r.dispositivos) ? 
            r.dispositivos.filter(d => d && d.marca && d.modelo).map(d => `${d.marca} ${d.modelo}`) : 
            []
          )
          .filter((dispositivo, index, arr) => arr.indexOf(dispositivo) !== index); // Solo duplicados

        sugerencias.push({
          tipo: 'cliente_frecuente',
          cliente,
          frecuencia: reparaciones.length,
          ultimaReparacion: new Date(Math.max(...reparaciones.map(r => r.fecha.getTime()))),
          dispositivos_comunes: [...new Set(dispositivos_comunes)]
        });
      } else {
        // Cliente reciente
        const ultimaReparacion = reparaciones[0].fecha;
        const diasDesdeUltima = (Date.now() - ultimaReparacion.getTime()) / (1000 * 60 * 60 * 24);
        
        if (diasDesdeUltima <= 30) { // Menos de 30 días
          sugerencias.push({
            tipo: 'cliente_reciente',
            cliente,
            ultimaReparacion
          });
        }
      }
    });

    // Filtrar por término de búsqueda si se proporciona
    if (terminoBusqueda) {
      const termino = terminoBusqueda.toLowerCase();
      return sugerencias.filter(s => 
        s.cliente.nombre.toLowerCase().includes(termino) ||
        s.cliente.apellidos.toLowerCase().includes(termino) ||
        s.cliente.dni.toLowerCase().includes(termino) ||
        s.cliente.telefono.includes(termino)
      );
    }

    // Ordenar por relevancia
    return sugerencias.sort((a, b) => {
      if (a.tipo === 'cliente_frecuente' && b.tipo === 'cliente_reciente') return -1;
      if (a.tipo === 'cliente_reciente' && b.tipo === 'cliente_frecuente') return 1;
      
      if (a.tipo === 'cliente_frecuente' && b.tipo === 'cliente_frecuente') {
        return (b.frecuencia || 0) - (a.frecuencia || 0);
      }
      
      return (b.ultimaReparacion?.getTime() || 0) - (a.ultimaReparacion?.getTime() || 0);
    }).slice(0, 5); // Top 5
  }, [historial]);

  // ✅ Obtener sugerencias de dispositivos
  const obtenerSugerenciasDispositivos = useCallback((clienteSeleccionado?: ClienteData): SugerenciaDispositivo[] => {
    if (!historial.length) return [];

    const dispositivosMap = new Map<string, { marca: string; modelo: string; frecuencia: number; clientes: Set<string> }>();

    historial.forEach(reparacion => {
      if (reparacion.dispositivos && Array.isArray(reparacion.dispositivos)) {
        reparacion.dispositivos.forEach(dispositivo => {
          if (dispositivo && dispositivo.marca && dispositivo.modelo) {
            const key = `${dispositivo.marca}-${dispositivo.modelo}`;
            if (!dispositivosMap.has(key)) {
              dispositivosMap.set(key, {
                marca: dispositivo.marca,
                modelo: dispositivo.modelo,
                frecuencia: 0,
                clientes: new Set()
              });
            }
            const entry = dispositivosMap.get(key)!;
            entry.frecuencia++;
            entry.clientes.add(reparacion.cliente.dni);
          }
        });
      }
    });

    const sugerencias: SugerenciaDispositivo[] = [];

    // Sugerencias específicas del cliente
    if (clienteSeleccionado) {
      const reparacionesCliente = historial.filter(r => r.cliente.dni === clienteSeleccionado.dni);
      const dispositivosCliente = new Set(
        reparacionesCliente.flatMap(r => 
          r.dispositivos && Array.isArray(r.dispositivos) ? 
            r.dispositivos.filter(d => d && d.marca && d.modelo).map(d => `${d.marca} ${d.modelo}`) : 
            []
        )
      );

      dispositivosCliente.forEach(dispositivo => {
        const [marca, modelo] = dispositivo.split(' ');
        sugerencias.push({
          tipo: 'dispositivo_cliente',
          marca,
          modelo,
          frecuencia: reparacionesCliente.filter(r => 
            r.dispositivos && Array.isArray(r.dispositivos) && r.dispositivos.some(d => 
              d && d.marca && d.modelo && d.marca === marca && d.modelo === modelo
            )
          ).length,
          cliente_relacionado: `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellidos}`
        });
      });
    }

    // Dispositivos populares generales
    Array.from(dispositivosMap.values())
      .sort((a, b) => b.frecuencia - a.frecuencia)
      .slice(0, 5)
      .forEach(({ marca, modelo, frecuencia }) => {
        if (!clienteSeleccionado || !sugerencias.some(s => s.marca === marca && s.modelo === modelo)) {
          sugerencias.push({
            tipo: 'dispositivo_popular',
            marca,
            modelo,
            frecuencia
          });
        }
      });

    return sugerencias.slice(0, 8); // Top 8 total
  }, [historial]);

  // ✅ Obtener sugerencias de plantillas basadas en datos REALES del modelo específico
  const obtenerSugerenciasPlantillas = useCallback((
    clienteSeleccionado?: ClienteData,
    dispositivoSeleccionado?: { marca: string; modelo: string }
  ): SugerenciaPlantilla[] => {
    const sugerencias: SugerenciaPlantilla[] = [];

    // 🎯 SUGERENCIAS BASADAS EN MODELO ESPECÍFICO (PRIORIDAD MÁXIMA)
    if (dispositivoSeleccionado) {
      console.log(`🔍 Buscando averías del modelo: ${dispositivoSeleccionado.marca} ${dispositivoSeleccionado.modelo}`);
      
      // Filtrar reparaciones del modelo exacto
      const reparacionesModelo = historial.filter(r => 
        r.dispositivos && Array.isArray(r.dispositivos) && r.dispositivos.some(d => 
          d && d.marca && d.modelo &&
          d.marca.toLowerCase() === dispositivoSeleccionado.marca.toLowerCase() &&
          d.modelo.toLowerCase() === dispositivoSeleccionado.modelo.toLowerCase()
        )
      );

      console.log(`📊 Encontradas ${reparacionesModelo.length} reparaciones del modelo`);

      if (reparacionesModelo.length > 0) {
        // Extraer todas las averías/problemas reportados del modelo específico
        const averiasModelo = reparacionesModelo.flatMap(r => r.plantillas_usadas);
        
        // Contar frecuencia de cada avería
        const frecuenciaAverias = averiasModelo.reduce((acc, averia) => {
          acc[averia] = (acc[averia] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        console.log('📈 Frecuencia de averías por modelo:', frecuenciaAverias);

        // Convertir a array y ordenar por frecuencia (maneja empates manteniendo orden alfabético)
        const averiasOrdenadas = Object.entries(frecuenciaAverias)
          .sort((a, b) => {
            // Primero por frecuencia (descendente)
            if (b[1] !== a[1]) {
              return b[1] - a[1];
            }
            // En caso de empate, orden alfabético para consistencia
            return a[0].localeCompare(b[0]);
          })
          .slice(0, 4); // Máximo 4 sugerencias

        console.log('🏆 Top averías ordenadas:', averiasOrdenadas);

        // Crear sugerencias basadas en datos reales usando plantillas dinámicas
        averiasOrdenadas.forEach(([averiaId, frecuencia], index) => {
          // Buscar plantilla por nombre de avería en plantillas dinámicas
          const plantilla = plantillasDinamicas.find(p => p.nombre === averiaId);
          if (plantilla) {
            const porcentaje = Math.round((frecuencia / reparacionesModelo.length) * 100);
            const posicion = index + 1;
            
            sugerencias.push({
              tipo: 'plantilla_modelo',
              plantilla,
              razon: `#${posicion} más común en ${dispositivoSeleccionado.marca} ${dispositivoSeleccionado.modelo} (${frecuencia}/${reparacionesModelo.length} casos - ${porcentaje}%)`,
              confianza: Math.min(95, 80 + (frecuencia * 3)) // Alta confianza para datos reales
            });
          }
        });

        console.log(`✅ Generadas ${sugerencias.length} sugerencias basadas en modelo específico`);
      } else {
        console.log('ℹ️ No hay historial para este modelo específico');
      }
    }

    // 👤 SUGERENCIAS BASADAS EN CLIENTE (solo si no hay suficientes del modelo)
    if (clienteSeleccionado && sugerencias.length < 4) {
      const reparacionesCliente = historial.filter(r => r.cliente.dni === clienteSeleccionado.dni);
      const plantillasUsadas = reparacionesCliente.flatMap(r => r.plantillas_usadas);
      
      const plantillasFreq = plantillasUsadas.reduce((acc, plantillaId) => {
        acc[plantillaId] = (acc[plantillaId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(plantillasFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4 - sugerencias.length)
        .forEach(([plantillaId, frecuencia]) => {
          // Buscar plantilla por nombre en plantillas dinámicas
          const plantilla = plantillasDinamicas.find(p => p.nombre === plantillaId);
          if (plantilla && !sugerencias.some(s => s.plantilla.id === plantilla.id)) {
            sugerencias.push({
              tipo: 'plantilla_cliente',
              plantilla,
              razon: `${clienteSeleccionado.nombre} ha usado esta plantilla ${frecuencia} vez${frecuencia > 1 ? 'es' : ''}`,
              confianza: Math.min(85, 60 + (frecuencia * 10))
            });
          }
        });
    }

    // ❌ NO AGREGAR SUGERENCIAS PREDEFINIDAS
    // Solo mostrar sugerencias basadas en datos reales de la BD

    // Ordenar por confianza (modelo específico tendrá mayor confianza)
    const sugerenciasFinales = sugerencias
      .sort((a, b) => b.confianza - a.confianza)
      .slice(0, 4);

    console.log(`🎯 Sugerencias finales generadas: ${sugerenciasFinales.length}`);
    return sugerenciasFinales;
  }, [historial, plantillasDinamicas]);

  // ✅ Guardar nueva reparación en historial (actualiza desde BD real)
  const guardarReparacionEnHistorial = useCallback(async (reparacion: Omit<HistorialReparacion, 'id'>) => {
    try {
      console.log('💾 Nueva reparación completada, recargando historial desde BD...');
      
      // En lugar de agregar manualmente, recargar desde BD para mantener sincronización
      await cargarHistorialReal();
      
      console.log('✅ Historial actualizado con datos reales');
    } catch (error) {
      console.error('❌ Error actualizando historial después de nueva reparación:', error);
    }
  }, [cargarHistorialReal]);

  return {
    historial,
    cargandoSugerencias,
    obtenerSugerenciasClientes,
    obtenerSugerenciasDispositivos,
    obtenerSugerenciasPlantillas,
    guardarReparacionEnHistorial,
    refrescarHistorial: cargarHistorialReal // Para refrescar manualmente si es necesario
  };
};
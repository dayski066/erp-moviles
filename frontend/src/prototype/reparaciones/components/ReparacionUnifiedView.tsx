import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReparacionFlow } from '../hooks/useReparacionFlow';
import { ClienteSection } from './ClienteSection/ClienteSection';
import { DispositivosSection } from './DispositivosSection/DispositivosSection';
import { DiagnosticoPresupuestoSection } from './DiagnosticoPresupuesto/DiagnosticoPresupuestoSection';
import { LiveSummary } from './Shared/LiveSummary';
import { ProgressIndicator } from './Shared/ProgressIndicator';
import { 
  UserIcon, 
  DevicePhoneMobileIcon, 
  WrenchScrewdriverIcon 
} from '@heroicons/react/24/outline';

interface ReparacionUnifiedViewProps {
  reparacionId?: string; // Para modo edición
  clienteId?: string; // Para pre-cargar cliente
}

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const ReparacionUnifiedView: React.FC<ReparacionUnifiedViewProps> = ({
  reparacionId,
  clienteId
}) => {
  const {
    cliente,
    dispositivos,
    diagnosticos,
    seccionActiva,
    progress,
    isValid,
    loadingStates,
    setSeccionActiva,
    canProceed
  } = useReparacionFlow();

  // Cargar datos iniciales si es modo edición
  useEffect(() => {
    if (reparacionId) {
      // TODO: Cargar reparación existente
      console.log('Cargando reparación:', reparacionId);
    }
  }, [reparacionId]);

  // Auto-avanzar secciones cuando se completan
  useEffect(() => {
    if (seccionActiva === 'cliente' && canProceed()) {
      setSeccionActiva('dispositivos');
    } else if (seccionActiva === 'dispositivos' && canProceed()) {
      setSeccionActiva('diagnostico');
    }
  }, [seccionActiva, canProceed, setSeccionActiva]);

  const sections = [
    {
      id: 'cliente',
      title: 'Cliente',
      icon: UserIcon,
      isActive: seccionActiva === 'cliente',
      isCompleted: !!cliente && canProceed(),
      isDisabled: false
    },
    {
      id: 'dispositivos',
      title: 'Dispositivos',
      icon: DevicePhoneMobileIcon,
      isActive: seccionActiva === 'dispositivos',
      isCompleted: dispositivos.length > 0 && canProceed(),
      isDisabled: !cliente
    },
    {
      id: 'diagnostico',
      title: 'Diagnóstico y Presupuesto',
      icon: WrenchScrewdriverIcon,
      isActive: seccionActiva === 'diagnostico',
      isCompleted: diagnosticos.size > 0 && canProceed(),
      isDisabled: dispositivos.length === 0
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con progreso */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Nueva Reparación
              </h1>
              {reparacionId && (
                <span className="text-sm text-gray-500">
                  Editando #{reparacionId}
                </span>
              )}
            </div>
            
                         <ProgressIndicator 
               progress={progress}
               sections={sections}
               onSectionClick={(sectionId: string) => {
                 if (!sections.find(s => s.id === sectionId)?.isDisabled) {
                   setSeccionActiva(sectionId as 'cliente' | 'dispositivos' | 'diagnostico');
                 }
               }}
             />
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Área de trabajo principal */}
          <div className="lg:col-span-8">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {/* Sección Cliente */}
              <AnimatePresence mode="wait">
                {seccionActiva === 'cliente' && (
                  <motion.div
                    key="cliente"
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <ClienteSection />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sección Dispositivos */}
              <AnimatePresence mode="wait">
                {seccionActiva === 'dispositivos' && (
                  <motion.div
                    key="dispositivos"
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <DispositivosSection />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sección Diagnóstico y Presupuesto */}
              <AnimatePresence mode="wait">
                {seccionActiva === 'diagnostico' && (
                  <motion.div
                    key="diagnostico"
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <DiagnosticoPresupuestoSection />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Sidebar con resumen */}
          <div className="lg:col-span-4">
            <div className="sticky top-8">
              <LiveSummary 
                cliente={cliente}
                dispositivos={dispositivos}
                diagnosticos={diagnosticos}
                progress={progress}
                isValid={isValid}
                loadingStates={loadingStates}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Indicadores de estado */}
      {loadingStates.guardando && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Guardando...</span>
          </div>
        </div>
      )}

      {/* Error de guardado */}
      {loadingStates.guardando === false && progress > 0 && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <span>✓ Guardado automáticamente</span>
          </div>
        </div>
      )}
    </div>
  );
}; 
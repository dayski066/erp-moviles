import React from 'react';
import { ReparacionUnifiedView } from './components/ReparacionUnifiedView';

interface ReparacionesPrototypeProps {
  reparacionId?: string;
  clienteId?: string;
}

export const ReparacionesPrototype: React.FC<ReparacionesPrototypeProps> = ({
  reparacionId,
  clienteId
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <ReparacionUnifiedView 
        reparacionId={reparacionId}
        clienteId={clienteId}
      />
    </div>
  );
};

export default ReparacionesPrototype; 
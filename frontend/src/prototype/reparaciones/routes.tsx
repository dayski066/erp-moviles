import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ReparacionesPrototype from './index';

export const ReparacionesRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/prototype/reparaciones/nueva" element={<ReparacionesPrototype />} />
      <Route path="/prototype/reparaciones/editar/:id" element={<ReparacionesPrototype />} />
      <Route path="/prototype/reparaciones/cliente/:clienteId" element={<ReparacionesPrototype />} />
    </Routes>
  );
}; 
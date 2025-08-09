import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout/Layout';

// Importar sistema de notificaciones
import { NotificationProvider } from './contexts/NotificationContext';
import NotificationContainer from './components/core/Notifications/NotificationContainer';
import './styles/notifications.css';

// Importar páginas existentes
import NuevaVenta from './pages/Ventas/NuevaVenta';
import NuevaCompra from './pages/Compras/NuevaCompra';
import NuevaReparacion from './pages/Reparaciones/NuevaReparacion';
import EditarReparacion from './pages/Reparaciones/EditarReparacion';
import ListaReparaciones from './pages/Reparaciones/ListaReparaciones';

// 🚀 IMPORTAR PROTOTIPO CONVERSACIONAL
// import ChatRepair from './prototype/ChatRepair';

// 🚀 IMPORTAR SISTEMA DE REPARACIONES V2.0
import ReparacionesPrototype from './prototype/reparaciones';

// Componente para manejar el Layout con Router
const AppWithLayout: React.FC = () => {
  const location = useLocation();
  
  // Usuario simulado (esto vendría de autenticación)
  const user = {
    nombre: 'Juan',
    apellidos: 'Dávila',
    rol: 'Gerente',
    establecimiento: 'Tienda Centro',
    avatar: 'JD'
  };

  return (
    <Layout 
      currentPage={location.pathname}
      user={user}
    >
      <Routes>
        {/* Dashboard */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Ventas */}
        <Route path="/ventas/nueva" element={<NuevaVenta />} />
        <Route path="/ventas/tpv" element={<PaginaEnDesarrollo titulo="TPV / Punto de Venta" />} />
        <Route path="/ventas/historial" element={<PaginaEnDesarrollo titulo="Historial de Ventas" />} />
        
        {/* Compras */}
        <Route path="/compras/usados" element={<NuevaCompra />} />
        <Route path="/compras/historial" element={<PaginaEnDesarrollo titulo="Historial de Compras" />} />
        
        {/* Reparaciones */}
        <Route path="/reparaciones/nueva" element={<NuevaReparacion />} />
        <Route path="/reparaciones" element={<ListaReparaciones />} />
        <Route path="/reparaciones/estados" element={<PaginaEnDesarrollo titulo="Estados y Seguimiento" />} />
        <Route path="/reparaciones/editar/:id/:paso?" element={<EditarReparacion />} />
        
        {/* 🚀 PROTOTIPO CONVERSACIONAL - AISLADO */}
        {/* <Route path="/prototype/chat" element={<ChatRepair />} /> */}
        
        {/* 🚀 SISTEMA DE REPARACIONES V2.0 */}
        <Route path="/prototype/reparaciones/nueva" element={<ReparacionesPrototype />} />
        <Route path="/prototype/reparaciones/editar/:id" element={<ReparacionesPrototype />} />
        <Route path="/prototype/reparaciones/cliente/:clienteId" element={<ReparacionesPrototype />} />
        
        {/* Gestión */}
        <Route path="/gestion/clientes" element={<GestionClientes />} />
        <Route path="/gestion/inventario" element={<PaginaEnDesarrollo titulo="Inventario" />} />
        <Route path="/gestion/proveedores" element={<PaginaEnDesarrollo titulo="Proveedores" />} />
        
        {/* Informes */}
        <Route path="/informes/reportes" element={<PaginaEnDesarrollo titulo="Reportes" />} />
        <Route path="/informes/analytics" element={<PaginaEnDesarrollo titulo="Analytics" />} />
        
        {/* Configuración */}
        <Route path="/configuracion/usuarios" element={<PaginaEnDesarrollo titulo="Usuarios" />} />
        <Route path="/configuracion/sistema" element={<PaginaEnDesarrollo titulo="Configuración del Sistema" />} />
        
        {/* Notificaciones */}
        <Route path="/notifications" element={<PaginaEnDesarrollo titulo="Notificaciones" />} />
        
        {/* Página 404 */}
        <Route path="*" element={<Pagina404 />} />
      </Routes>
    </Layout>
  );
};

// Componente Dashboard
const Dashboard: React.FC = () => {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center">
          <svg className="w-8 h-8 mr-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-9 9a1 1 0 001.414 1.414L10 4.414l8.293 8.293a1 1 0 001.414-1.414l-9-9z"/>
          </svg>
          Dashboard Principal
        </h2>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <a href="/ventas/nueva" className="group">
          <div className="bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 h-full">
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">
                <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                </svg>
              </div>
              <h5 className="text-xl font-bold mb-2">Nueva Venta</h5>
              <p className="text-green-100 text-sm">Registrar venta de productos</p>
            </div>
          </div>
        </a>
        
        <a href="/reparaciones/nueva" className="group">
          <div className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 h-full">
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">
                <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
                </svg>
              </div>
              <h5 className="text-xl font-bold mb-2">Nueva Reparación</h5>
              <p className="text-yellow-100 text-sm">Crear orden de reparación</p>
            </div>
          </div>
        </a>
        
        <a href="/compras/usados" className="group">
          <div className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 h-full">
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">
                <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                </svg>
              </div>
              <h5 className="text-xl font-bold mb-2">Comprar Usado</h5>
              <p className="text-cyan-100 text-sm">Adquisición de dispositivos</p>
            </div>
          </div>
        </a>
        
        <a href="/gestion/clientes" className="group">
          <div className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 h-full">
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">
                <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                </svg>
              </div>
              <h5 className="text-xl font-bold mb-2">Gestión Clientes</h5>
              <p className="text-blue-100 text-sm">Administrar clientes</p>
            </div>
          </div>
        </a>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-green-50 px-6 py-4 border-b border-green-100">
            <h5 className="text-lg font-semibold text-green-800 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              Ventas de Hoy
            </h5>
          </div>
          <div className="p-6">
            <h3 className="text-3xl font-bold text-green-600 mb-2">€2,847</h3>
            <p className="text-gray-600 mb-3">23 transacciones</p>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              +12.5% vs ayer
            </span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-yellow-50 px-6 py-4 border-b border-yellow-100">
            <h5 className="text-lg font-semibold text-yellow-800 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
              </svg>
              Reparaciones Activas
            </h5>
          </div>
          <div className="p-6">
            <h3 className="text-3xl font-bold text-yellow-600 mb-2">47</h3>
            <p className="text-gray-600 mb-3">En proceso</p>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
              3 urgentes
            </span>
          </div>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h5 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
                Actividad Reciente
              </h5>
            </div>
            <div className="divide-y divide-gray-200">
              <div className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h6 className="text-sm font-semibold text-gray-900">Venta completada</h6>
                    <p className="text-sm text-gray-500">iPhone 15 - Juan Pérez</p>
                    <small className="text-xs text-gray-400">hace 5 minutos</small>
                  </div>
                  <div className="text-lg font-bold text-green-600">€899</div>
                </div>
              </div>
              
              <div className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h6 className="text-sm font-semibold text-gray-900">Reparación lista</h6>
                    <p className="text-sm text-gray-500">Samsung Galaxy S23 - Pantalla</p>
                    <small className="text-xs text-gray-400">hace 15 minutos</small>
                  </div>
                  <div className="text-lg font-bold text-yellow-600">€120</div>
                </div>
              </div>
              
              <div className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h6 className="text-sm font-semibold text-gray-900">Dispositivo comprado</h6>
                    <p className="text-sm text-gray-500">iPhone 12 - María García</p>
                    <small className="text-xs text-gray-400">hace 32 minutos</small>
                  </div>
                  <div className="text-lg font-bold text-cyan-600">€450</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h5 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                Alertas
              </h5>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm font-medium text-yellow-800">Stock bajo:</p>
                <p className="text-sm text-yellow-700">Protectores iPhone 15 (2 unidades)</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-800">Reparación urgente:</p>
                <p className="text-sm text-blue-700">Orden #R-20241208-1430</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm font-medium text-red-800">Cliente esperando:</p>
                <p className="text-sm text-red-700">Ana Sánchez - Reparación lista</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para páginas en desarrollo
const PaginaEnDesarrollo: React.FC<{ titulo: string }> = ({ titulo }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-xl shadow-lg">
        <div className="p-12 text-center">
          <div className="mb-6">
            <svg className="w-24 h-24 mx-auto text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">{titulo}</h3>
          <p className="text-gray-600 mb-6">Esta sección está en desarrollo</p>
          <a href="/dashboard" className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-9 9a1 1 0 001.414 1.414L10 4.414l8.293 8.293a1 1 0 001.414-1.414l-9-9z"/>
            </svg>
            Volver al Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};

// Componente GestionClientes
const GestionClientes: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center">
          <svg className="w-8 h-8 mr-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
          </svg>
          Gestión de Clientes
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h5 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h5>
          </div>
          <div className="p-6 space-y-3">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
              </svg>
              Nuevo Cliente
            </button>
            <button className="w-full bg-white hover:bg-gray-50 text-blue-600 font-medium py-3 px-4 rounded-lg border border-blue-600 transition-colors flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
              </svg>
              Buscar Cliente
            </button>
            <button className="w-full bg-white hover:bg-gray-50 text-gray-600 font-medium py-3 px-4 rounded-lg border border-gray-300 transition-colors flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
              Exportar Lista
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h5 className="text-lg font-semibold text-gray-900">Estadísticas</h5>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <h4 className="text-3xl font-bold text-blue-600">247</h4>
                <p className="text-sm text-gray-600">Total Clientes</p>
              </div>
              <div>
                <h4 className="text-3xl font-bold text-green-600">23</h4>
                <p className="text-sm text-gray-600">Nuevos (Mes)</p>
              </div>
              <div>
                <h4 className="text-3xl font-bold text-cyan-600">186</h4>
                <p className="text-sm text-gray-600">Activos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente 404
const Pagina404: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-xl shadow-lg">
        <div className="p-12 text-center">
          <div className="mb-6">
            <svg className="w-24 h-24 mx-auto text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Página no encontrada</h3>
          <p className="text-gray-600 mb-6">La página que buscas no existe</p>
          <a href="/dashboard" className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-9 9a1 1 0 001.414 1.414L10 4.414l8.293 8.293a1 1 0 001.414-1.414l-9-9z"/>
            </svg>
            Ir al Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};

// App principal con Router y NotificationProvider
const App: React.FC = () => {
  return (
    <NotificationProvider>
      <Router>
        <AppWithLayout />
      </Router>
      
      {/* Container de notificaciones flotantes */}
      <NotificationContainer />
    </NotificationProvider>
  );
};

export default App;
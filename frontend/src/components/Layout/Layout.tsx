import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MenuItem, LayoutProps } from "../../types/Layout";

const Layout: React.FC<LayoutProps> = ({ children, currentPage, user }) => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Configuración del menú con iconos SVG
  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: "home",
      path: "/dashboard",
    },
    {
      id: "notifications",
      title: "Notificaciones",
      icon: "bell",
      path: "/notifications",
      badge: "3",
    },
    {
      id: "ventas",
      title: "Ventas",
      icon: "currency",
      path: "/ventas",
      children: [
        {
          id: "tpv",
          title: "TPV / Punto de Venta",
          icon: "cart",
          path: "/ventas/tpv",
        },
        {
          id: "nueva-venta",
          title: "Nueva Venta",
          icon: "plus",
          path: "/ventas/nueva",
        },
        {
          id: "historial-ventas",
          title: "Historial de Ventas",
          icon: "chart",
          path: "/ventas/historial",
        },
      ],
    },
    {
      id: "compras",
      title: "Compras",
      icon: "phone",
      path: "/compras",
      children: [
        {
          id: "compra-usados",
          title: "Comprar Usados",
          icon: "refresh",
          path: "/compras/usados",
        },
        {
          id: "historial-compras",
          title: "Historial de Compras",
          icon: "clipboard",
          path: "/compras/historial",
        },
      ],
    },
    {
      id: "reparaciones",
      title: "Reparaciones",
      icon: "tools",
      path: "/reparaciones",
      children: [
        {
          id: "nueva-reparacion",
          title: "Nueva Reparación",
          icon: "wrench",
          path: "/reparaciones/nueva",
        },
        {
          id: "lista-reparaciones",
          title: "Lista de Reparaciones",
          icon: "list",
          path: "/reparaciones", // ✅ Sin el /lista
        },
        {
          id: "estados-seguimiento",
          title: "Estados y Seguimiento",
          icon: "speedometer",
          path: "/reparaciones/estados",
        },
      ],
    },
    {
      id: "gestion",
      title: "Gestión",
      icon: "folder",
      path: "/gestion",
      children: [
        {
          id: "clientes",
          title: "Clientes",
          icon: "users",
          path: "/gestion/clientes",
        },
        {
          id: "inventario",
          title: "Inventario",
          icon: "boxes",
          path: "/gestion/inventario",
        },
        {
          id: "proveedores",
          title: "Proveedores",
          icon: "building",
          path: "/gestion/proveedores",
        },
      ],
    },
    {
      id: "informes",
      title: "Informes",
      icon: "chart-bar",
      path: "/informes",
      children: [
        {
          id: "reportes",
          title: "Reportes",
          icon: "document-chart",
          path: "/informes/reportes",
        },
        {
          id: "analytics",
          title: "Analytics",
          icon: "target",
          path: "/informes/analytics",
        },
      ],
    },
    {
      id: "configuracion",
      title: "Configuración",
      icon: "cog",
      path: "/configuracion",
      children: [
        {
          id: "usuarios",
          title: "Usuarios",
          icon: "user-circle",
          path: "/configuracion/usuarios",
        },
        {
          id: "sistema",
          title: "Sistema",
          icon: "cpu",
          path: "/configuracion/sistema",
        },
      ],
    },
  ];

  // Función para obtener el breadcrumb
  const getBreadcrumb = (path: string): string[] => {
    const breadcrumbMap: { [key: string]: string[] } = {
      "/dashboard": ["Inicio", "Dashboard"],
      "/ventas/nueva": ["Inicio", "Ventas", "Nueva Venta"],
      "/ventas/tpv": ["Inicio", "Ventas", "TPV"],
      "/compras/usados": ["Inicio", "Compras", "Comprar Usados"],
      '/reparaciones/nueva': ['Inicio', 'Reparaciones'],
      "/gestion/clientes": ["Inicio", "Gestión", "Clientes"],
      "/gestion/inventario": ["Inicio", "Gestión", "Inventario"],
    };
    return breadcrumbMap[path] || ["Inicio"];
  };

  // Función para obtener el título de la página
  const getPageTitle = (path: string): string => {
    const titleMap: { [key: string]: string } = {
      "/dashboard": "Dashboard",
      "/ventas/nueva": "Nueva Venta",
      "/ventas/tpv": "Punto de Venta",
      "/compras/usados": "Comprar Usados",
      "/reparaciones/nueva": "Nueva Reparación",
      "/gestion/clientes": "Gestión de Clientes",
      "/gestion/inventario": "Inventario",
    };
    return titleMap[path] || "ERP Móviles";
  };

  // Función para obtener iconos SVG
  const getIcon = (iconName: string): JSX.Element => {
    const icons: { [key: string]: JSX.Element } = {
      home: (
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-9 9a1 1 0 001.414 1.414L10 4.414l8.293 8.293a1 1 0 001.414-1.414l-9-9z" />
      ),
      bell: (
        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
      ),
      currency: (
        <>
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
            clipRule="evenodd"
          />
        </>
      ),
      cart: (
        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
      ),
      plus: (
        <path
          fillRule="evenodd"
          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
          clipRule="evenodd"
        />
      ),
      chart: (
        <path
          fillRule="evenodd"
          d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      ),
      phone: (
        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
      ),
      refresh: (
        <path
          fillRule="evenodd"
          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
          clipRule="evenodd"
        />
      ),
      clipboard: (
        <>
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path
            fillRule="evenodd"
            d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 1a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
            clipRule="evenodd"
          />
        </>
      ),
      tools: (
        <path
          fillRule="evenodd"
          d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
          clipRule="evenodd"
        />
      ),
      wrench: (
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      ),
      list: (
        <path
          fillRule="evenodd"
          d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
          clipRule="evenodd"
        />
      ),
      speedometer: (
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      ),
      folder: (
        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      ),
      users: (
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
      ),
      boxes: (
        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
      ),
      building: (
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
          clipRule="evenodd"
        />
      ),
      "chart-bar": (
        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
      ),
      "document-chart": (
        <path
          fillRule="evenodd"
          d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
          clipRule="evenodd"
        />
      ),
      target: (
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
          clipRule="evenodd"
        />
      ),
      cog: (
        <path
          fillRule="evenodd"
          d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
          clipRule="evenodd"
        />
      ),
      "user-circle": (
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
          clipRule="evenodd"
        />
      ),
      cpu: (
        <path
          fillRule="evenodd"
          d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
          clipRule="evenodd"
        />
      ),
      "chevron-left": (
        <path
          fillRule="evenodd"
          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      ),
      "chevron-right": (
        <path
          fillRule="evenodd"
          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
          clipRule="evenodd"
        />
      ),
      "chevron-down": (
        <path
          fillRule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      ),
    };
    return icons[iconName] || icons.home;
  };

  // Componente MenuItem
  const MenuItemComponent: React.FC<{ item: MenuItem; level?: number }> = ({
    item,
    level = 0,
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasChildren = item.children && item.children.length > 0;
    const isActive = currentPage === item.path;

    const handleClick = () => {
      if (hasChildren) {
        setIsExpanded(!isExpanded);
      } else {
        navigate(item.path);
        setMobileMenuOpen(false);
      }
    };

    return (
      <div>
        <div
          className={`
            flex items-center py-3 px-5 cursor-pointer transition-all duration-200 group
            ${
              isActive
                ? "bg-blue-600 text-white border-r-4 border-blue-400"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }
          `}
          style={{ paddingLeft: `${20 + level * 20}px` }}
          onClick={handleClick}
        >
          <svg
            className="w-5 h-5 mr-3 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            {getIcon(item.icon)}
          </svg>

          {!sidebarCollapsed && (
            <>
              <span className="flex-1 font-medium">{item.title}</span>

              {item.badge && (
                <span className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                  {item.badge}
                </span>
              )}

              {hasChildren && (
                <svg
                  className="w-4 h-4 ml-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  {getIcon(isExpanded ? "chevron-down" : "chevron-right")}
                </svg>
              )}
            </>
          )}
        </div>

        {hasChildren && isExpanded && !sidebarCollapsed && (
          <div className="bg-gray-900">
            {item.children?.map((child) => (
              <MenuItemComponent
                key={child.id}
                item={child}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="layout-container h-screen bg-gray-100 flex overflow-hidden">
      {/* Sidebar */}
      <div
        className={`
        bg-gray-800 text-white fixed h-full transition-all duration-300 z-50
          ${sidebarCollapsed ? "w-16" : "w-64"}
          ${
            mobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* Header del Sidebar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center">
            <svg
              className="w-8 h-8 text-blue-400 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              {getIcon("phone")}
            </svg>
            {!sidebarCollapsed && (
              <span className="text-xl font-bold">ERP Móviles</span>
            )}
          </div>
          <button
            className="p-1 rounded-lg hover:bg-gray-700 transition-colors"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              {getIcon(sidebarCollapsed ? "chevron-right" : "chevron-left")}
            </svg>
          </button>
        </div>

        {/* Perfil de Usuario */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-sm font-bold text-white">
                  {user.avatar}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {user.nombre} {user.apellidos}
                </div>
                <div className="text-xs text-gray-400 truncate">{user.rol}</div>
                <div className="text-xs text-gray-400 truncate">
                  {user.establecimiento}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Menú de Navegación */}
        <nav className="py-2 overflow-y-auto h-full">
          {menuItems.map((item) => (
            <MenuItemComponent key={item.id} item={item} />
          ))}
        </nav>
      </div>

      {/* Contenido Principal */}
      <div
        className={`
          main-content-container transition-all duration-300
          ${sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"}
        `}
      >
        {/* Top Bar */}
        <div className="top-bar-sticky bg-white shadow-sm border-b border-gray-200 px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between">
            {/* Botón menú móvil */}
            <button
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <div className="flex-1 lg:flex-none">
              {/* Breadcrumb */}
              <nav className="flex mb-1" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-1 md:space-x-3">
                  {getBreadcrumb(currentPage).map((crumb, index, array) => (
                    <li key={index} className="flex items-center">
                      {index > 0 && (
                        <svg
                          className="w-4 h-4 text-gray-400 mx-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          {getIcon("chevron-right")}
                        </svg>
                      )}
                      <span
                        className={`text-sm ${
                          index === array.length - 1
                            ? "text-gray-900 font-medium"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {crumb}
                      </span>
                    </li>
                  ))}
                </ol>
              </nav>
              {/* Título de Página */}
              <h1 className="text-2xl font-bold text-gray-900">
                {getPageTitle(currentPage)}
              </h1>
            </div>

            {/* Acciones del Top Bar */}
            <div className="flex items-center space-x-3">
              {/* Notificaciones */}
              <div className="relative">
                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    {getIcon("bell")}
                  </svg>
                </button>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </div>
              </div>

              {/* Menú de Usuario */}
              <div className="relative group">
                <button className="flex items-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg
                    className="w-6 h-6 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    {getIcon("user-circle")}
                  </svg>
                  <span className="hidden md:block font-medium">
                    {user.nombre}
                  </span>
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    {getIcon("chevron-down")}
                  </svg>
                </button>

                {/* Dropdown del usuario */}
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-1">
                    <a
                      href="#"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <svg
                        className="w-4 h-4 mr-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        {getIcon("user-circle")}
                      </svg>
                      Perfil
                    </a>
                    <a
                      href="#"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <svg
                        className="w-4 h-4 mr-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        {getIcon("cog")}
                      </svg>
                      Configuración
                    </a>
                    <hr className="my-1" />
                    <a
                      href="#"
                      className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <svg
                        className="w-4 h-4 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Cerrar Sesión
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Área de Contenido */}
        <div className="content-area-scroll">{children}</div>
      </div>

      {/* Overlay para móvil */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;

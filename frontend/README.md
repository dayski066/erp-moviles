# ERP Móviles - Frontend

## React + TypeScript + Vite

Sistema de gestión integral para talleres de reparación de dispositivos móviles con interfaz moderna y conexión en tiempo real con el backend.

---

## 🚀 Tecnologías

- **React 18** con TypeScript
- **Vite** para desarrollo rápido y build optimizado
- **Tailwind CSS** para estilos modernos y responsivos
- **React Router** para navegación SPA
- **Axios** para comunicación con API REST
- **Sistema de notificaciones** centralizado y moderno

---

## 📦 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- NPM o Yarn
- Backend ejecutándose en `http://localhost:5000`

### Instalación
```bash
# Clonar repositorio
git clone <repo-url>
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### Scripts Disponibles
```bash
npm run dev          # Servidor de desarrollo (puerto 5173)
npm run build        # Build para producción
npm run preview      # Vista previa del build
npm run lint         # Linter ESLint
```

---

## 🏗️ Arquitectura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── core/           # Componentes base del sistema
│   │   ├── Common/     # Elementos comunes (botones, modales)
│   │   ├── Layout/     # Estructura de la aplicación
│   │   └── Notifications/ # Sistema de notificaciones
│   └── forms/          # Componentes de formularios
├── contexts/           # Contexts de React (estado global)
├── hooks/              # Custom hooks
├── pages/              # Páginas principales de la aplicación
│   ├── Dashboard/      # Panel principal
│   ├── Reparaciones/   # Gestión de reparaciones
│   ├── Clientes/       # Gestión de clientes
│   └── Inventario/     # Control de inventario
├── services/           # Servicios y API calls
├── styles/             # Estilos globales y CSS personalizado
├── types/              # Definiciones de TypeScript
└── utils/              # Utilidades y helpers
```

---

## 🔔 Sistema de Notificaciones

### Características
- **Diseño moderno** con animaciones suaves
- **4 tipos de notificación**: Success, Error, Warning, Info
- **Auto-cierre configurable** con indicador visual
- **Posicionamiento flexible** (top-right por defecto)
- **Gestión centralizada** mediante Context API
- **TypeScript completo** para type safety

### Configuración

#### 1. Agregar Provider en App.tsx
```tsx
import { NotificationProvider } from './contexts/NotificationContext';
import NotificationContainer from './components/core/Notifications/NotificationContainer';
import './styles/notifications.css';

function App() {
  return (
    <NotificationProvider>
      <Router>
        {/* Tu aplicación */}
      </Router>
      <NotificationContainer />
    </NotificationProvider>
  );
}
```

#### 2. Usar en componentes
```tsx
import { useNotification } from '../contexts/NotificationContext';

const MiComponente = () => {
  const { showSuccess, showError } = useNotification();

  const handleAction = async () => {
    try {
      // Acción
      showSuccess('Éxito', 'Operación completada correctamente');
    } catch (error) {
      showError('Error', 'Ha ocurrido un problema');
    }
  };
};
```

#### 3. Hook específico para reparaciones
```tsx
import { useReparacionNotifications } from '../hooks/useReparacionNotifications';

const NuevaReparacion = () => {
  const { notificarReparacionCreada, notificarErrorCreacion } = useReparacionNotifications();

  const crearReparacion = async () => {
    try {
      const result = await api.post('/reparaciones', data);
      notificarReparacionCreada(result.data.numero_orden);
    } catch (error) {
      notificarErrorCreacion(error.message);
    }
  };
};
```

### API del Sistema de Notificaciones

#### Métodos Básicos
```tsx
const { 
  showSuccess,    // (title, message, duration?)
  showError,      // (title, message, duration?)
  showWarning,    // (title, message, duration?)
  showInfo,       // (title, message, duration?)
  removeNotification, // (id)
  clearAll        // ()
} = useNotification();
```

#### Métodos Específicos para Reparaciones
```tsx
const {
  notificarReparacionCreada,     // (numeroOrden)
  notificarErrorCreacion,        // (mensaje)
  notificarReparacionActualizada,// (numeroOrden)
  notificarPresupuestoEnviado,   // (cliente)
  notificarReparacionEntregada,  // (numeroOrden)
  notificarPagoRecibido,         // (monto, numeroOrden)
  notificarErrorConexion,        // ()
  notificarCargando              // (accion)
} = useReparacionNotifications();
```

---

## 🌐 Conexión con Backend

### Configuración de API
```tsx
// services/api.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Endpoints Principales

#### Reparaciones
```typescript
POST   /api/reparaciones/crear-completa  # Crear reparación completa
GET    /api/reparaciones                 # Listar reparaciones
GET    /api/reparaciones/:id             # Obtener reparación específica
PUT    /api/reparaciones/:id             # Actualizar reparación
```

#### Clientes
```typescript
GET    /api/clientes                     # Listar clientes
GET    /api/clientes/buscar?q=           # Buscar clientes
GET    /api/clientes/:id                 # Obtener cliente específico
POST   /api/clientes                     # Crear cliente
```

#### Sistema
```typescript
GET    /api/health                       # Estado del servidor
GET    /api/test-db                      # Prueba de conexión BD
GET    /api/database/stats               # Estadísticas de la BD
```

### Manejo de Errores
```tsx
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { notificarErrorConexion } = useReparacionNotifications();
    
    if (error.code === 'NETWORK_ERROR') {
      notificarErrorConexion();
    }
    
    return Promise.reject(error);
  }
);
```

---

## 🎨 Sistema de Estilos

### Tailwind CSS
- **Configuración personalizada** para el branding del taller
- **Clases de utilidad** para desarrollo rápido
- **Responsive design** móvil-primero
- **Dark mode** preparado

### CSS Personalizado
- **Animaciones modernas** para notificaciones
- **Transitions suaves** en toda la aplicación
- **Accesibilidad** con `prefers-reduced-motion`

---

## 🔧 Configuración de Development

### Vite Setup
Este template incluye una configuración mínima para React + Vite con:

- **Hot Module Replacement (HMR)**
- **Fast Refresh** para desarrollo rápido
- **ESLint** para calidad de código

### Plugins Oficiales Disponibles
- [@vitejs/plugin-react](https://github.com/vitejs/plugin-react/blob/main/packages/plugin-react) - Usa Babel para Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) - Usa SWC para Fast Refresh

### ESLint Configuration

Para aplicaciones de producción, recomendamos actualizar la configuración ESLint:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

### Plugins Adicionales de React
```js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      reactX.configs['recommended-typescript'],
      reactDom.configs.recommended,
    ],
  },
])
```

---

## 🚦 Estados de la Aplicación

### Estados de Carga
- **Loading spinners** integrados
- **Skeleton screens** para mejor UX
- **Progressive loading** de contenido

### Estados de Error
- **Error boundaries** para captura de errores
- **Fallback UI** amigable al usuario
- **Retry mechanisms** automáticos

---

## 📱 Responsive Design

### Breakpoints
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: 1024px+

### Características Móviles
- **Touch-friendly** interfaces
- **Swipe gestures** donde sea apropiado
- **Optimización** para pantallas pequeñas

---

## 🔒 Seguridad

### Validación
- **Client-side validation** con TypeScript
- **Server-side validation** siempre requerida
- **Sanitización** de inputs del usuario

### Autenticación (Preparado)
- **JWT tokens** preparado para implementar
- **Protected routes** con guards
- **Session management** robusto

---

## 📊 Performance

### Optimizaciones
- **Code splitting** automático con Vite
- **Lazy loading** de componentes pesados
- **Memoización** de componentes con React.memo
- **Virtual scrolling** para listas largas

### Métricas
- **Bundle size** optimizado
- **First Contentful Paint** < 2s
- **Time to Interactive** < 3s

---

## 🧪 Testing (Preparado)

### Framework
- **Vitest** para unit testing
- **React Testing Library** para component testing
- **Cypress** para E2E testing

### Cobertura
- **Components** 80%+
- **Utils** 90%+
- **Critical paths** 100%

---

## 🚀 Deployment

### Build
```bash
npm run build
```

### Environment Variables
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=ERP Móviles
VITE_VERSION=1.0.0
```

### Hosting
- **Compatible** con Vercel, Netlify, GitHub Pages
- **Static hosting** optimizado
- **CDN ready** para assets

---

## 👥 Contribución

### Guidelines
1. Seguir convenciones de **TypeScript**
2. Usar **Tailwind** para estilos
3. Implementar **tests** para nuevas funcionalidades
4. Seguir patrones de **React Hooks**
5. Mantener **accesibilidad** (a11y)

### Estructura de Commits
```
feat: agregar nueva funcionalidad
fix: corregir bug
docs: actualizar documentación
style: cambios de formato
refactor: refactoring de código
test: agregar tests
```

---

## 📞 Soporte

- **Issues**: GitHub Issues
- **Documentación**: `/docs` directory
- **API Docs**: Swagger en `http://localhost:5000/docs`

---

**Desarrollado con ❤️ para talleres de reparación modernos**
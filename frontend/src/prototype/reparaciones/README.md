# Sistema de Reparaciones v2.0 (PROTOTYPE)

## 🎯 Descripción

Sistema unificado de registro de reparaciones que elimina el flujo de 5 pasos separados, proporcionando una experiencia de usuario moderna, intuitiva y rápida.

## 🏗️ Arquitectura

### Estructura de Carpetas
```
src/prototype/reparaciones/
├── components/
│   ├── ClienteSection/
│   │   ├── ClienteSearch.tsx
│   │   ├── ClienteQuickCreate.tsx
│   │   ├── ClienteInfo.tsx
│   │   └── ClienteSection.tsx
│   ├── DispositivosSection/
│   │   ├── DeviceList.tsx
│   │   ├── DeviceQuickAdd.tsx
│   │   └── DispositivosSection.tsx
│   ├── DiagnosticoPresupuesto/
│   │   ├── UnifiedDiagnosisPanel.tsx
│   │   └── DiagnosticoPresupuestoSection.tsx
│   ├── Shared/
│   │   ├── ProgressIndicator.tsx
│   │   └── LiveSummary.tsx
│   └── ReparacionUnifiedView.tsx
├── hooks/
│   ├── useAutoSave.ts
│   └── useReparacionFlow.ts
├── store/
│   └── reparacionStore.ts
├── services/
│   └── api.service.ts
├── types/
│   └── reparacion.types.ts
├── routes.tsx
├── index.tsx
└── README.md
```

## 🚀 Características Principales

### 1. Interfaz Unificada
- **Vista única**: Todo en una sola pantalla
- **Navegación fluida**: Transiciones suaves entre secciones
- **Auto-avance**: Secciones se expanden automáticamente
- **Responsive**: Diseño adaptativo para móvil y desktop

### 2. Gestión de Clientes
- **Búsqueda unificada**: DNI, nombre y teléfono simultáneamente
- **Creación rápida**: Formulario inline con validación
- **Estados visuales**: Indicadores de búsqueda en tiempo real
- **Navegación por teclado**: Flechas, Enter, Escape

### 3. Gestión de Dispositivos
- **Tarjetas interactivas**: Información clara y accesible
- **Añadir rápido**: Modal con validación IMEI
- **Reordenamiento**: Drag & drop para cambiar orden
- **Validación IMEI**: Escáner y lookup automático

### 4. Diagnóstico y Presupuesto Unificado
- **Acordeón inteligente**: Solo un dispositivo expandido
- **Averías dinámicas**: Añadir/editar en tiempo real
- **Intervenciones flexibles**: Precios y cantidades editables
- **Cálculo automático**: Totales actualizados instantáneamente

### 5. Auto-guardado
- **Debounce inteligente**: Guarda cada 2 segundos
- **LocalStorage**: Persistencia offline
- **Sync automático**: Sincronización con backend
- **Indicadores visuales**: Estado de guardado en tiempo real

## 🛠️ Tecnologías

- **React 18+** con TypeScript
- **Zustand** para estado global
- **Tailwind CSS** para estilos
- **Framer Motion** para animaciones
- **Heroicons** para iconografía
- **Axios** para HTTP client
- **date-fns** para manejo de fechas

## 📊 Estado Global (Zustand)

### Estructura del Store
```typescript
interface ReparacionState {
  // Cliente
  cliente: Cliente | null;
  clienteValidado: boolean;
  clienteSearchState: SearchState;
  
  // Dispositivos
  dispositivos: Dispositivo[];
  dispositivoActivo: string | null;
  
  // Diagnósticos
  diagnosticos: Map<string, DiagnosticoPresupuesto>;
  
  // UI State
  seccionActiva: 'cliente' | 'dispositivos' | 'diagnostico';
  guardandoAutomatico: boolean;
  ultimoGuardado: Date | null;
}
```

### Acciones Principales
- `setCliente()`: Establecer cliente seleccionado
- `addDispositivo()`: Añadir dispositivo
- `setDiagnostico()`: Actualizar diagnóstico
- `getProgress()`: Calcular progreso (0-100%)
- `isValid()`: Validar formulario completo

## 🪝 Hooks Personalizados

### useReparacionFlow
Hook principal que encapsula toda la lógica del flujo:
```typescript
const {
  cliente,
  dispositivos,
  diagnosticos,
  progress,
  isValid,
  addDispositivo,
  setDiagnostico,
  createReparacion
} = useReparacionFlow();
```

### useAutoSave
Hook para auto-guardado con debounce:
```typescript
const { saving, lastSave, error, save } = useAutoSave(2000);
```

## 🔌 API Service

### Endpoints Principales
- `GET /api/catalogos/clientes/buscar/{termino}`: Búsqueda de clientes
- `POST /api/catalogos/clientes`: Crear cliente
- `GET /api/catalogos/marcas`: Obtener marcas
- `GET /api/catalogos/modelos/marca/{id}`: Obtener modelos
- `POST /api/reparaciones/crear-completa`: Crear reparación

### Características
- **Interceptors**: Manejo automático de errores
- **Deduplicación**: Resultados de búsqueda únicos
- **Validación IMEI**: Lookup automático de dispositivos
- **Sugerencias IA**: Recomendaciones inteligentes

## 🎨 Componentes UI

### ReparacionUnifiedView
Componente contenedor principal con:
- Layout responsive (12 columnas)
- Sidebar sticky con resumen
- Animaciones de transición
- Indicadores de progreso

### ProgressIndicator
Barra de progreso visual con:
- Porcentaje de completitud
- Indicadores de sección
- Navegación por clicks
- Estados activo/completado/deshabilitado

### LiveSummary
Sidebar con resumen en tiempo real:
- Información del cliente
- Lista de dispositivos
- Totales calculados
- Botones de acción

## 🚀 Rutas Disponibles

- `/prototype/reparaciones/nueva`: Nueva reparación
- `/prototype/reparaciones/editar/:id`: Editar reparación existente
- `/prototype/reparaciones/cliente/:clienteId`: Nueva reparación con cliente pre-cargado

## 📱 Responsive Design

### Breakpoints
- **Mobile**: Stack vertical con resumen como bottom sheet
- **Tablet**: Layout híbrido con sidebar colapsable
- **Desktop**: Grid de 12 columnas con sidebar fijo

### Optimizaciones Touch
- Botones grandes para móvil
- Gestos de swipe
- Feedback táctil
- Navegación por voz (futuro)

## 🔐 Validaciones

### Cliente
- DNI/NIE español válido
- Teléfono español (6/7/8/9 + 8 dígitos)
- Email opcional pero válido
- Campos requeridos: nombre, apellidos, DNI, teléfono

### Dispositivo
- Marca y modelo requeridos
- IMEI de 15 dígitos (opcional)
- Validación de duplicados IMEI
- Observaciones limitadas a 500 caracteres

### Diagnóstico
- Al menos una avería por dispositivo
- Precios positivos
- Cantidades enteras positivas
- Conceptos no vacíos

## ⚡ Optimizaciones de Rendimiento

### Lazy Loading
- Componentes pesados cargados bajo demanda
- Virtualización para listas largas
- Code splitting por rutas

### Memoización
- Cálculos de totales memorizados
- Componentes optimizados con React.memo
- Debounce en búsquedas

### Auto-save
- Guardado inteligente cada 2 segundos
- Solo guarda cambios válidos
- Persistencia en localStorage
- Sync con backend cuando hay conexión

## 🧪 Testing

### Casos de Prueba Críticos
1. **Flujo completo**: Cliente → Dispositivos → Diagnóstico → Crear
2. **Auto-save**: Verificar guardado cada 2 segundos
3. **Validaciones**: Rechazar datos inválidos
4. **Responsive**: Funcionamiento en móvil/tablet/desktop
5. **Offline**: Funcionamiento sin conexión

## 🚀 Métricas de Éxito

- **Tiempo de registro**: < 3 minutos (vs 10 minutos actual)
- **Tasa de error**: < 1%
- **Satisfacción usuario**: > 90%
- **Adopción**: > 95% en primera semana

## 🔄 Roadmap

### Fase 1 ✅ (Completado)
- [x] Estructura base y tipos
- [x] Store de Zustand
- [x] Hooks personalizados
- [x] Componentes principales
- [x] Auto-save básico

### Fase 2 🔄 (En progreso)
- [ ] Integración con backend
- [ ] Validaciones avanzadas
- [ ] Sugerencias IA
- [ ] Escáner IMEI

### Fase 3 📋 (Pendiente)
- [ ] Impresión de órdenes
- [ ] Historial de reparaciones
- [ ] Plantillas predefinidas
- [ ] Analytics avanzados

## 👥 Contribución

### Estándares de Código
- TypeScript estricto
- ESLint + Prettier
- Conventional Commits
- Componentes funcionales
- Hooks personalizados

### Flujo de Desarrollo
1. Crear feature branch
2. Implementar funcionalidad
3. Añadir tests
4. Documentar cambios
5. Crear Pull Request

## 📞 Soporte

Para dudas o problemas:
- Crear issue en el repositorio
- Documentar pasos para reproducir
- Incluir información del entorno
- Adjuntar screenshots si es necesario

---

**Desarrollado con ❤️ para mejorar la experiencia de reparaciones** 
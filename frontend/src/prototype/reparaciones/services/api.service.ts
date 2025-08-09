import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  Cliente, 
  Dispositivo, 
  DiagnosticoPresupuesto, 
  ResumenReparacion,
  Marca,
  Modelo,
  Averia,
  Intervencion,
  Suggestion,
  ApiResponse
} from '../types/reparacion.types';

export class ReparacionAPI {
  private baseURL: string;
  private api: AxiosInstance;
  
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Interceptors para manejo de errores
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Añadir token si existe
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    
    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
      }
    );
  }
  
  // Métodos privados para requests
  private async get<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.api.get(url);
    return response.data;
  }
  
  private async post<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.api.post(url, data);
    return response.data;
  }
  
  private async put<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.api.put(url, data);
    return response.data;
  }
  
  private async delete<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.api.delete(url);
    return response.data;
  }
  
  // Cliente
  async searchCliente(term: string): Promise<Cliente[]> {
    try {
      // Búsqueda unificada usando el endpoint correcto del backend
      const response = await this.get<{ success: boolean; data: Cliente[] }>(`/catalogos/clientes/buscar?termino=${encodeURIComponent(term)}`);
      
      if (response.success) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error buscando cliente:', error);
      return [];
    }
  }
  
  async createCliente(cliente: Omit<Cliente, 'id'>): Promise<Cliente> {
    return this.post<Cliente>('/catalogos/clientes', cliente);
  }
  
  async updateCliente(id: number, cliente: Partial<Cliente>): Promise<Cliente> {
    return this.put<Cliente>(`/catalogos/clientes/${id}`, cliente);
  }
  
  // Dispositivos - Marcas y Modelos
  async getMarcas(): Promise<Marca[]> {
    const response = await this.get<{ success: boolean; data: Marca[] }>('/catalogos/marcas');
    return response.success ? response.data : [];
  }
  
  async getModelos(marcaId: number): Promise<Modelo[]> {
    const response = await this.get<{ success: boolean; data: Modelo[] }>(`/catalogos/modelos/marca/${marcaId}`);
    return response.success ? response.data : [];
  }
  
  async createMarca(marca: Omit<Marca, 'id'>): Promise<Marca> {
    const response = await this.post<{ success: boolean; data: Marca }>('/catalogos/marcas', marca);
    return response.success ? response.data : marca as Marca;
  }
  
  async createModelo(modelo: Omit<Modelo, 'id'>): Promise<Modelo> {
    const response = await this.post<{ success: boolean; data: Modelo }>('/catalogos/modelos', modelo);
    return response.success ? response.data : modelo as Modelo;
  }
  
  // Averías e Intervenciones
  async getAverias(): Promise<Averia[]> {
    const response = await this.get<{ success: boolean; data: Averia[] }>('/catalogos/averias');
    return response.success ? response.data : [];
  }
  
  async getIntervencionesFiltradas(modeloId?: number, averiaId?: number): Promise<Intervencion[]> {
    const params = new URLSearchParams();
    if (modeloId) params.append('modelo_id', modeloId.toString());
    if (averiaId) params.append('averia_id', averiaId.toString());
    
    const response = await this.get<{ success: boolean; data: Intervencion[] }>(`/catalogos/intervenciones/filtradas?${params.toString()}`);
    return response.success ? response.data : [];
  }
  
  async createIntervencion(intervencion: Omit<Intervencion, 'id'>): Promise<Intervencion> {
    const response = await this.post<{ success: boolean; data: Intervencion }>('/catalogos/intervenciones', intervencion);
    return response.success ? response.data : intervencion as Intervencion;
  }
  
  // Reparación
  async createReparacion(reparacion: ResumenReparacion): Promise<{ id: string }> {
    return this.post<{ id: string }>('/reparaciones/crear-completa', reparacion);
  }
  
  async saveDraft(reparacion: ResumenReparacion): Promise<void> {
    return this.post<void>('/reparaciones/draft', reparacion);
  }
  
  async getReparacion(id: string): Promise<ResumenReparacion> {
    return this.get<ResumenReparacion>(`/reparaciones/${id}`);
  }
  
  async updateReparacion(id: string, reparacion: Partial<ResumenReparacion>): Promise<ResumenReparacion> {
    return this.put<ResumenReparacion>(`/reparaciones/${id}`, reparacion);
  }
  
  // Sugerencias IA
  async getSuggestions(type: string, context: any): Promise<Suggestion[]> {
    return this.post<Suggestion[]>('/ia/suggestions', { type, context });
  }
  
  // Validación IMEI
  async validateIMEI(imei: string): Promise<{ valid: boolean; device?: any }> {
    try {
      return this.post<{ valid: boolean; device?: any }>('/validation/imei', { imei });
    } catch (error) {
      return { valid: false };
    }
  }
  
  // Utilidades
  private deduplicateAndSort(clientes: Cliente[]): Cliente[] {
    const unique = new Map<number, Cliente>();
    
    clientes.forEach(cliente => {
      if (cliente.id && !unique.has(cliente.id)) {
        unique.set(cliente.id, cliente);
      }
    });
    
    return Array.from(unique.values()).sort((a, b) => {
      // Ordenar por relevancia (DNI exacto primero, luego nombre)
      const aDNI = a.dni.toLowerCase();
      const bDNI = b.dni.toLowerCase();
      const aName = `${a.nombre} ${a.apellidos}`.toLowerCase();
      const bName = `${b.nombre} ${b.apellidos}`.toLowerCase();
      
      if (aDNI === bDNI) return aName.localeCompare(bName);
      return aDNI.localeCompare(bDNI);
    });
  }
  
  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health');
      return true;
    } catch {
      return false;
    }
  }
} 
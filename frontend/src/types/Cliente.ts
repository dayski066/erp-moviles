// Tipos para Cliente
export interface ClienteData {
  nombre: string;
  apellidos: string;
  dni: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  codigoPostal: string;
}

export interface ValidationErrors {
  nombre?: string;
  apellidos?: string;
  dni?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  codigoPostal?: string;
}

export interface Cliente extends ClienteData {
  id: string;
  fechaRegistro: string;
  activo: boolean;
}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Subject } from 'rxjs';

// Interfaz para las respuestas del API
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface Lista {
  idLista?: number;
  nombre: string;
  color?: string;
  icono?: string;
  importante?: boolean;
  compartible?: boolean;
  claveCompartir?: string | null;
  idCategoria?: number | null;
  nombreCategoria?: string;
  idUsuario?: number;
  esPropietario?: boolean; 
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ListasService {
  private API_URL = 'http://localhost:3000/api/listas';

  // Evento para notificar cambios en las listas
  private listasCambiadasSubject = new Subject<void>();
  listasCambiadas$ = this.listasCambiadasSubject.asObservable();

  constructor(private http: HttpClient) { }

  // Método privado para notificar cambios
  private notificarCambio() {
    this.listasCambiadasSubject.next();
  }

  async crearLista(lista: Lista): Promise<any> {
    const result = await firstValueFrom(this.http.post(this.API_URL, lista));
    this.notificarCambio();
    return result;
  }

  async obtenerListas(): Promise<Lista[]> {
    try {
      const response: any = await firstValueFrom(this.http.get(this.API_URL));
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error al obtener listas:', error);
      return [];
    }
  }

  async obtenerLista(id: number): Promise<Lista | null> {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.API_URL}/${id}`));
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Error al obtener lista:', error);
      return null;
    }
  }

  async actualizarLista(id: number, lista: Partial<Lista>): Promise<any> {
    const result = await firstValueFrom(this.http.put(`${this.API_URL}/${id}`, lista));
    this.notificarCambio();
    return result;
  }

  async eliminarLista(id: number): Promise<any> {
    const result = await firstValueFrom(this.http.delete(`${this.API_URL}/${id}`));
    this.notificarCambio();
    return result;
  }

  async obtenerListaConTareas(id: number): Promise<any> {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.API_URL}/${id}/tareas`));
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error al obtener lista con tareas:', error);
      return null;
    }
  }

  async obtenerListasSinCategoria(): Promise<Lista[]> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.API_URL}/sin-categoria`)
      );
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error al obtener listas sin categoría:', error);
      const listas = await this.obtenerListas();
      return listas.filter(lista => lista.idCategoria === null || lista.idCategoria === undefined);
    }
  }

  async obtenerListasImportantes(): Promise<Lista[]> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.API_URL}/importantes`)
      );
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error al obtener listas importantes:', error);
      return [];
    }
  }

  async obtenerListasPropias(): Promise<Lista[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<Lista[]>>(`${this.API_URL}/propias`)
      );

      if (response && response.data) {
        return Array.isArray(response.data) ? response.data : [];
      }
      return [];
    } catch (error) {
      console.error('Error al obtener listas propias:', error);
      throw error;
    }
  }

  async obtenerListasCompartidas(): Promise<Lista[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<Lista[]>>(`${this.API_URL}/compartidas`)
      );

      if (response && response.data) {
        return Array.isArray(response.data) ? response.data : [];
      }
      return [];
    } catch (error) {
      console.error('Error al obtener listas compartidas:', error);
      throw error;
    }
  }

  async hacerCompartible(id: number): Promise<any> {
    try {
      console.log('Marcando lista como compartible, ID:', id);

      // CORRECCIÓN: Usar el endpoint correcto en /api/listas/:id/compartir
      const result = await firstValueFrom(
        this.http.put(`${this.API_URL}/${id}/compartir`, {})
      );

      console.log('Lista marcada como compartible exitosamente:', result);
      this.notificarCambio();
      return result;

    } catch (error) {
      console.error('Error completo al hacer lista compartible:', error);
      throw error;
    }
  }

  // Quitar compartir de una lista
  async quitarCompartir(id: number): Promise<any> {
    try {
      const result = await firstValueFrom(
        this.http.put(`${this.API_URL}/${id}`, {
          compartible: false,
          claveCompartir: null // Limpiar la clave también
        })
      );
      this.notificarCambio();
      return result;
    } catch (error) {
      console.error('Error al quitar compartir:', error);
      throw error;
    }
  }
}
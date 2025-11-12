import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Tarea {
  idTarea?: number;
  nombre: string;
  descripcion?: string | null;
  prioridad: 'A' | 'N' | 'B';
  estado: 'P' | 'N' | 'C';
  fechaVencimiento?: string;
  miDia?: boolean;
  pasos?: string[];
  notas?: string;
  recordatorio?: string;
  repetir?: boolean;
  tipoRepeticion?: string;
  configRepeticion?: string;
  idLista?: number;
  nombreLista?: string;
  iconoLista?: string;
  colorLista?: string;
  importante?: boolean;
  fechaCreacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TareasService {
  private API_URL = 'http://localhost:3000/api/tareas';

  constructor(private http: HttpClient) { }

  async crearTarea(tarea: Tarea): Promise<any> {
    try {
      return firstValueFrom(this.http.post(this.API_URL, tarea));
    } catch (error) {
      console.error('Error al crear tarea:', error);
      throw error;
    }
  }

  async obtenerTareas(): Promise<Tarea[]> {
    try {
      const response: any = await firstValueFrom(this.http.get(this.API_URL));
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error al obtener tareas:', error);
      return [];
    }
  }

  async obtenerTarea(id: number): Promise<Tarea | null> {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.API_URL}/${id}`));
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Error al obtener tarea:', error);
      return null;
    }
  }

  async actualizarTarea(id: number, tarea: Tarea): Promise<any> {
    try {
      return firstValueFrom(this.http.put(`${this.API_URL}/${id}`, tarea));
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
      throw error;
    }
  }

  async eliminarTarea(id: number): Promise<any> {
    try {
      return firstValueFrom(this.http.delete(`${this.API_URL}/${id}`));
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      throw error;
    }
  }

  async cambiarEstado(id: number, estado: 'P' | 'N' | 'C'): Promise<any> {
    try {
      return firstValueFrom(this.http.patch(`${this.API_URL}/${id}/estado`, { estado }));
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      throw error;
    }
  }

  async obtenerTareasPorEstado(estado: string): Promise<Tarea[]> {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.API_URL}/estado/${estado}`));
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error al obtener tareas por estado:', error);
      return [];
    }
  }

  async obtenerTareasVencidas(): Promise<Tarea[]> {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.API_URL}/filtros/vencidas`));
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error al obtener tareas vencidas:', error);
      return [];
    }
  }

  async actualizarFechaVencimiento(id: number, fechaVencimiento: string): Promise<any> {
    try {
      return firstValueFrom(this.http.put(`${this.API_URL}/${id}`, { fechaVencimiento }));
    } catch (error) {
      console.error('Error al actualizar fecha vencimiento:', error);
      throw error;
    }
  }

  async alternarMiDia(id: number, miDia: boolean): Promise<any> {
    try {
      return firstValueFrom(this.http.patch(`${this.API_URL}/${id}/mi-dia`, { miDia }));
    } catch (error) {
      console.error('Error al alternar Mi Día:', error);
      throw error;
    }
  }

  async obtenerTareasMiDia(): Promise<Tarea[]> {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.API_URL}/filtros/mi-dia`));
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error al obtener tareas Mi Día:', error);
      return [];
    }
  }
}
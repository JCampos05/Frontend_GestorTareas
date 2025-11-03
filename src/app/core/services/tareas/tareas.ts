import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Tarea {
  idTarea?: number;
  nombre: string;
  descripcion?: string;
  prioridad: 'A' | 'N' | 'B';
  estado: 'P' | 'N' | 'C';
  fechaVencimiento?: string;
  pasos?: string[];
  notas?: string;
  recordatorio?: string;
  repetir?: boolean;
  tipoRepeticion?: string;
  configRepeticion?: string;
  idLista?: number;
  fechaCreacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TareasService {
  private API_URL = 'http://localhost:3000/api/tareas';

  constructor(private http: HttpClient) {}

  async crearTarea(tarea: Tarea): Promise<any> {
    return firstValueFrom(this.http.post(this.API_URL, tarea));
  }

  async obtenerTareas(): Promise<Tarea[]> {
    const response: any = await firstValueFrom(this.http.get(this.API_URL));
    return response.success ? response.data : [];
  }

  async obtenerTarea(id: number): Promise<Tarea | null> {
    const response: any = await firstValueFrom(this.http.get(`${this.API_URL}/${id}`));
    return response.success ? response.data : null;
  }

  async actualizarTarea(id: number, tarea: Tarea): Promise<any> {
    return firstValueFrom(this.http.put(`${this.API_URL}/${id}`, tarea));
  }

  async eliminarTarea(id: number): Promise<any> {
    return firstValueFrom(this.http.delete(`${this.API_URL}/${id}`));
  }

  async cambiarEstado(id: number, estado: 'P' | 'N' | 'C'): Promise<any> {
    return firstValueFrom(this.http.patch(`${this.API_URL}/${id}/estado`, { estado }));
  }

  async obtenerTareasPorEstado(estado: string): Promise<Tarea[]> {
    const response: any = await firstValueFrom(this.http.get(`${this.API_URL}/estado/${estado}`));
    return response.success ? response.data : [];
  }

  async obtenerTareasVencidas(): Promise<Tarea[]> {
    const response: any = await firstValueFrom(this.http.get(`${this.API_URL}/filtros/vencidas`));
    return response.success ? response.data : [];
  }
}
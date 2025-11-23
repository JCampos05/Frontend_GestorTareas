import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
  // ✅ NUEVOS campos
  idUsuarioAsignado?: number;
  nombreUsuarioAsignado?: string;
  emailUsuarioAsignado?: string;
}

export interface UsuarioDisponible {
  idUsuario: number;
  nombre: string;
  email: string;
  rol?: string;
  esPropietario: boolean;
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
      const tareas = response.success ? response.data : [];
      return tareas.map((tarea: any) => ({
        ...tarea,
        miDia: Boolean(tarea.miDia === 1 || tarea.miDia === true),
        repetir: Boolean(tarea.repetir === 1 || tarea.repetir === true),
        importante: Boolean(tarea.importante === 1 || tarea.importante === true)
      }));
    } catch (error) {
      console.error('Error al obtener tareas:', error);
      return [];
    }
  }

  async obtenerTarea(id: number): Promise<Tarea | null> {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.API_URL}/${id}`));
      if (response.success && response.data) {
        return {
          ...response.data,
          miDia: Boolean(response.data.miDia === 1 || response.data.miDia === true),
          repetir: Boolean(response.data.repetir === 1 || response.data.repetir === true),
          importante: Boolean(response.data.importante === 1 || response.data.importante === true)
        };
      }
      return null;
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

  cambiarEstado(id: number, estado: 'P' | 'N' | 'C'): Observable<any> {
    return this.http.patch(`${this.API_URL}/${id}/estado`, { estado });
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
      const tareas = response.success ? response.data : [];
      //  AGREGAR: Transformar booleanos
      return tareas.map((tarea: any) => ({
        ...tarea,
        miDia: Boolean(tarea.miDia === 1 || tarea.miDia === true),
        repetir: Boolean(tarea.repetir === 1 || tarea.repetir === true),
        importante: Boolean(tarea.importante === 1 || tarea.importante === true)
      }));
    } catch (error) {
      console.error('Error al obtener tareas Mi Día:', error);
      return [];
    }
  }

  //  NUEVOS métodos para asignación
  async asignarTarea(idTarea: number, idUsuarioAsignado: number): Promise<any> {
    try {
      return firstValueFrom(
        this.http.post(`${this.API_URL}/${idTarea}/asignar`, { idUsuarioAsignado })
      );
    } catch (error) {
      console.error('Error al asignar tarea:', error);
      throw error;
    }
  }

  async desasignarTarea(idTarea: number): Promise<any> {
    try {
      return firstValueFrom(
        this.http.delete(`${this.API_URL}/${idTarea}/asignar`)
      );
    } catch (error) {
      console.error('Error al desasignar tarea:', error);
      throw error;
    }
  }

  async obtenerUsuariosDisponibles(idLista: number): Promise<UsuarioDisponible[]> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.API_URL}/lista/${idLista}/usuarios-disponibles`)
      );
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error al obtener usuarios disponibles:', error);
      return [];
    }
  }

  async obtenerTodasTareasLista(idLista: number): Promise<Tarea[]> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`${this.API_URL}/lista/${idLista}/todas`)
      );
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error al obtener todas las tareas de lista:', error);
      return [];
    }
  }

  // ========== RECORDATORIOS ==========
  async agregarRecordatorio(idTarea: number, fecha: string, tipo: string): Promise<any> {
    try {
      return firstValueFrom(
        this.http.post(`${this.API_URL}/${idTarea}/recordatorios`, { fecha, tipo })
      );
    } catch (error) {
      console.error('Error al agregar recordatorio:', error);
      throw error;
    }
  }

  async eliminarRecordatorio(idTarea: number, indice: number): Promise<any> {
    try {
      return firstValueFrom(
        this.http.delete(`${this.API_URL}/${idTarea}/recordatorios/${indice}`)
      );
    } catch (error) {
      console.error('Error al eliminar recordatorio:', error);
      throw error;
    }
  }

  async obtenerRecordatorios(idTarea: number): Promise<any> {
    try {
      return firstValueFrom(
        this.http.get(`${this.API_URL}/${idTarea}/recordatorios`)
      );
    } catch (error) {
      console.error('Error al obtener recordatorios:', error);
      throw error;
    }
  }

}
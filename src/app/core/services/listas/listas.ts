import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Subject } from 'rxjs';

export interface Lista {
  idLista?: number;
  nombre: string;
  color?: string;
  icono?: string;
  importante?: boolean;
  idCategoria?: number;
  nombreCategoria?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ListasService {
  private API_URL = 'http://localhost:3000/api/listas';
  
  // Evento para notificar cambios en las listas
  private listasCambiadasSubject = new Subject<void>();
  listasCambiadas$ = this.listasCambiadasSubject.asObservable();

  constructor(private http: HttpClient) {}

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
    const response: any = await firstValueFrom(this.http.get(this.API_URL));
    return response.success ? response.data : [];
  }

  async obtenerLista(id: number): Promise<Lista | null> {
    const response: any = await firstValueFrom(this.http.get(`${this.API_URL}/${id}`));
    return response.success ? response.data : null;
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
    const response: any = await firstValueFrom(this.http.get(`${this.API_URL}/${id}/tareas`));
    if (response.success && response.data) {
      return response.data;
    }
    return null;
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
}
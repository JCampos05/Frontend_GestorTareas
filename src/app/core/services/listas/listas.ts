import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Lista {
  idLista?: number;
  nombre: string;
  color?: string;
  icono?: string;
  idCategoria?: number;
  nombreCategoria?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ListasService {
  private API_URL = 'http://localhost:3000/api/listas';

  constructor(private http: HttpClient) {}

  async crearLista(lista: Lista): Promise<any> {
    return firstValueFrom(this.http.post(this.API_URL, lista));
  }

  async obtenerListas(): Promise<Lista[]> {
    const response: any = await firstValueFrom(this.http.get(this.API_URL));
    return response.success ? response.data : [];
  }

  async obtenerLista(id: number): Promise<Lista | null> {
    const response: any = await firstValueFrom(this.http.get(`${this.API_URL}/${id}`));
    return response.success ? response.data : null;
  }

  async actualizarLista(id: number, lista: Lista): Promise<any> {
    return firstValueFrom(this.http.put(`${this.API_URL}/${id}`, lista));
  }

  async eliminarLista(id: number): Promise<any> {
    return firstValueFrom(this.http.delete(`${this.API_URL}/${id}`));
  }

  async obtenerListaConTareas(id: number): Promise<any> {
    const response: any = await firstValueFrom(this.http.get(`${this.API_URL}/${id}/tareas`));
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  }

  async obtenerListasSinCategoria(): Promise<Lista[]> {
    const listas = await this.obtenerListas();
    return listas.filter(lista => !lista.idCategoria);
  }
}
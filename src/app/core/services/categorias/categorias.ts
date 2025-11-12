import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Categoria {
  idCategoria?: number;
  nombre: string;
  color?: string;
  icono?: string;
  esPropietario?: boolean;
  rol?: string;
  compartida?: boolean;
  cantidadListas?: number;
  claveCompartir?: string;
  listas?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class CategoriasService {
  private API_URL = 'http://localhost:3000/api/categorias';

  constructor(private http: HttpClient) {}

  async crearCategoria(categoria: Categoria): Promise<any> {
    return firstValueFrom(this.http.post(this.API_URL, categoria));
  }

  async obtenerCategorias(): Promise<Categoria[]> {
    try {
      const response: any = await firstValueFrom(this.http.get(this.API_URL));
      // El backend devuelve { categorias: [...] }
      return response.categorias || [];
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      return [];
    }
  }

  async obtenerCategoria(id: number): Promise<Categoria | null> {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.API_URL}/${id}`));
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Error al obtener categoría:', error);
      return null;
    }
  }

  async actualizarCategoria(id: number, categoria: Categoria): Promise<any> {
    return firstValueFrom(this.http.put(`${this.API_URL}/${id}`, categoria));
  }

  async eliminarCategoria(id: number): Promise<any> {
    return firstValueFrom(this.http.delete(`${this.API_URL}/${id}`));
  }

  async obtenerListasPorCategoria(id: number): Promise<any[]> {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.API_URL}/${id}/listas`));
      if (response.success && response.data && response.data.listas) {
        return response.data.listas;
      }
      return [];
    } catch (error) {
      console.error('Error al obtener listas por categoría:', error);
      return [];
    }
  }
}
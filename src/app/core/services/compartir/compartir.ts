// src/app/core/services/compartir.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

export interface CompartirResponse {
  clave: string;
  url?: string;
  mensaje?: string;
  lista?: {
    idLista: number;
    nombre: string;
    claveCompartir: string;
  };
}

export interface UsuarioCompartido {
  id: number;
  email: string;
  rol: string;
  fechaAgregado: Date;
}

@Injectable({
  providedIn: 'root'
})
export class CompartirService {
  private apiUrl = 'http://localhost:3000/api/compartir';
  private listasUrl = 'http://localhost:3000/api/listas';
  private categoriasUrl = 'http://localhost:3000/api/categorias';

  constructor(private http: HttpClient) { }

  // Compartir categoría
  compartirCategoria(categoriaId: number, rol: string = 'lector'): Observable<CompartirResponse> {
    return this.http.post<CompartirResponse>(`${this.apiUrl}/categoria/${categoriaId}/generar-clave`, { rol });
  }

  // Compartir lista - CORREGIDO para usar el endpoint correcto
  compartirLista(listaId: number): Observable<CompartirResponse> {
    console.log('🔵 compartirService.compartirLista() - ID:', listaId);

    return this.http.put<any>(`${this.listasUrl}/${listaId}/compartir`, {}).pipe(
      map(response => {
        console.log('🟢 Respuesta RAW del backend:', response);
        console.log('🔑 Clave en response.clave:', response.clave);
        console.log('🔑 Clave en response.lista?.claveCompartir:', response.lista?.claveCompartir);

        // RETORNAR EXACTAMENTE LO QUE VIENE DEL BACKEND
        return {
          clave: response.clave,
          url: response.url || '',
          mensaje: response.mensaje,
          lista: response.lista
        };
      })
    );
  }

  // Unirse usando clave a categoría
  unirseCategoriaPorClave(clave: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/categoria/unirse`, { clave });
  }

  // Unirse usando clave a lista
  unirseListaPorClave(clave: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/lista/unirse`, { clave });
  }

  // Obtener usuarios con acceso
  obtenerUsuariosCompartidos(tipo: 'categoria' | 'lista', id: number): Observable<UsuarioCompartido[]> {
    const endpoint = tipo === 'categoria'
      ? `${this.apiUrl}/categoria/${id}/usuarios`
      : `${this.apiUrl}/lista/${id}/usuarios`;
    return this.http.get<UsuarioCompartido[]>(endpoint);
  }

  // Revocar acceso
  revocarAcceso(tipo: 'categoria' | 'lista', id: number, usuarioId: number): Observable<any> {
    const endpoint = tipo === 'categoria'
      ? `${this.apiUrl}/categoria/${id}/usuario/${usuarioId}`
      : `${this.apiUrl}/lista/${id}/usuario/${usuarioId}`;
    return this.http.delete(endpoint);
  }

  // Cambiar rol de usuario
  cambiarRol(tipo: 'categoria' | 'lista', id: number, usuarioId: number, nuevoRol: string): Observable<any> {
    const endpoint = tipo === 'categoria'
      ? `${this.apiUrl}/categoria/${id}/usuario/${usuarioId}/rol`
      : `${this.apiUrl}/lista/${id}/usuario/${usuarioId}/rol`;
    return this.http.put(endpoint, { rol: nuevoRol });
  }

  // Invitar usuario por email
  invitarUsuario(tipo: 'categoria' | 'lista', id: number, email: string, rol: string): Observable<any> {
    const endpoint = tipo === 'categoria'
      ? `${this.apiUrl}/categoria/${id}/invitar`
      : `${this.apiUrl}/lista/${id}/invitar`;
    return this.http.post(endpoint, { email, rol });
  }

  // Salir de categoría/lista compartida
  salir(tipo: 'categoria' | 'lista', id: number): Observable<any> {
    const endpoint = tipo === 'categoria'
      ? `${this.apiUrl}/categoria/${id}/salir`
      : `${this.apiUrl}/lista/${id}/salir`;
    return this.http.post(endpoint, {});
  }

  // Obtener categorías compartidas del usuario
  obtenerCategoriasCompartidas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mis-categorias-compartidas`);
  }

  // Obtener listas compartidas del usuario
  obtenerListasCompartidas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mis-listas-compartidas`);
  }

  // Obtener invitaciones pendientes
  obtenerInvitacionesPendientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/invitaciones/pendientes`);
  }

  // Aceptar invitación
  aceptarInvitacion(token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/invitaciones/${token}/aceptar`, {});
  }

  // Rechazar invitación
  rechazarInvitacion(token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/invitaciones/${token}/rechazar`, {});
  }

  // Descompartir - Revocar acceso de todos los usuarios
  descompartir(tipo: 'categoria' | 'lista', id: number): Observable<any> {
    const endpoint = tipo === 'categoria'
      ? `${this.apiUrl}/categoria/${id}/descompartir`
      : `${this.apiUrl}/lista/${id}/descompartir`;
    return this.http.post(endpoint, {});
  }
}
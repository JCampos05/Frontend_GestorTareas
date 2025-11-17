// core/services/notification/notification.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Notificacion {
  idNotificacion: number; // ✅ Cambiado de 'id' a 'idNotificacion'
  idUsuario: number;
  tipo: 'invitacion_lista' | 'tarea_asignada' | 'comentario' | 'otro';
  titulo: string;
  mensaje: string;
  leida: boolean;
  fechaCreacion: string; // ✅ Cambiado de 'fecha' a 'fechaCreacion'
  datos?: {
    listaId?: number;
    listaNombre?: string;
    invitadoPor?: string;
    invitadoPorId?: number;
    rol?: string;
  };
}

interface NotificacionesResponse {
  notificaciones: Notificacion[];
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:3000/api/compartir/notificaciones'; // ✅ Ruta corregida
  private notificacionesSubject = new BehaviorSubject<Notificacion[]>([]);
  private cantidadNoLeidasSubject = new BehaviorSubject<number>(0);

  public notificaciones$ = this.notificacionesSubject.asObservable();
  public cantidadNoLeidas$ = this.cantidadNoLeidasSubject.asObservable();

  constructor(private http: HttpClient) {
    this.cargarNotificaciones();
  }

  cargarNotificaciones(): void {
    this.http.get<NotificacionesResponse>(this.apiUrl).subscribe({
      next: (response) => {
        const notificaciones = (response.notificaciones || []).map((n: any) => ({
          ...n,
          // AGREGAR: Transformar leida a boolean
          leida: Boolean(n.leida === 1 || n.leida === true)
        }));
        this.notificacionesSubject.next(notificaciones);
        this.actualizarCantidadNoLeidas(notificaciones);
      },
      error: (error) => console.error('Error al cargar notificaciones:', error)
    });
  }

  private actualizarCantidadNoLeidas(notificaciones: Notificacion[]): void {
    const noLeidas = notificaciones.filter(n => !n.leida).length;
    this.cantidadNoLeidasSubject.next(noLeidas);
  }

  marcarComoLeida(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/leer`, {}).pipe(
      tap(() => this.cargarNotificaciones())
    );
  }

  aceptarInvitacion(notificacionId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${notificacionId}/aceptar`, {}).pipe(
      tap(() => this.cargarNotificaciones())
    );
  }

  rechazarInvitacion(notificacionId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${notificacionId}/rechazar`, {}).pipe(
      tap(() => this.cargarNotificaciones())
    );
  }

  marcarTodasComoLeidas(): Observable<any> {
    return this.http.put(`${this.apiUrl}/leer-todas`, {}).pipe(
      tap(() => this.cargarNotificaciones())
    );
  }
}
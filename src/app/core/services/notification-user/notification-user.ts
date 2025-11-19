// core/services/notification/notification.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Notificacion {
  idNotificacion: number;
  idUsuario: number;
  tipo: 'invitacion_lista' | 'tarea_asignada' | 'comentario' | 'tarea_repetir' | 'recordatorio' | 'otro';  // ✅ AGREGAR los nuevos tipos
  titulo: string;
  mensaje: string;
  leida: boolean;
  fechaCreacion: string;
  datos?: {
    listaId?: number;
    listaNombre?: string;
    invitadoPor?: string;
    invitadoPorId?: number;
    rol?: string;
    tareaId?: number;           //  AGREGAR
    tareaNombre?: string;       //  AGREGAR
    fechaVencimiento?: string;  //  AGREGAR
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
    setInterval(() => this.cargarNotificaciones(), 30000);
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

  // AGREGAR: Crear notificación de repetición de tarea
  crearNotificacionRepeticion(tareaId: number, tareaNombre: string, fechaVencimiento: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/crear-repeticion`, {
      tareaId,
      tareaNombre,
      fechaVencimiento
    }).pipe(
      tap(() => this.cargarNotificaciones())
    );
  }

  // AGREGAR: Programar notificación de recordatorio
  programarRecordatorio(tareaId: number, tareaNombre: string, fechaRecordatorio: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/programar-recordatorio`, {
      tareaId,
      tareaNombre,
      fechaRecordatorio
    }).pipe(
      tap(() => this.cargarNotificaciones())
    );
  }
}
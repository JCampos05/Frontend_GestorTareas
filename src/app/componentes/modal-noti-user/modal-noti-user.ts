// app/componentes/modal-notificaciones/modal-notificaciones.component.ts
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService, Notificacion } from '../../core/services/notification-user/notification-user';

@Component({
  selector: 'app-modal-notificaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-noti-user.html',
  styleUrls: ['./modal-noti-user.css']
})
export class ModalNotificacionesComponent implements OnInit {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  notificaciones: Notificacion[] = [];
  procesando = false;
  tieneNotificacionesNoLeidas = false;

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.notificationService.notificaciones$.subscribe(notificaciones => {
      this.notificaciones = notificaciones;
      this.actualizarEstadoNoLeidas();
    });
  }

  private actualizarEstadoNoLeidas() {
    this.tieneNotificacionesNoLeidas = this.notificaciones && 
                                        this.notificaciones.length > 0 && 
                                        this.notificaciones.some(n => !n.leida);
  }

  aceptarInvitacion(notificacion: Notificacion) {
    if (this.procesando) return;
    
    this.procesando = true;
    this.notificationService.aceptarInvitacion(notificacion.idNotificacion).subscribe({ // ✅ Cambiado
      next: () => {
        this.procesando = false;
        this.cerrar();
        // Redirigir a la lista compartida
        if (notificacion.datos?.listaId) {
          this.router.navigate(['/app/compartida/:id'], {
            queryParams: { id: notificacion.datos.listaId }
          });
        }
      },
      error: (error) => {
        console.error('Error al aceptar invitación:', error);
        alert('Error al aceptar la invitación');
        this.procesando = false;
      }
    });
  }

  rechazarInvitacion(notificacion: Notificacion) {
    if (this.procesando) return;
    
    if (!confirm('¿Seguro que deseas rechazar esta invitación?')) {
      return;
    }

    this.procesando = true;
    this.notificationService.rechazarInvitacion(notificacion.idNotificacion).subscribe({ // ✅ Cambiado
      next: () => {
        this.procesando = false;
      },
      error: (error) => {
        console.error('Error al rechazar invitación:', error);
        alert('Error al rechazar la invitación');
        this.procesando = false;
      }
    });
  }

  marcarComoLeida(notificacion: Notificacion) {
    if (!notificacion.leida) {
      this.notificationService.marcarComoLeida(notificacion.idNotificacion).subscribe(); // ✅ Cambiado
    }
  }

  marcarTodasLeidas() {
    this.notificationService.marcarTodasComoLeidas().subscribe();
  }

  obtenerIcono(tipo: string): string {
    switch (tipo) {
      case 'invitacion_lista':
        return 'fa-user-plus';
      case 'tarea_asignada':
        return 'fa-tasks';
      case 'comentario':
        return 'fa-comment';
      default:
        return 'fa-bell';
    }
  }

  obtenerTiempoRelativo(fecha: string): string {
    const ahora = new Date();
    const fechaNotif = new Date(fecha);
    const diffMs = ahora.getTime() - fechaNotif.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHoras < 24) return `Hace ${diffHoras}h`;
    if (diffDias < 7) return `Hace ${diffDias}d`;
    return fechaNotif.toLocaleDateString();
  }

  cerrar() {
    this.close.emit();
  }
}
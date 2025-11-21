import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService, Notificacion } from '../../../core/services/notification-user/notification-user';

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
  @Output() abrirTarea = new EventEmitter<number>();

  notificaciones: Notificacion[] = [];
  procesando = false;
  tieneNotificacionesNoLeidas = false;

  private notificacionesOcultas = new Set<number>();

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) { }

  ngOnInit() {
    this.cargarNotificacionesOcultas();
    this.notificationService.notificaciones$.subscribe(notificaciones => {
      this.notificaciones = notificaciones;
      this.actualizarEstadoNoLeidas();
    });
  }

  // NUEVO: Cargar notificaciones ocultas desde localStorage
  private cargarNotificacionesOcultas() {
    try {
      const ocultas = localStorage.getItem('notificaciones_ocultas');
      if (ocultas) {
        const ids = JSON.parse(ocultas);
        this.notificacionesOcultas = new Set(ids);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones ocultas:', error);
    }
  }

  // NUEVO: Guardar notificaciones ocultas en localStorage
  private guardarNotificacionesOcultas() {
    try {
      const ids = Array.from(this.notificacionesOcultas);
      localStorage.setItem('notificaciones_ocultas', JSON.stringify(ids));
    } catch (error) {
      console.error('Error al guardar notificaciones ocultas:', error);
    }
  }

  // NUEVO: Ocultar notificación visualmente
  ocultarNotificacion(idNotificacion: number) {
    this.notificacionesOcultas.add(idNotificacion);
    this.guardarNotificacionesOcultas();

    // Actualizar la lista visualmente
    this.notificaciones = this.notificaciones.filter(
      n => n.idNotificacion !== idNotificacion
    );
    this.actualizarEstadoNoLeidas();
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

  // En el lugar donde llamas a marcarComoLeida
  marcarComoLeida(notificacion: Notificacion) {
    // ✅ Validación exhaustiva
    if (!notificacion) {
      console.error('❌ Notificación es undefined o null');
      return;
    }

    console.log('🔍 Intentando marcar notificación como leída');
    console.log('📦 Objeto completo:', notificacion);
    console.log('🆔 idNotificacion:', notificacion.idNotificacion);
    console.log('🆔 id (alternativo):', (notificacion as any).id);

    // ✅ Intentar obtener el ID de diferentes formas
    const id = notificacion.idNotificacion || (notificacion as any).id;

    if (!id || id === undefined || id === null) {
      console.error('❌ ID de notificación no encontrado en:', notificacion);
      console.error('❌ Campos disponibles:', Object.keys(notificacion));

      // ✅ Intentar usar el servicio para ocultar visualmente
      alert('Esta notificación no puede ser marcada como leída. Será ocultada.');
      this.ocultarNotificacion((notificacion as any).id || 0);
      return;
    }

    console.log(`✅ ID válido encontrado: ${id}, procediendo a marcar como leída`);

    // ✅ Si la notificación ya está leída, no hacer nada
    if (notificacion.leida) {
      console.log('ℹ️ Notificación ya está marcada como leída');
      return;
    }

    // ✅ Marcar como leída en el servidor
    this.notificationService.marcarComoLeida(id)
      .subscribe({
        next: () => {
          console.log('✅ Notificación marcada como leída exitosamente');
        },
        error: (error) => {
          console.error('❌ Error al marcar como leída:', error);
          console.error('❌ Detalles del error:', error.error || error.message);
        }
      });
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
      case 'tarea_repetir':        //  AGREGAR
        return 'fa-redo';           //  AGREGAR
      case 'recordatorio':          //  AGREGAR
        return 'fa-bell';           //  AGREGAR
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
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService, Notificacion } from '../notification-user/notification-user';

@Injectable({
  providedIn: 'root'
})
export class NotificationInterceptorService {
  private procesadasIds = new Set<number>();

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.iniciarEscucha();
  }

  private iniciarEscucha(): void {
    this.notificationService.notificaciones$.subscribe(notificaciones => {
      // Procesar solo notificaciones nuevas no leídas
      const nuevas = notificaciones.filter(n =>
        !n.leida && !this.procesadasIds.has(n.idNotificacion)
      );

      nuevas.forEach(notif => {
        this.procesarNotificacion(notif);
        this.procesadasIds.add(notif.idNotificacion);
      });
    });
  }

private procesarNotificacion(notif: Notificacion): void {
    console.log(' Procesando notificación global:', notif);

    switch (notif.tipo) {
      case 'cambio_rol_lista':
        this.manejarCambioRol(notif);
        break;

      case 'invitacion_lista':
        this.manejarInvitacion(notif);
        break;

      case 'tarea_asignada':
        this.manejarTareaAsignada(notif);
        break;

      case 'mensaje_chat':
        this.manejarMensajeChat(notif);
        break;

      case 'otro':
        if (notif.datos?.revocadoPor) {
          this.manejarRevocacion(notif);
        }
        break;
    }
  }

  private manejarMensajeChat(notif: Notificacion): void {
    const listaNombre = notif.datos?.listaNombre;
    const nombreRemitente = notif.datos?.nombreRemitente;
    const listaId = notif.datos?.listaId;

    console.log('Mensaje de chat recibido:', { listaNombre, nombreRemitente, listaId });

    this.mostrarNotificacionVisual(
      'Nuevo mensaje',
      `${nombreRemitente} escribió en "${listaNombre}"`,
      () => {
        if (listaId) {
          this.router.navigate(['/app/lista', listaId]);
        }
      }
    );
  }


  private manejarCambioRol(notif: Notificacion): void {
    const listaId = notif.datos?.listaId || notif.datos?.listaId;
    const nuevoRol = notif.datos?.nuevoRol;
    const listaNombre = notif.datos?.listaNombre;

    console.log('Cambio de rol detectado:', { listaId, nuevoRol, listaNombre });

    // Mostrar notificación visual del navegador
    this.mostrarNotificacionVisual(
      'Cambio de rol',
      `Tu rol en "${listaNombre}" cambió a: ${nuevoRol}`,
      () => {
        if (listaId) {
          this.router.navigate(['/app/lista', listaId]);
        }
      }
    );
  }

  private manejarInvitacion(notif: Notificacion): void {
    const listaNombre = notif.datos?.listaNombre;
    const invitadoPor = notif.datos?.invitadoPor;

    this.mostrarNotificacionVisual(
      'Nueva invitación',
      `${invitadoPor} te invitó a "${listaNombre}"`,
      () => {
        // Navegar a listas compartidas
        this.router.navigate(['/app/listas']);
      }
    );
  }

  private manejarTareaAsignada(notif: Notificacion): void {
    const tareaNombre = notif.datos?.tareaNombre;
    const listaNombre = notif.datos?.listaNombre;
    const listaId = notif.datos?.listaId;

    this.mostrarNotificacionVisual(
      'Tarea asignada',
      `Nueva tarea: "${tareaNombre}" en ${listaNombre}`,
      () => {
        if (listaId) {
          this.router.navigate(['/app/lista', listaId]);
        }
      }
    );
  }

  private manejarRevocacion(notif: Notificacion): void {
    const listaNombre = notif.datos?.listaNombre;
    const revocadoPor = notif.datos?.revocadoPor;
    const listaId = notif.datos?.listaId;

    this.mostrarNotificacionVisual(
      'Acceso revocado',
      `${revocadoPor} revocó tu acceso a "${listaNombre}"`,
      () => {
        // Redirigir a home
        this.router.navigate(['/app/mi-dia']);
      },
      true // Es crítico
    );

    // Si estamos en esa lista, redirigir inmediatamente
    const currentUrl = this.router.url;
    if (currentUrl.includes(`/app/lista/${listaId}`)) {
      setTimeout(() => {
        this.router.navigate(['/app/mi-dia']);
      }, 2000);
    }
  }

  private mostrarNotificacionVisual(
    titulo: string,
    mensaje: string,
    onClick?: () => void,
    critico: boolean = false
  ): void {
    // Usar notificaciones del navegador si están permitidas
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(titulo, {
        body: mensaje,
        icon: '/assets/logo.png', // Ajusta la ruta
        badge: '/assets/badge.png',
        tag: `taskeer-${Date.now()}`,
        requireInteraction: critico
      });

      if (onClick) {
        notification.onclick = () => {
          window.focus();
          onClick();
          notification.close();
        };
      }
    } else {
      // Fallback: Usar alert si no hay permisos
      if (critico) {
        alert(`${titulo}\n\n${mensaje}`);
        if (onClick) onClick();
      } else {
        console.log(`${titulo}: ${mensaje}`);
      }
    }
  }

  // Solicitar permisos de notificación al iniciar
  public solicitarPermisos(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log(' Permisos de notificación:', permission);
      });
    }
  }
}
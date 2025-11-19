import { Component, EventEmitter, Output, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, Usuario } from '../../../core/services/authentication/authentication';
import { NotificationService } from '../../../core/services/notification-user/notification-user';
import { ModalNotificacionesComponent } from '../../modales/modal-noti-user/modal-noti-user';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FormsModule, CommonModule, ModalNotificacionesComponent],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent implements OnInit {
  @Output() toggleSidebarEvent = new EventEmitter<void>();
  searchQuery: string = '';
  showUserMenu: boolean = false;
  showNotificaciones: boolean = false;
  cantidadNoLeidas: number = 0;
  
  usuario: {
    nombre: string;
    email: string;
    iniciales: string;
  } = {
    nombre: 'Usuario',
    email: 'usuario@ejemplo.com',
    iniciales: 'U'
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.cargarDatosUsuario();
    
    this.authService.usuarioActual$.subscribe(usuario => {
      if (usuario) {
        this.actualizarDatosUsuario(usuario);
      }
    });

    // Suscribirse a las notificaciones no leídas
    this.notificationService.cantidadNoLeidas$.subscribe(cantidad => {
      this.cantidadNoLeidas = cantidad;
    });
  }

  private cargarDatosUsuario() {
    const usuarioActual = this.authService.obtenerUsuarioActual();
    if (usuarioActual) {
      this.actualizarDatosUsuario(usuarioActual);
    }
  }

  private actualizarDatosUsuario(usuario: Usuario) {
    this.usuario = {
      nombre: usuario.nombre,
      email: usuario.email,
      iniciales: this.obtenerIniciales(usuario.nombre)
    };
  }

  private obtenerIniciales(nombre: string): string {
    if (!nombre) return 'U';
    
    const palabras = nombre.trim().split(' ');
    if (palabras.length >= 2) {
      return (palabras[0][0] + palabras[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }

  toggleSidebar() {
    this.toggleSidebarEvent.emit();
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/app/buscar'], {
        queryParams: { q: this.searchQuery }
      });
    }
  }

  cambiarVista() {
    console.log('Función pendiente: cambiar vista de día');
  }

  loginGoogle() {
    console.log('Login con Google');
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
    if (this.showUserMenu) {
      this.showNotificaciones = false;
    }
  }

  toggleNotificaciones() {
    this.showNotificaciones = !this.showNotificaciones;
    if (this.showNotificaciones) {
      this.showUserMenu = false;
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-profile') && !target.closest('.user-menu')) {
      this.showUserMenu = false;
    }
    if (!target.closest('.btn-notificaciones') && !target.closest('.modal-notificaciones')) {
      this.showNotificaciones = false;
    }
  }

  verPerfil() {
    console.log('Ver perfil');
    this.showUserMenu = false;
    this.router.navigate(['/perfil']);
  }

  verConfiguracion() {
    console.log('Ver configuración');
    this.showUserMenu = false;
    this.router.navigate(['/configuracion']);
  }

  cerrarSesion() {
    console.log('Cerrando sesión...');
    this.showUserMenu = false;
    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
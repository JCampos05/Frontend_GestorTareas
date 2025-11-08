import { Component, EventEmitter, Output, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, Usuario } from '../../core/services/authentication/authentication';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent implements OnInit {
  @Output() toggleSidebarEvent = new EventEmitter<void>();
  searchQuery: string = '';
  showUserMenu: boolean = false;
  
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
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarDatosUsuario();
    
    // Suscribirse a cambios del usuario
    this.authService.usuarioActual$.subscribe(usuario => {
      if (usuario) {
        this.actualizarDatosUsuario(usuario);
      }
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
    console.log('Buscando:', this.searchQuery);
    // TODO: Implementar búsqueda
  }

  cambiarVista() {
    console.log('Función pendiente: cambiar vista de día');
    // TODO: Implementar cambio de vista
  }

  loginGoogle() {
    console.log('Login con Google');
    // TODO: Implementar autenticación
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  // Cerrar el menú al hacer clic fuera de él
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-profile') && !target.closest('.user-menu')) {
      this.showUserMenu = false;
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
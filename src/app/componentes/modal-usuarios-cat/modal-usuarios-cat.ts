import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompartirService, UsuarioCompartido, InfoCompartidos } from '../../core/services/compartir/compartir';

@Component({
  selector: 'app-modal-usuarios-categoria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-usuarios-cat.html',
  styleUrls: ['./modal-usuarios-cat.css']
})
export class ModalUsuariosCategoriaComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() categoriaId: number = 0;
  @Input() esPropietario = false;
  @Input() esAdmin = false;
  @Output() close = new EventEmitter<void>();
  @Output() actualizado = new EventEmitter<void>();

  infoCompartidos: InfoCompartidos | null = null;
  emailInvitar = '';
  rolInvitar = 'colaborador';
  loadingInvitar = false;
  copiado = false;

  constructor(private compartirService: CompartirService) {}

  ngOnInit() {
    if (this.isOpen && this.categoriaId) {
      this.cargarUsuarios();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen && this.categoriaId) {
      this.cargarUsuarios();
    }
  }

  cargarUsuarios() {
    this.compartirService.obtenerInfoCompartidosCategoria(this.categoriaId).subscribe({
      next: (info) => {
        this.infoCompartidos = info;
        console.log('✅ Info compartidos categoría cargada:', info);
      },
      error: (error) => {
        console.error('❌ Error al cargar usuarios:', error);
        // No mostrar alert, solo silenciar el error
        this.infoCompartidos = {
          usuarios: [],
          totalUsuarios: 0,
          puedesGestionar: this.esPropietario || this.esAdmin
        };
      }
    });
  }

  invitarUsuario() {
    if (!this.emailInvitar || !this.emailInvitar.includes('@')) {
      alert('Por favor ingresa un email válido');
      return;
    }

    this.loadingInvitar = true;

    this.compartirService.invitarUsuarioCategoria(this.categoriaId, this.emailInvitar, this.rolInvitar).subscribe({
      next: (response) => {
        console.log('✅ Usuario invitado:', response);
        alert(`Invitación enviada a ${this.emailInvitar}`);
        this.emailInvitar = '';
        this.cargarUsuarios();
        this.actualizado.emit();
        this.loadingInvitar = false;
      },
      error: (error) => {
        console.error('❌ Error al invitar:', error);
        alert(error.error?.error || 'Error al enviar invitación');
        this.loadingInvitar = false;
      }
    });
  }

  onRolChange(usuario: UsuarioCompartido, nuevoRol: string) {
    console.log('🔄 Rol cambiado para', usuario.nombre, ':', nuevoRol);
    this.cambiarRolEnServidor(usuario, nuevoRol);
  }

  private cambiarRolEnServidor(usuario: UsuarioCompartido, nuevoRol: string) {
    const rolAnterior = usuario.rol;
    
    this.compartirService.modificarRolCategoria(this.categoriaId, usuario.idUsuario, nuevoRol).subscribe({
      next: () => {
        console.log('✅ Rol actualizado exitosamente');
        this.cargarUsuarios();
        this.actualizado.emit();
      },
      error: (error) => {
        console.error('❌ Error al cambiar rol:', error);
        usuario.rol = rolAnterior;
        const mensajeError = error.error?.error || error.error?.detalles || 'Error al cambiar el rol';
        alert(`Error: ${mensajeError}`);
        this.cargarUsuarios();
      }
    });
  }

  revocarAcceso(usuario: UsuarioCompartido) {
    if (!confirm(`¿Seguro que deseas revocar el acceso de ${usuario.nombre}?`)) {
      return;
    }

    this.compartirService.revocarAccesoCategoria(this.categoriaId, usuario.idUsuario).subscribe({
      next: () => {
        console.log('✅ Acceso revocado');
        alert(`Acceso revocado para ${usuario.nombre}`);
        this.cargarUsuarios();
        this.actualizado.emit();
      },
      error: (error) => {
        console.error('❌ Error al revocar:', error);
        alert('Error al revocar acceso');
      }
    });
  }

  copiarClave() {
    const clave = this.infoCompartidos?.categoria?.claveCompartir;
    if (!clave) return;

    navigator.clipboard.writeText(clave).then(() => {
      this.copiado = true;
      setTimeout(() => this.copiado = false, 2000);
    });
  }

  obtenerIniciales(nombre: string): string {
    if (!nombre) return '?';
    const palabras = nombre.trim().split(' ');
    if (palabras.length === 1) {
      return palabras[0].substring(0, 2).toUpperCase();
    }
    return (palabras[0][0] + palabras[palabras.length - 1][0]).toUpperCase();
  }

  cerrar() {
    this.close.emit();
  }
}
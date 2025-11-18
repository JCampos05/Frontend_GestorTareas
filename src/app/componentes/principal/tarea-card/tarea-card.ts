import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TareasService, Tarea } from '../../../core/services/tareas/tareas';
import { NotificacionesService } from '../../../core/services/notification/notification';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { ModalEliminarTareaComponent } from '../../modales/modal-eliminar-tarea/modal-eliminar-tarea';

@Component({
  selector: 'app-tarea-card',
  standalone: true,
  imports: [CommonModule, CdkDragHandle, ModalEliminarTareaComponent],
  templateUrl: './tarea-card.html',
  styleUrl: './tarea-card.css'
})
export class TareaCardComponent {
  @Input() tarea!: Tarea;
  @Input() puedeEditar: boolean = true;
  @Input() puedeEliminar: boolean = true;
  @Input() puedeAsignar: boolean = false;

  @Output() tareaClick = new EventEmitter<void>();
  @Output() estadoCambiado = new EventEmitter<void>();
  @Output() tareaEliminada = new EventEmitter<void>();
  @Output() asignarClick = new EventEmitter<void>();

  mostrarModalEliminar = false;
  tareaAEliminar: any = null;
  isClosingModal = false; // ✅ Para animación

  constructor(
    private tareasService: TareasService,
    private notificacionesService: NotificacionesService
  ) { }

  onTareaClick() {
    this.tareaClick.emit();
  }

  onCheckboxChange(event: Event) {
    event.stopPropagation();
    const checkbox = event.target as HTMLInputElement;
    const nuevoEstado = checkbox.checked ? 'C' : 'P';

    const estadoAnterior = this.tarea.estado;
    this.tarea.estado = nuevoEstado;

    this.tareasService.cambiarEstado(this.tarea.idTarea!, nuevoEstado).subscribe({
      next: () => {
        this.estadoCambiado.emit();
        console.log('✅ Estado cambiado exitosamente:', nuevoEstado);
      },
      error: (error) => {
        console.error('❌ Error al cambiar estado:', error);
        this.tarea.estado = estadoAnterior;
        checkbox.checked = estadoAnterior === 'C';
        this.notificacionesService.error('Error al actualizar el estado de la tarea');
      }
    });
  }

  async cambiarEstado(event: Event, nuevoEstado: 'P' | 'N' | 'C') {
    event.stopPropagation();

    this.tareasService.cambiarEstado(this.tarea.idTarea!, nuevoEstado).subscribe({
      next: () => {
        this.tarea.estado = nuevoEstado;
        this.estadoCambiado.emit();
      },
      error: (error) => {
        console.error('❌ Error al cambiar estado:', error);
        this.notificacionesService.error('Error al actualizar el estado de la tarea');
      }
    });
  }

  // ✅ MÉTODO ACTUALIZADO - Abre el modal en lugar de usar confirm()
  async eliminarTarea(event: Event) {
    event.stopPropagation();
    
    // Abrir el modal
    this.tareaAEliminar = this.tarea;
    this.mostrarModalEliminar = true;
  }

  // ✅ CONFIRMACIÓN CON LÓGICA REAL DE ELIMINACIÓN
  async confirmarEliminacion() {
    try {
      await this.tareasService.eliminarTarea(this.tareaAEliminar.idTarea!);
      this.notificacionesService.exito('Tarea eliminada exitosamente');
      this.tareaEliminada.emit();
      
      // Cerrar modal
      this.mostrarModalEliminar = false;
      this.tareaAEliminar = null;
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      this.notificacionesService.error('Error al eliminar la tarea. Por favor, intenta nuevamente.');
      
      // Cerrar modal incluso si hay error
      this.mostrarModalEliminar = false;
      this.tareaAEliminar = null;
    }
  }

  // ✅ CANCELACIÓN - Solo cierra el modal con animación
  cancelarEliminacion() {
    this.isClosingModal = true;
    setTimeout(() => {
      this.mostrarModalEliminar = false;
      this.tareaAEliminar = null;
      this.isClosingModal = false;
    }, 200);
  }

  abrirModalAsignar(event: Event) {
    event.stopPropagation();
    console.log('🎯 tarea-card: Emitiendo evento asignarClick para tarea:', this.tarea.idTarea, this.tarea.nombre);
    this.asignarClick.emit();
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  esEmoji(icono: string | null | undefined): boolean {
    if (!icono || icono === 'null' || icono === '') return false;

    if (icono.trim().startsWith('fa')) {
      return false;
    }

    return true;
  }

  obtenerClaseIcono(icono: string | null | undefined): string {
    if (!icono || icono === 'null' || icono === '') {
      return 'fas fa-clipboard-list';
    }

    const iconoLimpio = icono.trim();

    if (iconoLimpio.startsWith('fas ') || iconoLimpio.startsWith('far ')) {
      return iconoLimpio;
    }

    if (iconoLimpio.startsWith('fa-')) {
      return `fas ${iconoLimpio}`;
    }

    return 'fas fa-clipboard-list';
  }

  async alternarMiDia(event: Event) {
    event.stopPropagation();

    try {
      const nuevoValor = !this.tarea.miDia;
      const response = await this.tareasService.alternarMiDia(this.tarea.idTarea!, nuevoValor);

      this.tarea.miDia = nuevoValor;
      this.estadoCambiado.emit();

      if (nuevoValor) {
        this.notificacionesService.exito('Tarea agregada a Mi Día');
      } else {
        this.notificacionesService.exito('Tarea eliminada de Mi Día');
      }
    } catch (error) {
      console.error('Error al actualizar Mi Día:', error);
      this.notificacionesService.error('Error al actualizar Mi Día. Por favor, intenta nuevamente.');
    }
  }

  get mostrarBotonIniciar(): boolean {
    return this.tarea.estado === 'P';
  }

  get mostrarBotonesProceso(): boolean {
    return this.tarea.estado === 'N';
  }

  get mostrarBotonReabrir(): boolean {
    return this.tarea.estado === 'C';
  }
}
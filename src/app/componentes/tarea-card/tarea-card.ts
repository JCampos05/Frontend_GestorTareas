import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TareasService, Tarea } from '../../core/services/tareas/tareas';
import { NotificacionesService } from '../../core/services/notification/notification';

@Component({
  selector: 'app-tarea-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tarea-card.html',
  styleUrl: './tarea-card.css'
})
export class TareaCardComponent {
  @Input() tarea!: Tarea;
  @Input() puedeEditar: boolean = true;
  @Input() puedeEliminar: boolean = true;
  @Output() tareaClick = new EventEmitter<void>();
  @Output() estadoCambiado = new EventEmitter<void>();
  @Output() tareaEliminada = new EventEmitter<void>();

  constructor(
    private tareasService: TareasService,
    private notificacionesService: NotificacionesService
  ) {}

  onTareaClick() {
    this.tareaClick.emit();
  }

  async onCheckboxChange(event: Event) {
    event.stopPropagation();
    const checkbox = event.target as HTMLInputElement;
    const nuevoEstado = checkbox.checked ? 'C' : 'P';
    
    try {
      await this.tareasService.cambiarEstado(this.tarea.idTarea!, nuevoEstado);
      this.tarea.estado = nuevoEstado;
      this.estadoCambiado.emit();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      checkbox.checked = !checkbox.checked;
    }
  }

  async cambiarEstado(event: Event, nuevoEstado: 'P' | 'N' | 'C') {
    event.stopPropagation();
    
    try {
      await this.tareasService.cambiarEstado(this.tarea.idTarea!, nuevoEstado);
      this.tarea.estado = nuevoEstado;
      this.estadoCambiado.emit();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  }

  async eliminarTarea(event: Event) {
    event.stopPropagation();
    
    const confirmacion = confirm(`¿Estás seguro de que deseas eliminar la tarea "${this.tarea.nombre}"?`);
    
    if (confirmacion) {
      try {
        await this.tareasService.eliminarTarea(this.tarea.idTarea!);
        this.notificacionesService.exito('Tarea eliminada exitosamente');
        this.tareaEliminada.emit();
      } catch (error) {
        console.error('Error al eliminar tarea:', error);
        this.notificacionesService.error('Error al eliminar la tarea. Por favor, intenta nuevamente.');
      }
    }
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  esEmoji(icono: string | null | undefined): boolean {
    if (!icono || icono === 'null' || icono === '') return false;
    
    // Si empieza con 'fa', es un icono Font Awesome
    if (icono.trim().startsWith('fa')) {
      return false;
    }
    
    // Si es otra cosa (emoji), devolver true
    return true;
  }

  obtenerClaseIcono(icono: string | null | undefined): string {
    // Si no hay icono o es null
    if (!icono || icono === 'null' || icono === '') {
      return 'fas fa-clipboard-list';
    }

    // Limpiar espacios
    const iconoLimpio = icono.trim();

    // Si ya tiene el prefijo 'fas ' o 'far '
    if (iconoLimpio.startsWith('fas ') || iconoLimpio.startsWith('far ')) {
      return iconoLimpio;
    }

    // Si empieza con 'fa-', agregar prefijo 'fas'
    if (iconoLimpio.startsWith('fa-')) {
      return `fas ${iconoLimpio}`;
    }

    // Default
    return 'fas fa-clipboard-list';
  }

  async alternarMiDia(event: Event) {
    event.stopPropagation();

    try {
      const nuevoValor = !this.tarea.miDia;
      await this.tareasService.alternarMiDia(this.tarea.idTarea!, nuevoValor);
      this.tarea.miDia = nuevoValor;
      this.estadoCambiado.emit();

      if (nuevoValor){
        this.notificacionesService.exito('Tarea agregada a Mi Día');
      } else {
        this.notificacionesService.exito('Tarea eliminada de Mi Día');
      }
    } catch (error) {
      //console.error('Error al alternar Mi Día:', error);
      this.notificacionesService.error('Error al actualizar Mi Día. Por favor, intenta nuevamente.');
    }
  }
/*ngOnInit() {
    // Debug: verificar datos de la lista
    console.log('Tarea:', this.tarea.nombre);
    console.log('Lista:', this.tarea.nombreLista);
    console.log('Icono Lista:', this.tarea.iconoLista);
    console.log('Color Lista:', this.tarea.colorLista);
  }*/
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
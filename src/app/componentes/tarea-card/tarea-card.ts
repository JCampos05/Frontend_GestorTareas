import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TareasService, Tarea } from '../../core/services/tareas/tareas';

@Component({
  selector: 'app-tarea-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tarea-card.html',
  styleUrl: './tarea-card.css'
})
export class TareaCardComponent {
  @Input() tarea!: Tarea;
  @Output() tareaClick = new EventEmitter<void>();
  @Output() estadoCambiado = new EventEmitter<void>();

  constructor(private tareasService: TareasService) {}

  onTareaClick() {
    this.tareaClick.emit();
  }

  async onCheckboxChange(event: Event) {
    event.stopPropagation();
    const checkbox = event.target as HTMLInputElement;
    const nuevoEstado = checkbox.checked ? 'C' : 'P';
    
    try {
      await this.tareasService.cambiarEstado(this.tarea.idTarea!, nuevoEstado);
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
      this.estadoCambiado.emit();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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
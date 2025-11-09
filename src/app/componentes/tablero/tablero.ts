import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TareasService, Tarea } from '../../core/services/tareas/tareas';
import { ListasService } from '../../core/services/listas/listas';
import { TareaCardComponent } from '../tarea-card/tarea-card';
import { PanelDetallesComponent } from '../panel-detalles/panel-detalles';
import { CdkDrag, CdkDropList, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-tablero',
  standalone: true,
  imports: [CommonModule, TareaCardComponent, PanelDetallesComponent, CdkDrag, CdkDropList],
  templateUrl: './tablero.html',
  styleUrl: './tablero.css'
})
export class TableroComponent implements OnInit {
  @Input() tipoVista: 'pendientes' | 'progreso' | 'completadas' | 'vencidas' | 'mi-dia' = 'pendientes';
  
  tareasColumna: Tarea[] = [];
  
  panelAbierto = false;
  tareaSeleccionada: number | null = null;

  constructor(
    private tareasService: TareasService,
    private listasService: ListasService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.cargarTareas();
  }

  async cargarTareas() {
    try {
      let tareas: Tarea[] = [];
      
      if (this.tipoVista === 'mi-dia') {
        // Usar el endpoint específico para Mi Día
        tareas = await this.tareasService.obtenerTareasMiDia();
      } else if (this.tipoVista === 'vencidas') {
        tareas = await this.tareasService.obtenerTareasVencidas();
      } else {
        const estadoMap = {
          'pendientes': 'P',
          'progreso': 'N',
          'completadas': 'C'
        };
        tareas = await this.tareasService.obtenerTareasPorEstado(estadoMap[this.tipoVista]);
      }
      
      this.tareasColumna = tareas;
    } catch (error) {
      console.error('Error al cargar tareas:', error);
    }
  }

  get tituloColumna(): string {
    const titulos = {
      'mi-dia': 'Mi Día',
      'pendientes': 'Tareas Pendientes',
      'progreso': 'En Proceso',
      'completadas': 'Completadas',
      'vencidas': 'Vencidas'
    };
    return titulos[this.tipoVista];
  }

  // Este método ya no es necesario para Mi Día
  // Las tareas de Mi Día mantienen su estado original

  abrirPanelDetalles(idTarea: number | null = null) {
    this.tareaSeleccionada = idTarea;
    this.panelAbierto = true;
  }

  cerrarPanelDetalles() {
    this.panelAbierto = false;
    this.tareaSeleccionada = null;
  }

  async onTareaGuardada() {
    await this.cargarTareas();
    this.cerrarPanelDetalles();
  }

  async onEstadoCambiado() {
    await this.cargarTareas();
  }

  async onDrop(event: CdkDragDrop<Tarea[]>) {
    // Solo reordenar en la misma lista (no cambiar estados en Mi Día)
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    }
    // No permitir drag & drop entre contenedores en Mi Día
  }

  async onTareaEliminada() {
    await this.cargarTareas();
  }
}
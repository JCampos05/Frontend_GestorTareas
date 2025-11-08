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
  
  //tareasToday: Tarea[] = [];
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
      const todasLasTareas = await this.tareasService.obtenerTareas();
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      tareas = todasLasTareas.filter(tarea => {
        if (!tarea.fechaVencimiento || tarea.estado === 'C') return false;
        
        const fechaVencimiento = new Date(tarea.fechaVencimiento);
        fechaVencimiento.setHours(0, 0, 0, 0);
        
        return fechaVencimiento.getTime() === hoy.getTime();
      });
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
    
    this.distribuirTareas(tareas);
  } catch (error) {
    console.error('Error al cargar tareas:', error);
  }
}

  distribuirTareas(tareas: Tarea[]) {
    //this.tareasToday = [];
    this.tareasColumna = [];

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    tareas.forEach(tarea => {
      // TODAY: Solo tareas del día que NO estén completadas
      if (tarea.fechaVencimiento) {
        const fechaVencimiento = new Date(tarea.fechaVencimiento);
        fechaVencimiento.setHours(0, 0, 0, 0);
        /*if (fechaVencimiento.getTime() === hoy.getTime() && tarea.estado !== 'C') {
          this.tareasToday.push(tarea);
        }*/
      }
      
      // Todas las tareas van a la columna principal
      this.tareasColumna.push(tarea);
    });
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

get estadoColumna(): 'P' | 'N' | 'C' {
  const estados = {
    'mi-dia': 'P',
    'pendientes': 'P',
    'progreso': 'N',
    'completadas': 'C',
    'vencidas': 'P'
  };
  return estados[this.tipoVista] as 'P' | 'N' | 'C';
}

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

  async onDrop(event: CdkDragDrop<Tarea[]>, nuevoEstado: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    
      const tarea = event.container.data[event.currentIndex];
      if (tarea.idTarea) {
        try {
          await this.tareasService.cambiarEstado(tarea.idTarea, nuevoEstado as any);
          tarea.estado = nuevoEstado as any;
        } catch (error) {
          console.error('Error al actualizar estado:', error);
          transferArrayItem(
            event.container.data,
            event.previousContainer.data,
            event.currentIndex,
            event.previousIndex
          );
        }
      }
    }
  }

  async onTareaEliminada() {
    await this.cargarTareas();
  }
}
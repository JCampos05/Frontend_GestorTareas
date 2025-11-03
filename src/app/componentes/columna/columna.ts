import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TareasService, Tarea } from '../../core/services/tareas/tareas';
import { ListasService } from '../../core/services/listas/listas';
import { TareaCardComponent } from '../tarea-card/tarea-card';
import { PanelDetallesComponent } from '../panel-detalles/panel-detalles';
import { DragDropModule } from '@angular/cdk/drag-drop';
imports: [CommonModule, TareaCardComponent, PanelDetallesComponent, DragDropModule]

@Component({
  selector: 'app-columnas',
  standalone: true,
  imports: [CommonModule, TareaCardComponent, PanelDetallesComponent],
  templateUrl: './columna.html',
  styleUrl: './columna.css'
})
export class ColumnasComponent implements OnInit {
  tareasToday: Tarea[] = [];
  tareasPendientes: Tarea[] = [];
  tareasEnProceso: Tarea[] = [];
  tareasTerminadas: Tarea[] = [];
  
  panelAbierto = false;
  tareaSeleccionada: number | null = null;

  constructor(
    private tareasService: TareasService,
    private listasService: ListasService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.cargarTareasDeLista(params['id']);
      } else {
        this.cargarTareas();
      }
    });

    this.route.queryParams.subscribe(queryParams => {
      if (queryParams['estado']) {
        this.filtrarPorEstado(queryParams['estado']);
      } else if (queryParams['filtro'] === 'vencidas') {
        this.cargarTareasVencidas();
      } else if (!this.route.snapshot.params['id']) {
        this.cargarTareas();
      }
    });
  }

  async cargarTareas() {
    try {
      const tareas = await this.tareasService.obtenerTareas();
      this.distribuirTareas(tareas);
    } catch (error) {
      console.error('Error al cargar tareas:', error);
    }
  }

  async cargarTareasDeLista(idLista: number) {
    try {
      const data = await this.listasService.obtenerListaConTareas(idLista);
      if (data && data.tareas) {
        this.distribuirTareas(data.tareas);
      }
    } catch (error) {
      console.error('Error al cargar tareas de lista:', error);
    }
  }

  async filtrarPorEstado(estado: string) {
    try {
      const tareas = await this.tareasService.obtenerTareasPorEstado(estado);
      this.distribuirTareas(tareas);
    } catch (error) {
      console.error('Error al filtrar tareas:', error);
    }
  }

  async cargarTareasVencidas() {
    try {
      const tareas = await this.tareasService.obtenerTareasVencidas();
      this.distribuirTareas(tareas);
    } catch (error) {
      console.error('Error al cargar tareas vencidas:', error);
    }
  }

  distribuirTareas(tareas: Tarea[]) {
    this.tareasToday = [];
    this.tareasPendientes = [];
    this.tareasEnProceso = [];
    this.tareasTerminadas = [];

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    tareas.forEach(tarea => {
      // Tareas de hoy
      if (tarea.fechaVencimiento) {
        const fechaVencimiento = new Date(tarea.fechaVencimiento);
        fechaVencimiento.setHours(0, 0, 0, 0);
        if (fechaVencimiento.getTime() === hoy.getTime() && tarea.estado !== 'C') {
          this.tareasToday.push(tarea);
        }
      }

      // Distribución por estado
      if (tarea.estado === 'P') {
        this.tareasPendientes.push(tarea);
      } else if (tarea.estado === 'N') {
        this.tareasEnProceso.push(tarea);
      } else if (tarea.estado === 'C') {
        this.tareasTerminadas.push(tarea);
      }
    });
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
}
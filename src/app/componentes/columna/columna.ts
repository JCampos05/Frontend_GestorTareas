import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TareasService, Tarea } from '../../core/services/tareas/tareas';
import { ListasService } from '../../core/services/listas/listas';
import { TareaCardComponent } from '../tarea-card/tarea-card';
import { PanelDetallesComponent } from '../panel-detalles/panel-detalles';
import { CdkDrag, CdkDropList,CdkDragDrop,moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
//import { CdkDragDrop,moveItemInArray,transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';
//imports: [CommonModule, TareaCardComponent, PanelDetallesComponent, DragDropModule]

@Component({
  selector: 'app-columnas',
  standalone: true,
  imports: [CommonModule, TareaCardComponent, PanelDetallesComponent, CdkDrag, CdkDropList],
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

  //const hoy = new Date();
  //hoy.setHours(0, 0, 0, 0);
  
  const filtro = this.route.snapshot.queryParams['filtro'];

  tareas.forEach(tarea => {
    // Si estamos en vista de vencidas, solo distribuir por estado
    // NO agregar a tareasToday ni tareasPendientes generales
    if (filtro === 'vencidas') {
      // En vista vencidas, solo distribuir por estado actual
      if (tarea.estado === 'P') {
        this.tareasPendientes.push(tarea);
      } else if (tarea.estado === 'N') {
        this.tareasEnProceso.push(tarea);
      } else if (tarea.estado === 'C') {
        this.tareasTerminadas.push(tarea);
      }
      return; // No seguir con la lógica de "today"
    }


    // Tareas de hoy (solo si NO estamos en vista vencidas)
    if (tarea.miDia && tarea.estado) {
      this.tareasToday.push(tarea);
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
    const estado = this.route.snapshot.queryParams['estado'];
    const filtro = this.route.snapshot.queryParams['filtro'];
    const idLista = this.route.snapshot.params['id'];

    if (idLista) {
      await this.cargarTareasDeLista(idLista);
    } else if (estado) {
      await this.filtrarPorEstado(estado);
    } else if (filtro === 'vencidas') {
      await this.cargarTareasVencidas();
    } else {
      await this.cargarTareas();
    }
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
    
      // Actualizar el estado de la tarea
      const tarea = event.container.data[event.currentIndex];
      if (tarea.idTarea) {
        try {
          await this.tareasService.cambiarEstado(tarea.idTarea, nuevoEstado as any);
          tarea.estado = nuevoEstado as any;
        } catch (error) {
          console.error('Error al actualizar estado:', error);
          // Revertir el cambio si falla
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
  const estado = this.route.snapshot.queryParams['estado'];
  const filtro = this.route.snapshot.queryParams['filtro'];
  const idLista = this.route.snapshot.params['id'];

  if (idLista) {
    await this.cargarTareasDeLista(idLista);
  } else if (estado) {
    await this.filtrarPorEstado(estado);
  } else if (filtro === 'vencidas') {
    await this.cargarTareasVencidas();
  } else {
    await this.cargarTareas();
  }
}
}
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TareasService, Tarea } from '../../core/services/tareas/tareas';
import { ListasService } from '../../core/services/listas/listas';
import { TareaCardComponent } from '../tarea-card/tarea-card';
import { PanelDetallesComponent } from '../panel-detalles/panel-detalles';
import { CdkDrag, CdkDropList, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-columnas',
  standalone: true,
  imports: [CommonModule, TareaCardComponent, PanelDetallesComponent, CdkDrag, CdkDropList],
  templateUrl: './columna.html',
  styleUrl: './columna.css'
})
export class ColumnasComponent implements OnInit {
  @Input() puedeEditar: boolean = true;
  @Input() puedeEliminar: boolean = true;
  @Input() puedeAsignar: boolean = false; // ✅ NUEVO

  @Output() abrirModalAsignar = new EventEmitter<Tarea>(); // ✅ NUEVO

  tareasToday: Tarea[] = [];
  tareasPendientes: Tarea[] = [];
  tareasEnProceso: Tarea[] = [];
  tareasTerminadas: Tarea[] = [];
  idListaActual: number | null = null;
  esMiDia: boolean = false;
  panelAbierto = false;
  tareaSeleccionada: number | null = null;

  constructor(
    private tareasService: TareasService,
    private listasService: ListasService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.idListaActual = +params['id'];
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

    this.route.url.subscribe(segments => {
      this.esMiDia = segments.some(segment => segment.path === 'mi-dia');
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

    const filtro = this.route.snapshot.queryParams['filtro'];

    tareas.forEach(tarea => {
      if (filtro === 'vencidas') {
        if (tarea.estado === 'P') {
          this.tareasPendientes.push(tarea);
        } else if (tarea.estado === 'N') {
          this.tareasEnProceso.push(tarea);
        } else if (tarea.estado === 'C') {
          this.tareasTerminadas.push(tarea);
        }
        return;
      }

      if (tarea.miDia && tarea.estado) {
        this.tareasToday.push(tarea);
      }

      if (tarea.estado === 'P') {
        this.tareasPendientes.push(tarea);
      } else if (tarea.estado === 'N') {
        this.tareasEnProceso.push(tarea);
      } else if (tarea.estado === 'C') {
        this.tareasTerminadas.push(tarea);
      }
    });
  }

  abrirPanelDetalles(idTarea: number | null = null, desdeToday: boolean = false) {
    this.tareaSeleccionada = idTarea;
    if (desdeToday && !idTarea) {
      this.esMiDia = true;
    }
    this.panelAbierto = true;
  }

  cerrarPanelDetalles() {
    this.panelAbierto = false;
    this.tareaSeleccionada = null;
    this.route.url.subscribe(segments => {
      this.esMiDia = segments.some(segment => segment.path === 'mi-dia');
    });
  }

  // ✅ NUEVO: Método para manejar el evento de asignación
  onAsignarClick(tarea: Tarea) {
    console.log('🎯 Click en asignar tarea:', tarea);
    this.abrirModalAsignar.emit(tarea);
  }
  
  async onTareaGuardada() {
    const idLista = this.route.snapshot.params['id'];
    const estado = this.route.snapshot.queryParams['estado'];
    const filtro = this.route.snapshot.queryParams['filtro'];

    if (idLista) {
      await this.cargarTareasDeLista(idLista);
    } else if (estado) {
      await this.filtrarPorEstado(estado);
    } else if (filtro === 'vencidas') {
      await this.cargarTareasVencidas();
    } else {
      await this.cargarTareas();
    }

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
    if (!this.puedeEditar) {
      console.warn('⚠️ No tienes permisos para mover tareas');
      alert('No tienes permisos para modificar tareas en esta lista');
      return;
    }

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

      if (!tarea.idTarea) {
        console.error('❌ Tarea sin ID, no se puede actualizar');
        transferArrayItem(
          event.container.data,
          event.previousContainer.data,
          event.currentIndex,
          event.previousIndex
        );
        alert('Error: La tarea no tiene un ID válido');
        return;
      }

      try {
        this.tareasService.cambiarEstado(tarea.idTarea, nuevoEstado as any).subscribe({
          next: () => {
            tarea.estado = nuevoEstado as any;
          },
          error: (error) => {
            console.error('❌ Error al actualizar estado:', error);

            transferArrayItem(
              event.container.data,
              event.previousContainer.data,
              event.currentIndex,
              event.previousIndex
            );

            if (error.status === 403) {
              alert('No tienes permisos para modificar tareas en esta lista');
            } else if (error.status === 404) {
              console.warn('⚠️ Tarea no encontrada en el servidor, removiéndola del listado');
              alert('Esta tarea ya no existe. Se actualizará la lista.');
              this.onTareaEliminada();
            } else {
              alert('Error al actualizar la tarea. Intenta de nuevo.');
            }
          }
        });
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
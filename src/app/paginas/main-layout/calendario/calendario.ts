import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TareasService, Tarea } from '../../../core/services/tareas/tareas';
import { ListasService, Lista } from '../../../core/services/listas/listas';
import { Router } from '@angular/router';
import { PanelDetallesComponent } from '../../../componentes/panel-detalles/panel-detalles';

interface DiaCalendario {
  fecha: Date;
  numero: number;
  esDelMes: boolean;
  tareas: Tarea[];
}

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule, PanelDetallesComponent],
  templateUrl: './calendario.html',
  styleUrl: './calendario.css'
})
export class CalendarioComponent implements OnInit {
  fechaActual: Date = new Date();
  diasCalendario: DiaCalendario[] = [];
  tareas: Tarea[] = [];
  listas: Lista[] = [];
  diaSeleccionado: DiaCalendario | null = null;
  panelCrearAbierto = false;

  diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  constructor(
    private tareasService: TareasService,
    private listasService: ListasService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.cargarListas();
    await this.cargarTareas();
    this.generarCalendario();
  }

  async cargarListas() {
    try {
      this.listas = await this.listasService.obtenerListas();
    } catch (error) {
      console.error('Error al cargar listas:', error);
    }
  }

  async cargarTareas() {
    try {
      this.tareas = await this.tareasService.obtenerTareas();
      
      // Agregar el icono de la lista a cada tarea
      this.tareas = this.tareas.map(tarea => {
        if (tarea.idLista) {
          const lista = this.listas.find(l => l.idLista === tarea.idLista);
          if (lista) {
            tarea.iconoLista = lista.icono;
            tarea.colorLista = lista.color;
          }
        }
        return tarea;
      });
      
      this.generarCalendario();
    } catch (error) {
      console.error('Error al cargar tareas:', error);
    }
  }

  generarCalendario() {
    const year = this.fechaActual.getFullYear();
    const month = this.fechaActual.getMonth();
    
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    
    const diasAnteriores = primerDia.getDay();
    const diasMes = ultimoDia.getDate();
    
    this.diasCalendario = [];
    
    // Días del mes anterior
    const ultimoDiaMesAnterior = new Date(year, month, 0).getDate();
    for (let i = diasAnteriores - 1; i >= 0; i--) {
      const fecha = new Date(year, month - 1, ultimoDiaMesAnterior - i);
      this.diasCalendario.push({
        fecha,
        numero: ultimoDiaMesAnterior - i,
        esDelMes: false,
        tareas: this.obtenerTareasPorFecha(fecha)
      });
    }
    
    // Días del mes actual
    for (let i = 1; i <= diasMes; i++) {
      const fecha = new Date(year, month, i);
      this.diasCalendario.push({
        fecha,
        numero: i,
        esDelMes: true,
        tareas: this.obtenerTareasPorFecha(fecha)
      });
    }
    
    // Días del mes siguiente
    const diasRestantes = 42 - this.diasCalendario.length;
    for (let i = 1; i <= diasRestantes; i++) {
      const fecha = new Date(year, month + 1, i);
      this.diasCalendario.push({
        fecha,
        numero: i,
        esDelMes: false,
        tareas: this.obtenerTareasPorFecha(fecha)
      });
    }
  }

  obtenerTareasPorFecha(fecha: Date): Tarea[] {
    return this.tareas.filter(tarea => {
      const fechaTarea = tarea.fechaVencimiento 
        ? new Date(tarea.fechaVencimiento)
        : tarea.fechaCreacion 
          ? new Date(tarea.fechaCreacion)
          : null;
      
      if (!fechaTarea) return false;
      
      return fechaTarea.getDate() === fecha.getDate() &&
             fechaTarea.getMonth() === fecha.getMonth() &&
             fechaTarea.getFullYear() === fecha.getFullYear();
    });
  }

  mesAnterior() {
    this.fechaActual = new Date(
      this.fechaActual.getFullYear(),
      this.fechaActual.getMonth() - 1
    );
    this.generarCalendario();
    this.diaSeleccionado = null;
    this.cerrarPanelCrear();
  }

  mesSiguiente() {
    this.fechaActual = new Date(
      this.fechaActual.getFullYear(),
      this.fechaActual.getMonth() + 1
    );
    this.generarCalendario();
    this.diaSeleccionado = null;
    this.cerrarPanelCrear();
  }

  seleccionarDia(dia: DiaCalendario) {
    this.diaSeleccionado = dia;
  }

  cerrarPanel() {
    this.diaSeleccionado = null;
  }

  crearTarea() {
    this.panelCrearAbierto = true;
  }

  cerrarPanelCrear() {
    this.panelCrearAbierto = false;
  }
  
  async onTareaCreada() {
    this.panelCrearAbierto = false;
    await this.cargarTareas();
  }

  async cambiarEstadoTarea(tarea: Tarea) {
    if (!tarea.idTarea) return;
    
    try {
      const nuevoEstado = tarea.estado === 'C' ? 'P' : 'C';
      await this.tareasService.cambiarEstado(tarea.idTarea, nuevoEstado);
      await this.cargarTareas();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  }

  get mesAnio(): string {
    return `${this.meses[this.fechaActual.getMonth()]} ${this.fechaActual.getFullYear()}`;
  }

  esHoy(fecha: Date): boolean {
    const hoy = new Date();
    return fecha.getDate() === hoy.getDate() &&
           fecha.getMonth() === hoy.getMonth() &&
           fecha.getFullYear() === hoy.getFullYear();
  }

  getPrioridadClass(prioridad: string): string {
    const clases: any = {
      'A': 'prioridad-alta',
      'N': 'prioridad-normal',
      'B': 'prioridad-baja'
    };
    return clases[prioridad] || 'prioridad-normal';
  }

  esEmoji(icono: string | null | undefined): boolean {
    if (!icono || icono === 'null' || icono === '') return false;
    return !icono.trim().startsWith('fa');
  }

  obtenerClaseIcono(icono: string | null | undefined): string {
    // Si no hay icono o es null, devolver icono por defecto
    if (!icono || icono === 'null' || icono === '') {
      return 'fas fa-list';
    }

    const iconoLimpio = icono.trim();

    // Si ya tiene el prefijo fas o far, devolverlo tal cual
    if (iconoLimpio.startsWith('fas ') || iconoLimpio.startsWith('far ')) {
      return iconoLimpio;
    }

    // Si solo tiene fa-, agregar fas al inicio
    if (iconoLimpio.startsWith('fa-')) {
      return `fas ${iconoLimpio}`;
    }

    // Si no cumple ningún formato, devolver por defecto
    return 'fas fa-list';
  }
}
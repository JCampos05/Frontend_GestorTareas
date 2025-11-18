import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, moveItemInArray, transferArrayItem, CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { TareasService, Tarea } from '../../../core/services/tareas/tareas';
import { ListasService, Lista } from '../../../core/services/listas/listas';
import { Router } from '@angular/router';
import { PanelDetallesComponent } from '../../../componentes/principal/panel-detalles/panel-detalles';

interface DiaSemana {
  fecha: Date;
  nombre: string;
  numero: number;
  tareas: Tarea[];
}

@Component({
  selector: 'app-mi-semana',
  standalone: true,
  imports: [CommonModule, PanelDetallesComponent, CdkDrag, CdkDropList],
  templateUrl: './mi-semana.html',
  styleUrl: './mi-semana.css'
})
export class MiSemanaComponent implements OnInit {
  fechaActual: Date = new Date();
  diasSemana: DiaSemana[] = [];
  tareas: Tarea[] = [];
  listas: Lista[] = [];
  diaSeleccionado: DiaSemana | null = null;
  panelCrearAbierto = false;
  calendarioAbierto = false;
  mesCalendario: Date = new Date();
  diasCalendario: { fecha: Date; numero: number; mesActual: boolean }[] = [];

  nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  constructor(
    private tareasService: TareasService,
    private listasService: ListasService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    await this.cargarListas();
    await this.cargarTareas();
    this.generarSemana();
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

      this.tareas = this.tareas.map(tarea => {
        if (tarea.idLista) {
          const lista = this.listas.find(l => l.idLista === tarea.idLista);
          if (lista) {
            tarea.iconoLista = lista.icono;
            tarea.colorLista = lista.color;
            tarea.nombreLista = lista.nombre;
          }
        }
        return tarea;
      });

      this.generarSemana();
    } catch (error) {
      console.error('Error al cargar tareas:', error);
    }
  }

  generarSemana() {
    this.diasSemana = [];
    const inicioSemana = this.obtenerInicioSemana(this.fechaActual);

    for (let i = 0; i < 7; i++) {
      const fecha = new Date(inicioSemana);
      fecha.setDate(inicioSemana.getDate() + i);

      this.diasSemana.push({
        fecha: fecha,
        nombre: this.nombresDias[fecha.getDay()],
        numero: fecha.getDate(),
        tareas: this.obtenerTareasPorFecha(fecha)
      });
    }
  }

  obtenerInicioSemana(fecha: Date): Date {
    const dia = fecha.getDay();
    const diferencia = fecha.getDate() - dia;
    return new Date(fecha.getFullYear(), fecha.getMonth(), diferencia);
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

  semanaAnterior() {
    this.fechaActual = new Date(
      this.fechaActual.getFullYear(),
      this.fechaActual.getMonth(),
      this.fechaActual.getDate() - 7
    );
    this.generarSemana();
    this.diaSeleccionado = null;
    this.cerrarPanelCrear();
  }

  semanaSiguiente() {
    this.fechaActual = new Date(
      this.fechaActual.getFullYear(),
      this.fechaActual.getMonth(),
      this.fechaActual.getDate() + 7
    );
    this.generarSemana();
    this.diaSeleccionado = null;
    this.cerrarPanelCrear();
  }

  seleccionarDia(dia: DiaSemana) {
    this.diaSeleccionado = {
      ...dia,
      tareas: [...dia.tareas]
    };
    this.scrollToDia(dia);
  }

  // MÉTODO SCROLL CORREGIDO
  scrollToDia(dia: DiaSemana) {
    setTimeout(() => {
      const index = this.diasSemana.findIndex(d => d.fecha.getTime() === dia.fecha.getTime());
      const grilla = document.querySelector('.grilla-semana') as HTMLElement;
      
      if (grilla && index >= 0) {
        const columnas = grilla.querySelectorAll('.columna-dia');
        if (columnas[index]) {
          const columna = columnas[index] as HTMLElement;
          
          // Obtener medidas reales del DOM
          const columnaRect = columna.getBoundingClientRect();
          const grillaRect = grilla.getBoundingClientRect();
          
          // Calcular el centro exacto de la grilla visible
          const centroGrilla = grillaRect.width / 2;
          
          // Posición de la columna relativa al contenedor
          const columnaLeft = columna.offsetLeft;
          
          // Centro de la columna
          const columnaCentro = columnaRect.width / 2;
          
          // Fórmula para centrar: posición de columna + su centro - centro de grilla
          const scrollPosition = columnaLeft + columnaCentro - centroGrilla;
          
          grilla.scrollTo({
            left: Math.max(0, scrollPosition),
            behavior: 'smooth'
          });
        }
      }
    }, 200);
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

  //  MÉTODO CAMBIAR ESTADO CORREGIDO
  async cambiarEstadoTarea(tarea: Tarea, event: Event) {
    // Detener toda propagación inmediatamente
    event.stopPropagation();
    event.preventDefault();
    
    if (!tarea.idTarea) return;

    // Obtener el checkbox directamente
    const checkbox = event.target as HTMLInputElement;
    const nuevoEstado = checkbox.checked ? 'C' : 'P';

    try {
      // Actualizar en servidor
      await this.tareasService.cambiarEstado(tarea.idTarea, nuevoEstado);
      
      // Actualizar estado local
      tarea.estado = nuevoEstado;
      
      // Recargar todas las tareas
      await this.cargarTareas();
      
      // Actualizar panel lateral si está abierto
      if (this.diaSeleccionado) {
        const diaActualizado = this.diasSemana.find(
          d => d.fecha.getTime() === this.diaSeleccionado!.fecha.getTime()
        );
        if (diaActualizado) {
          this.diaSeleccionado = {
            ...diaActualizado,
            tareas: [...diaActualizado.tareas]
          };
        }
      }
      
      // Forzar detección de cambios
      this.cdr.detectChanges();

    } catch (error) {
      console.error('Error al cambiar estado:', error);
      // Revertir el checkbox en caso de error
      checkbox.checked = !checkbox.checked;
      await this.cargarTareas();
    }
  }

  get rangoSemana(): string {
    if (this.diasSemana.length === 0) return '';

    const primerDia = this.diasSemana[0].fecha;
    const ultimoDia = this.diasSemana[6].fecha;

    const diaInicio = primerDia.getDate();
    const diaFin = ultimoDia.getDate();
    const mesInicio = this.meses[primerDia.getMonth()];
    const mesFin = this.meses[ultimoDia.getMonth()];
    const anio = ultimoDia.getFullYear();

    if (primerDia.getMonth() === ultimoDia.getMonth()) {
      return `${diaInicio} - ${diaFin} ${mesInicio} ${anio}`;
    } else {
      return `${diaInicio} ${mesInicio} - ${diaFin} ${mesFin} ${anio}`;
    }
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
    if (!icono || icono === 'null' || icono === '') {
      return 'fas fa-list';
    }

    const iconoLimpio = icono.trim();

    if (iconoLimpio.startsWith('fas ') || iconoLimpio.startsWith('far ')) {
      return iconoLimpio;
    }

    if (iconoLimpio.startsWith('fa-')) {
      return `fas ${iconoLimpio}`;
    }

    return 'fas fa-list';
  }

  async onDrop(event: CdkDragDrop<Tarea[]>, diaDestino: DiaSemana) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const tarea = event.previousContainer.data[event.previousIndex];

      if (tarea.idTarea) {
        try {
          const nuevaFecha = new Date(diaDestino.fecha);
          if (tarea.fechaVencimiento) {
            const fechaOriginal = new Date(tarea.fechaVencimiento);
            nuevaFecha.setHours(fechaOriginal.getHours(), fechaOriginal.getMinutes(), fechaOriginal.getSeconds());
          } else {
            nuevaFecha.setHours(0, 0, 0, 0);
          }

          const fechaFormateada = nuevaFecha.toISOString().slice(0, 19).replace('T', ' ');

          await this.tareasService.actualizarTarea(tarea.idTarea, {
            nombre: tarea.nombre,
            fechaVencimiento: fechaFormateada
          } as Tarea);

          transferArrayItem(
            event.previousContainer.data,
            event.container.data,
            event.previousIndex,
            event.currentIndex
          );

          await this.cargarTareas();

        } catch (error) {
          console.error('Error al mover tarea:', error);
          await this.cargarTareas();
        }
      }
    }
  }

  getDropListIds(): string[] {
    return this.diasSemana.map((_, index) => `dia-${index}`);
  }

  toggleCalendario() {
    this.calendarioAbierto = !this.calendarioAbierto;
    if (this.calendarioAbierto) {
      this.mesCalendario = new Date(this.fechaActual);
      this.generarDiasCalendario();
    }
  }

  generarDiasCalendario() {
    this.diasCalendario = [];
    const primerDiaMes = new Date(this.mesCalendario.getFullYear(), this.mesCalendario.getMonth(), 1);
    const ultimoDiaMes = new Date(this.mesCalendario.getFullYear(), this.mesCalendario.getMonth() + 1, 0);

    const primerDiaSemana = primerDiaMes.getDay();
    for (let i = 0; i < primerDiaSemana; i++) {
      const fecha = new Date(primerDiaMes);
      fecha.setDate(primerDiaMes.getDate() - (primerDiaSemana - i));
      this.diasCalendario.push({
        fecha: fecha,
        numero: fecha.getDate(),
        mesActual: false
      });
    }

    for (let dia = 1; dia <= ultimoDiaMes.getDate(); dia++) {
      const fecha = new Date(this.mesCalendario.getFullYear(), this.mesCalendario.getMonth(), dia);
      this.diasCalendario.push({
        fecha: fecha,
        numero: dia,
        mesActual: true
      });
    }

    const diasRestantes = 42 - this.diasCalendario.length;
    for (let i = 1; i <= diasRestantes; i++) {
      const fecha = new Date(ultimoDiaMes);
      fecha.setDate(fecha.getDate() + i);
      this.diasCalendario.push({
        fecha: fecha,
        numero: fecha.getDate(),
        mesActual: false
      });
    }
  }

  mesAnteriorCalendario() {
    this.mesCalendario = new Date(
      this.mesCalendario.getFullYear(),
      this.mesCalendario.getMonth() - 1,
      1
    );
    this.generarDiasCalendario();
  }

  mesSiguienteCalendario() {
    this.mesCalendario = new Date(
      this.mesCalendario.getFullYear(),
      this.mesCalendario.getMonth() + 1,
      1
    );
    this.generarDiasCalendario();
  }

  seleccionarFechaCalendario(fecha: Date) {
    this.fechaActual = new Date(fecha);
    this.generarSemana();
    this.calendarioAbierto = false;
    this.diaSeleccionado = null;
    this.cerrarPanelCrear();
  }

  get nombreMesCalendario(): string {
    return `${this.meses[this.mesCalendario.getMonth()]} ${this.mesCalendario.getFullYear()}`;
  }

  esFechaSeleccionada(fecha: Date): boolean {
    return fecha.getDate() === this.fechaActual.getDate() &&
      fecha.getMonth() === this.fechaActual.getMonth() &&
      fecha.getFullYear() === this.fechaActual.getFullYear();
  }

  abrirDetallesTarea(tarea: Tarea) {
    console.log('Abrir detalles de tarea:', tarea);
  }
}
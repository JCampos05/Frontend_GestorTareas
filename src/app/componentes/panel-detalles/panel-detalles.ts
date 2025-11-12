import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TareasService, Tarea } from '../../core/services/tareas/tareas';
import { Lista, ListasService } from '../../core/services/listas/listas';
import { DropdownListaComponent } from '../dropdown-lista/dropdown-lista';
import { NotificacionesService } from '../../core/services/notification/notification';

@Component({
  selector: 'app-panel-detalles',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownListaComponent],
  templateUrl: './panel-detalles.html',
  styleUrl: './panel-detalles.css',
  host: {
    '[class.abierto]': 'abierto'
  }
})
export class PanelDetallesComponent implements OnInit, OnChanges {
  @Input() abierto = false;
  @Input() idTarea: number | null = null;
  @Input() idListaPredeterminada: number | null = null;
  @Input() miDiaPredeterminado: boolean = false;
  @Output() cerrar = new EventEmitter<void>();
  @Output() tareaGuardada = new EventEmitter<void>();

  // Formulario
  nombre = '';
  descripcion = '';
  prioridad: 'A' | 'N' | 'B' = 'N';
  notas = '';
  idLista: number | null = null;

  // Pasos
  pasos: string[] = [];

  // Mi día
  miDia = false;

  // Recordatorio
  recordatorio = '0';
  fechaRecordatorio = '';
  horaRecordatorio = '';

  // Fecha vencimiento
  selectFechaVencimiento = '0';
  fechaVencimiento = '';

  // Repetición
  repetir = false;
  tipoRepeticion = 'diario';
  repetirCada = 1;
  repetirUnidad = 'dias';

  // Listas disponibles
  listas: Lista[] = [];

  // Modo edición
  modoEdicion = false;
  estadoOriginal: 'P' | 'N' | 'C' = 'P';

  constructor(
    private tareasService: TareasService,
    private listasService: ListasService,
    private notificacionesService: NotificacionesService
  ) { }

  ngOnInit() {
    this.cargarListas();
  }

  

ngOnChanges(changes: SimpleChanges) {
    /*console.log('🔍 Panel Detalles - ngOnChanges:', {
      abierto: this.abierto,
      miDiaPredeterminado: this.miDiaPredeterminado,
      changes: changes
    });*/
    
    if (changes['abierto'] && this.abierto) {
      // Recargar listas cada vez que se abre el panel
      this.cargarListas();

      if (this.idTarea) {
        this.cargarTarea(this.idTarea);
      } else {
        this.limpiarFormulario();
        // Siempre aplicar miDiaPredeterminado después de limpiar
        this.miDia = this.miDiaPredeterminado;
        //console.log('✅ miDia establecido a:', this.miDia);
      }
    } else if (changes['idTarea'] && this.idTarea && !changes['abierto']) {
      this.cargarTarea(this.idTarea);
    }
  }

  async cargarListas() {
    try {
      this.listas = await this.listasService.obtenerListas();
      // DEBUG: Ver qué iconos tienen las listas
      /*console.log('📋 Listas cargadas:', this.listas.map(l => ({
        nombre: l.nombre,
        icono: l.icono,
        esEmoji: this.esEmoji(l.icono)
      })));*/
    } catch (error) {
      console.error('Error al cargar listas:', error);
    }
  }

  obtenerTextoLista(lista: Lista): string {
    const icono = this.esEmoji(lista.icono) ? lista.icono : this.obtenerIconoTexto(lista.icono);
    return `${icono} ${lista.nombre}`;
  }

  esEmoji(icono: string | null | undefined): boolean {
    if (!icono || icono === 'null' || icono === '') return false;
    return !icono.trim().startsWith('fa');
  }

  obtenerIconoTexto(icono: string | null | undefined): string {
    // Para el select, mostramos un símbolo genérico si es un icono FA
    if (!icono || icono === 'null' || icono === '') return '📋';
    if (icono.trim().startsWith('fa')) return '📋';
    return icono;
  }

  async cargarTarea(id: number) {
    try {
      const tarea = await this.tareasService.obtenerTarea(id);
      if (tarea) {
        this.modoEdicion = true;
        this.estadoOriginal = tarea.estado;
        this.nombre = tarea.nombre;
        this.descripcion = tarea.descripcion || '';
        this.prioridad = tarea.prioridad;
        this.notas = tarea.notas || '';
        this.idLista = tarea.idLista || null;
        this.miDia = tarea.miDia || false;

        // Cargar pasos
        if (tarea.pasos) {
          this.pasos = Array.isArray(tarea.pasos) ? tarea.pasos : JSON.parse(tarea.pasos as any);
        }

        // Cargar recordatorio
        if (tarea.recordatorio) {
          const fechaHora = tarea.recordatorio.split('T');
          this.recordatorio = '4';
          this.fechaRecordatorio = fechaHora[0];
          this.horaRecordatorio = fechaHora[1]?.slice(0, 5) || '';
        }

        // Cargar fecha vencimiento
        if (tarea.fechaVencimiento) {
          this.selectFechaVencimiento = '4';
          this.fechaVencimiento = tarea.fechaVencimiento.split('T')[0];
        }

        // Cargar repetición
        this.repetir = tarea.repetir || false;
        this.tipoRepeticion = tarea.tipoRepeticion || 'diario';

        if (tarea.tipoRepeticion === 'personalizado' && tarea.configRepeticion) {
          const config = typeof tarea.configRepeticion === 'string'
            ? JSON.parse(tarea.configRepeticion)
            : tarea.configRepeticion;
          this.repetirCada = config.cada || 1;
          this.repetirUnidad = config.unidad || 'dias';
        }
      }
    } catch (error) {
      console.error('Error al cargar tarea:', error);
    }
  }

  limpiarFormulario() {
    this.modoEdicion = false;
    this.estadoOriginal = 'P';
    this.nombre = '';
    this.descripcion = '';
    this.prioridad = 'N';
    this.notas = '';
    this.idLista = this.idListaPredeterminada;
    this.pasos = [];
    this.miDia = this.miDiaPredeterminado;
    this.recordatorio = '0';
    this.fechaRecordatorio = '';
    this.horaRecordatorio = '';
    this.selectFechaVencimiento = '0';
    this.fechaVencimiento = '';
    this.repetir = false;
    this.tipoRepeticion = 'diario';
    this.repetirCada = 1;
    this.repetirUnidad = 'dias';
  }

  onCerrar() {
    this.limpiarFormulario();
    this.cerrar.emit();
  }

  agregarPaso() {
    this.pasos.push('');
  }

  eliminarPaso(index: number) {
    this.pasos.splice(index, 1);
  }

  onSelectFechaVencimientoChange() {
    if (this.selectFechaVencimiento !== '4') {
      this.calcularFechaVencimiento(this.selectFechaVencimiento);
    }
  }

  onRecordatorioChange() {
    if (this.recordatorio !== '4') {
      this.calcularRecordatorio(this.recordatorio);
    }
  }

  calcularFechaVencimiento(opcion: string) {
    const hoy = new Date();
    let fecha = new Date();

    switch (opcion) {
      case '1': // Hoy
        fecha = hoy;
        break;
      case '2': // Mañana
        fecha.setDate(hoy.getDate() + 1);
        break;
      case '3': // Semana próxima
        fecha.setDate(hoy.getDate() + 7);
        break;
      default:
        this.fechaVencimiento = '';
        return;
    }

    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');

    this.fechaVencimiento = `${year}-${month}-${day}`;
  }

  calcularRecordatorio(opcion: string) {
    const ahora = new Date();
    let fecha = new Date();

    switch (opcion) {
      case '1': // Más tarde (2 horas)
        fecha.setHours(ahora.getHours() + 2);
        break;
      case '2': // Mañana (9 AM)
        fecha.setDate(ahora.getDate() + 1);
        fecha.setHours(9, 0, 0, 0);
        break;
      case '3': // Semana próxima (lunes 9 AM)
        fecha.setDate(ahora.getDate() + (7 - ahora.getDay() + 1));
        fecha.setHours(9, 0, 0, 0);
        break;
      default:
        return;
    }

    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    const hours = String(fecha.getHours()).padStart(2, '0');
    const minutes = String(fecha.getMinutes()).padStart(2, '0');

    this.fechaRecordatorio = `${year}-${month}-${day}`;
    this.horaRecordatorio = `${hours}:${minutes}`;
  }

  async onSubmit() {
    if (!this.nombre.trim()) {
      this.notificacionesService.advertencia('El nombre es requerido');
      return;
    }

    // Preparar fecha de vencimiento
    let fechaVencimientoFinal = null;
    if (this.selectFechaVencimiento === '4' && this.fechaVencimiento) {
      fechaVencimientoFinal = this.fechaVencimiento;
    } else if (this.selectFechaVencimiento !== '0') {
      fechaVencimientoFinal = this.fechaVencimiento;
    }

    // Preparar recordatorio
    let recordatorioFinal = null;
    if (this.recordatorio === '4' && this.fechaRecordatorio && this.horaRecordatorio) {
      recordatorioFinal = `${this.fechaRecordatorio}T${this.horaRecordatorio}:00`;
    }

    // Preparar configuración de repetición
    let configRepeticion = null;
    if (this.repetir && this.tipoRepeticion === 'personalizado') {
      configRepeticion = JSON.stringify({
        cada: this.repetirCada,
        unidad: this.repetirUnidad
      });
    }

    const tarea: Tarea = {
      nombre: this.nombre.trim(),
      descripcion: this.descripcion.trim() || null,
      prioridad: this.prioridad,
      estado: this.modoEdicion ? this.estadoOriginal : 'P',
      fechaVencimiento: fechaVencimientoFinal || undefined,
      pasos: this.pasos.filter(p => p.trim()).length > 0 ? this.pasos.filter(p => p.trim()) : undefined,
      notas: this.notas.trim() || undefined,
      recordatorio: recordatorioFinal || undefined,
      repetir: this.repetir,
      tipoRepeticion: this.repetir ? this.tipoRepeticion : undefined,
      configRepeticion: configRepeticion || undefined,
      idLista: this.idLista || undefined,
      miDia: this.miDia
    };

    try {
      if (this.modoEdicion && this.idTarea) {
        await this.tareasService.actualizarTarea(this.idTarea, tarea);
        this.notificacionesService.exito('Tarea actualizada exitosamente');
      } else {
        await this.tareasService.crearTarea(tarea);
        this.notificacionesService.exito('Tarea creada exitosamente');
      }

      this.tareaGuardada.emit();
      this.limpiarFormulario();
    } catch (error) {
      console.error('Error al guardar tarea:', error);
      alert('Error al guardar la tarea');
    }
  }
  obtenerTextoListaSimple(lista: Lista): string {
    // Solo mostrar emoji si realmente es un emoji, de lo contrario solo el nombre
    if (this.esEmoji(lista.icono)) {
      return `${lista.icono} ${lista.nombre}`;
    }
    return lista.nombre;
  }
}
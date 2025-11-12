import { Component, EventEmitter, Output, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListasService } from '../../core/services/listas/listas';
import { CategoriasService } from '../../core/services/categorias/categorias';
import { NotificacionesService } from '../../core/services/notification/notification';
import { ModalCompartirComponent } from '../modal-compartir/modal-compartir';
import { CompartirService } from '../../core/services/compartir/compartir';

@Component({
  selector: 'app-modal-lista',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalCompartirComponent],
  templateUrl: './modal-lista.html',
  styleUrl: './modal-lista.css'
})
export class ModalListaComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() listaEditando: any = null;
  @Input() idCategoriaPredefinida: number | null = null;
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() listaGuardada = new EventEmitter<void>();

  nombreLista: string = '';
  colorLista: string = '#0052CC';
  iconoLista: string = 'fa-list';
  importanteLista: boolean = false;
  compartible: boolean = false;
  claveCompartir: string = '';
  idCategoriaSeleccionada: number | null = null;
  categorias: any[] = [];
  modalCompartirAbierto = false;
  listaParaCompartir: any = null;
  modalDescompartirAbierto = false;
  procesandoDescompartir = false;

  // Colores predefinidos
  coloresPredefinidos = [
    { hex: '#0052CC', nombre: 'Azul' },
    { hex: '#00875A', nombre: 'Verde' },
    { hex: '#FF5630', nombre: 'Rojo' },
    { hex: '#FF991F', nombre: 'Naranja' },
    { hex: '#6554C0', nombre: 'Púrpura' },
    { hex: '#00B8D9', nombre: 'Cyan' },
    { hex: '#36B37E', nombre: 'Verde claro' },
    { hex: '#403294', nombre: 'Morado' },
    { hex: '#FF8B00', nombre: 'Naranja oscuro' },
    { hex: '#172B4D', nombre: 'Azul oscuro' }
  ];

  // Iconos Font Awesome disponibles
  iconosDisponibles = [
    { icono: 'fa-list', categoria: 'Listas' },
    { icono: 'fa-check-circle', categoria: 'Listas' },
    { icono: 'fa-clipboard-list', categoria: 'Listas' },
    { icono: 'fa-tasks', categoria: 'Listas' },
    { icono: 'fa-calendar', categoria: 'Tiempo' },
    { icono: 'fa-calendar-alt', categoria: 'Tiempo' },
    { icono: 'fa-clock', categoria: 'Tiempo' },
    { icono: 'fa-hourglass-half', categoria: 'Tiempo' },
    { icono: 'fa-briefcase', categoria: 'Trabajo' },
    { icono: 'fa-laptop', categoria: 'Trabajo' },
    { icono: 'fa-folder', categoria: 'Trabajo' },
    { icono: 'fa-file-alt', categoria: 'Trabajo' },
    { icono: 'fa-home', categoria: 'Personal' },
    { icono: 'fa-user', categoria: 'Personal' },
    { icono: 'fa-heart', categoria: 'Personal' },
    { icono: 'fa-star', categoria: 'Personal' },
    { icono: 'fa-shopping-cart', categoria: 'Compras' },
    { icono: 'fa-shopping-bag', categoria: 'Compras' },
    { icono: 'fa-gift', categoria: 'Compras' },
    { icono: 'fa-tag', categoria: 'Compras' },
    { icono: 'fa-lightbulb', categoria: 'Ideas' },
    { icono: 'fa-brain', categoria: 'Ideas' },
    { icono: 'fa-rocket', categoria: 'Ideas' },
    { icono: 'fa-bullseye', categoria: 'Ideas' },
    { icono: 'fa-book', categoria: 'Educación' },
    { icono: 'fa-graduation-cap', categoria: 'Educación' },
    { icono: 'fa-pen', categoria: 'Educación' },
    { icono: 'fa-pencil-alt', categoria: 'Educación' },
    { icono: 'fa-dumbbell', categoria: 'Salud' },
    { icono: 'fa-heartbeat', categoria: 'Salud' },
    { icono: 'fa-running', categoria: 'Salud' },
    { icono: 'fa-medkit', categoria: 'Salud' },
    { icono: 'fa-utensils', categoria: 'Comida' },
    { icono: 'fa-coffee', categoria: 'Comida' },
    { icono: 'fa-pizza-slice', categoria: 'Comida' },
    { icono: 'fa-apple-alt', categoria: 'Comida' },
    { icono: 'fa-plane', categoria: 'Viajes' },
    { icono: 'fa-map-marked-alt', categoria: 'Viajes' },
    { icono: 'fa-suitcase', categoria: 'Viajes' },
    { icono: 'fa-camera', categoria: 'Viajes' },
    { icono: 'fa-code', categoria: 'Tech' },
    { icono: 'fa-desktop', categoria: 'Tech' },
    { icono: 'fa-mobile-alt', categoria: 'Tech' },
    { icono: 'fa-bug', categoria: 'Tech' },
    { icono: 'fa-paint-brush', categoria: 'Arte' },
    { icono: 'fa-palette', categoria: 'Arte' },
    { icono: 'fa-music', categoria: 'Arte' },
    { icono: 'fa-film', categoria: 'Arte' },
    { icono: 'fa-dollar-sign', categoria: 'Finanzas' },
    { icono: 'fa-chart-line', categoria: 'Finanzas' },
    { icono: 'fa-piggy-bank', categoria: 'Finanzas' },
    { icono: 'fa-wallet', categoria: 'Finanzas' }
  ];

  categoriaSeleccionada: string = 'Listas';

  constructor(
    private listasService: ListasService,
    private categoriasService: CategoriasService,
    private notificacionesService: NotificacionesService,
    private compartirService: CompartirService
  ) {}

  async ngOnInit() {
    await this.cargarCategorias();
    this.inicializarFormulario();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['visible'] && this.visible) {
      await this.cargarCategorias();
      this.inicializarFormulario();
    }
  }

  inicializarFormulario() {
    if (this.listaEditando) {
      this.nombreLista = this.listaEditando.nombre;
      this.colorLista = this.listaEditando.color || '#0052CC';
      this.iconoLista = this.listaEditando.icono || 'fa-list';
      this.importanteLista = this.listaEditando.importante || false;
      this.compartible = this.listaEditando.compartible || false;
      this.claveCompartir = this.listaEditando.claveCompartir || '';
      this.idCategoriaSeleccionada = this.listaEditando.idCategoria;
    } else {
      this.nombreLista = '';
      this.colorLista = '#0052CC';
      this.iconoLista = 'fa-list';
      this.importanteLista = false;
      this.compartible = false;
      this.claveCompartir = '';
      if (this.idCategoriaPredefinida) {
        this.idCategoriaSeleccionada = this.idCategoriaPredefinida;
      } else {
        this.idCategoriaSeleccionada = null;
      }
    }
  }

  async cargarCategorias() {
    try {
      this.categorias = await this.categoriasService.obtenerCategorias();
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  }

async guardar() {
  if (!this.nombreLista.trim()) return;

  const listaData: any = {
    nombre: this.nombreLista,
    color: this.colorLista,
    icono: this.iconoLista.startsWith('fas ') ? this.iconoLista : `fas ${this.iconoLista}`,
    importante: this.importanteLista,
    compartible: this.compartible,
    idCategoria: this.idCategoriaSeleccionada || undefined
  };

  try {
    if (this.listaEditando) {
      await this.listasService.actualizarLista(this.listaEditando.idLista, listaData);
      this.notificacionesService.exito('Lista actualizada exitosamente');
      
      // Si se activó compartible y antes no lo era, abrir modal para generar clave
      if (this.compartible && !this.listaEditando.compartible) {
        this.listaParaCompartir = {
          idLista: this.listaEditando.idLista,
          nombre: this.nombreLista
        };
        this.modalCompartirAbierto = true;
      } else {
        this.listaGuardada.emit();
        this.cerrar();
      }
    } else {
      const response = await this.listasService.crearLista(listaData);
      this.notificacionesService.exito('Lista creada exitosamente');
      
      // Si es compartible, abrir modal automáticamente con la lista recién creada
      if (this.compartible && response.data && response.data.idLista) {
        this.listaParaCompartir = {
          idLista: response.data.idLista,
          nombre: this.nombreLista
        };
        this.modalCompartirAbierto = true;
      } else {
        this.listaGuardada.emit();
        this.cerrar();
      }
    }
  } catch (error) {
    console.error('Error al guardar lista:', error);
    this.notificacionesService.error('Error al guardar la lista');
  }
}

  mostrarClaveCompartir(clave: string) {
    alert(`Clave para compartir: ${clave}\n\nGuarda esta clave para compartir la lista con otros usuarios.`);
  }

  copiarClave() {
    if (this.claveCompartir) {
      navigator.clipboard.writeText(this.claveCompartir);
      this.notificacionesService.exito('Clave copiada al portapapeles');
    }
  }

  cerrar() {
    this.nombreLista = '';
    this.colorLista = '#0052CC';
    this.iconoLista = 'fa-list';
    this.importanteLista = false;
    this.compartible = false;
    this.claveCompartir = '';
    this.idCategoriaSeleccionada = null;
    this.cerrarModal.emit();
  }

  // Abrir modal de compartir desde el botón
abrirModalCompartir() {
  if (this.listaEditando) {
    this.listaParaCompartir = this.listaEditando;
    this.modalCompartirAbierto = true;
  }
}

cerrarModalCompartir() {
  this.modalCompartirAbierto = false;
  this.listaParaCompartir = null;
  // Después de compartir, cerrar el modal principal
  this.listaGuardada.emit();
  this.cerrar();
}

alCompartir(clave: string) {
  // Aquí podrías usar el servicio de notificaciones si lo tienes
  console.log(`Lista compartida. Clave: ${clave}`);
}

abrirModalDescompartir() {
  this.modalDescompartirAbierto = true;
}

cerrarModalDescompartir() {
  this.modalDescompartirAbierto = false;
}

async confirmarDescompartir() {
  if (!this.listaEditando) return;

  this.procesandoDescompartir = true;
  
  try {
    await this.compartirService.descompartir('lista', this.listaEditando.idLista).toPromise();
    
    this.compartible = false;
    this.claveCompartir = '';
    
    this.notificacionesService.exito('Lista descompartida exitosamente');
    this.modalDescompartirAbierto = false;
    this.procesandoDescompartir = false;
    
    this.listaGuardada.emit();
  } catch (error) {
    console.error('Error al descompartir:', error);
    this.notificacionesService.error('Error al descompartir la lista');
    this.procesandoDescompartir = false;
  }
}

  get iconosFiltrados() {
    return this.iconosDisponibles.filter(
      item => item.categoria === this.categoriaSeleccionada
    );
  }

  get categorias_iconos() {
    return [...new Set(this.iconosDisponibles.map(item => item.categoria))];
  }
}
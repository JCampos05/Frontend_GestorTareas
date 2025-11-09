import { Component, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CategoriasService } from '../../core/services/categorias/categorias';
import { ListasService } from '../../core/services/listas/listas';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() visible: boolean = true;
  @Output() abrirModalCategoriaEvent = new EventEmitter<void>();
  @Output() abrirModalListaEvent = new EventEmitter<number | null>();

  categorias: any[] = [];
  listasSinCategoria: any[] = [];
  categoriaExpandida: { [key: string]: boolean } = {};
  
  // Suscripción para detectar cambios
  private listasSubscription?: Subscription;

  constructor(
    private categoriasService: CategoriasService,
    private listasService: ListasService,
    private router: Router
  ) { }

  ngOnInit() {
    this.cargarCategorias();
    
    // Suscribirse a los cambios en las listas
    this.listasSubscription = this.listasService.listasCambiadas$.subscribe(() => {
      this.cargarCategorias();
    });
  }
  
  ngOnDestroy() {
    // Limpiar la suscripción para evitar memory leaks
    if (this.listasSubscription) {
      this.listasSubscription.unsubscribe();
    }
  }

  esEmoji(icono: string | null | undefined): boolean {
    if (!icono || icono === 'null' || icono === '') return false;

    // Si empieza con 'fa', es un icono Font Awesome
    if (icono.trim().startsWith('fa')) {
      return false;
    }

    // Si es otra cosa (emoji), devolver true
    return true;
  }

  obtenerClaseIcono(icono: string | null | undefined): string {
    // Si no hay icono o es null
    if (!icono || icono === 'null' || icono === '') {
      return 'fas fa-clipboard-list';
    }

    // Limpiar espacios
    const iconoLimpio = icono.trim();

    // Si ya tiene el prefijo 'fas ' o 'far '
    if (iconoLimpio.startsWith('fas ') || iconoLimpio.startsWith('far ')) {
      return iconoLimpio;
    }

    // Si empieza con 'fa-', agregar prefijo 'fas'
    if (iconoLimpio.startsWith('fa-')) {
      return `fas ${iconoLimpio}`;
    }

    // Default
    return 'fas fa-clipboard-list';
  }

  async cargarCategorias() {
    try {
      const categorias = await this.categoriasService.obtenerCategorias();
      
      for (const categoria of categorias) {
        const listas = await this.categoriasService.obtenerListasPorCategoria(categoria.idCategoria ?? 0);
        categoria.listas = listas;
      }

      this.listasSinCategoria = await this.listasService.obtenerListasSinCategoria();
      
      this.categorias = categorias;
      
      //console.log('Todas las listas:');
      this.categorias.forEach(cat => {
        cat.listas?.forEach((lista: any) => {
          //console.log(`"${lista.nombre}": icono="${lista.icono}"`);
        });
      });
      this.listasSinCategoria.forEach(lista => {
        //console.log(`"${lista.nombre}" (sin cat): icono="${lista.icono}"`);
      });
      
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  }

  toggleCategoria(idCategoria: string) {
    this.categoriaExpandida[idCategoria] = !this.categoriaExpandida[idCategoria];
  }

  isCategoriaExpandida(idCategoria: string): boolean {
    return this.categoriaExpandida[idCategoria] || false;
  }

  // ==================== TOOLS ====================
  mostrarListasIndividuales() {
    //console.log('Función pendiente: mostrar listas individuales');
    this.router.navigate(['/app/listas-individuales']);
  }

  mostrarListasImportantes() {
    //console.log('Función pendiente: mostrar listas importantes');
    this.router.navigate(['/app/listas-importantes']);
  }

  mostrarCalendario() {
    console.log('Función pendiente: mostrar calendario');
    // TODO: Crear página
  }

  mostrarImportante() {
    console.log('Función pendiente: mostrar tareas importantes');
    // TODO: Crear página
  }

  mostrarNotas() {
    this.router.navigate(['/app/notas']);
  }

  // ==================== VISTAS ====================
  cargarTodasLasTareas() {
    this.router.navigate(['/app/todas-tareas']);
  }
  cargarMiDia() {
    this.router.navigate(['/app/mi-dia']);
  }
  cargarPendientes() {
    this.router.navigate(['/app/pendientes']);
  }

  cargarEnProgreso() {
    this.router.navigate(['/app/progreso']);
  }

  cargarCompletadas() {
    this.router.navigate(['/app/completadas']);
  }

  cargarTareasVencidas() {
    this.router.navigate(['/app/vencidas']);
  }

  // Método legacy para compatibilidad (puedes cambiarlo en el HTML)
  filtrarPorEstado(estado: string) {
    switch (estado) {
      case 'P':
        this.cargarPendientes();
        break;
      case 'N':
        this.cargarEnProgreso();
        break;
      case 'C':
        this.cargarCompletadas();
        break;
    }
  }

  // ==================== DETALLES ====================
  cargarTareasDeLista(idLista: number) {
    this.router.navigate(['/app/lista', idLista]);
  }

  cargarCategoria(idCategoria: number) {
    console.log('Función pendiente: mostrar categoría', idCategoria);
    // TODO: Crear página detalle-categoria
  }

  // ==================== ADMIN ====================
  /*mostrarAdminSections() {
    this.router.navigate(['/app/operator']);
  }*/
  // ==================== MODALS ====================
  abrirModalCategoria() {
    this.abrirModalCategoriaEvent.emit();
  }

  abrirModalLista(idCategoria: string | number, event?: Event) {
    if (event) {
      event.stopPropagation(); // Evita que se expanda/contraiga la categoría
    }
    const categoriaId = idCategoria === 'sin-categoria' ? null : Number(idCategoria);
    this.abrirModalListaEvent.emit(categoriaId);
  }

  abrirModalListaSinCategoria() {
    this.abrirModalListaEvent.emit(null);
  }
}
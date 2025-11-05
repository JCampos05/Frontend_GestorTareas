import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CategoriasService } from '../../core/services/categorias/categorias';
import { ListasService } from '../../core/services/listas/listas';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent implements OnInit {
  @Input() visible: boolean = true;

  categorias: any[] = [];
  categoriaExpandida: { [key: string]: boolean } = {};

  constructor(
    private categoriasService: CategoriasService,
    private listasService: ListasService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarCategorias();
  }

  async cargarCategorias() {
    try {
      const categorias = await this.categoriasService.obtenerCategorias();
      
      for (const categoria of categorias) {
        const listas = await this.categoriasService.obtenerListasPorCategoria(categoria.idCategoria ?? 0);
        categoria.listas = listas;
      }

      const listasSinCategoria = await this.listasService.obtenerListasSinCategoria();
      
      this.categorias = categorias;
      
      if (listasSinCategoria.length > 0) {
        this.categorias.push({
          idCategoria: 'sin-categoria',
          nombre: 'Sin categoría',
          listas: listasSinCategoria
        });
      }
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
    console.log('Función pendiente: mostrar listas individuales');
    // TODO: Crear página
  }

  mostrarListasImportantes() {
    console.log('Función pendiente: mostrar listas importantes');
    // TODO: Crear página
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
    switch(estado) {
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
  mostrarAdminSections() {
    this.router.navigate(['/app/operator']);
  }
}
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

  // Navegación
  mostrarAdminSections() {
    this.router.navigate(['/admin']);
  }

  mostrarListasImportantes() {
    console.log('Función pendiente: mostrar listas importantes');
  }

  mostrarCalendario() {
    console.log('Función pendiente: mostrar calendario');
  }

  mostrarImportante() {
    console.log('Función pendiente: mostrar tareas importantes');
  }

  mostrarNotas() {
    console.log('Función pendiente: mostrar notas');
  }

  cargarTodasLasTareas() {
    this.router.navigate(['/tareas']);
  }

  filtrarPorEstado(estado: string) {
    this.router.navigate(['/tareas'], { queryParams: { estado } });
  }

  cargarTareasVencidas() {
    this.router.navigate(['/tareas'], { queryParams: { filtro: 'vencidas' } });
  }

  cargarTareasDeLista(idLista: number) {
    this.router.navigate(['/lista', idLista]);
  }
}
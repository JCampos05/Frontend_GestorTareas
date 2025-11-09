import { Component, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../componentes/header/header';
import { SidebarComponent } from '../../componentes/sidebar/sidebar';
import { ModalCategoriaComponent } from '../../componentes/modal-categoria/modal-categoria';
import { ModalListaComponent } from '../../componentes/modal-lista/modal-lista';
import { NotificacionComponent } from '../../componentes/notification/notification';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet, 
    HeaderComponent, 
    SidebarComponent,
    ModalCategoriaComponent,
    ModalListaComponent,
    NotificacionComponent
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayoutComponent {
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  
  sidebarVisible = true;
  mostrarModalCategoria = false;
  mostrarModalLista = false;
  categoriaSeleccionadaParaLista: number | null = null;

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  // ==================== MODALS CATEGORÍAS ====================
  abrirModalCategoria() {
    this.mostrarModalCategoria = true;
  }

  cerrarModalCategoria() {
    this.mostrarModalCategoria = false;
  }

  onCategoriaGuardada() {
    this.sidebar.cargarCategorias();
  }

  // ==================== MODALS LISTAS ====================
  abrirModalLista(idCategoria: number | null) {
    this.categoriaSeleccionadaParaLista = idCategoria;
    this.mostrarModalLista = true;
  }

  cerrarModalLista() {
    this.mostrarModalLista = false;
    this.categoriaSeleccionadaParaLista = null;
  }

  onListaGuardada() {
    this.sidebar.cargarCategorias();
  }
}
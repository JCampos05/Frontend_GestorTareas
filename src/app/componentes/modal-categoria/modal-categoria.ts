import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriasService } from '../../core/services/categorias/categorias';
import { NotificacionesService } from '../../core/services/notification/notification';

@Component({
  selector: 'app-modal-categoria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-categoria.html',
  styleUrl: './modal-categoria.css' 
})
export class ModalCategoriaComponent implements OnInit {
  @Input() visible: boolean = false;
  @Input() categoriaEditando: any = null;
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() categoriaGuardada = new EventEmitter<void>();

  nombreCategoria: string = '';

  constructor(
    private categoriasService: CategoriasService,
    private notificacionesService: NotificacionesService
  ) {}

  ngOnInit() {
    if (this.categoriaEditando) {
      this.nombreCategoria = this.categoriaEditando.nombre;
    }
  }

  async guardar() {
    if (!this.nombreCategoria.trim()) return;

    try {
      if (this.categoriaEditando) {
        await this.categoriasService.actualizarCategoria(
          this.categoriaEditando.idCategoria,
          { nombre: this.nombreCategoria }
        );
      } else {
        await this.categoriasService.crearCategoria({ nombre: this.nombreCategoria });
      }
      
      this.categoriaGuardada.emit();
      this.cerrar();
      this.notificacionesService.exito('Categoria creada exitosamente');
    } catch (error) {
      console.error('Error al guardar categoría:', error);
      alert('Error al guardar la categoría');
    }
  }

  cerrar() {
    this.nombreCategoria = '';
    this.cerrarModal.emit();
  }
}
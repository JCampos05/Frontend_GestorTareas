import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ListasService } from '../../../core/services/listas/listas';
import { ColumnasComponent } from '../../../componentes/columna/columna';

@Component({
  selector: 'app-detalle-lista',
  standalone: true,
  imports: [CommonModule, ColumnasComponent],
  templateUrl: './detalles-lista.html',
  styleUrl: './detalles-lista.css'
})
export class DetalleListaComponent implements OnInit {
  nombreLista: string = '';
  descripcionLista: string = '';
  iconoLista: string = '';
  colorLista: string = '';
  idLista: number = 0;

  constructor(
    private route: ActivatedRoute,
    private listasService: ListasService
  ) {}

  async ngOnInit() {
    this.route.params.subscribe(async params => {
      this.idLista = +params['id'];
      await this.cargarInfoLista();
    });
  }

  async cargarInfoLista() {
    try {
      const lista = await this.listasService.obtenerListaConTareas(this.idLista);
      if (lista) {
        this.nombreLista = lista.nombre || '';
        this.descripcionLista = lista.descripcion || '';
        this.iconoLista = lista.icono || '';
        this.colorLista = lista.color || '#0052CC';
      }
    } catch (error) {
      console.error('Error al cargar información de lista:', error);
    }
  }

  // Métodos para manejar iconos
  esEmoji(icono: string | null | undefined): boolean {
    if (!icono || icono === 'null' || icono === '') return false;
    const iconoLimpio = icono.trim();
    return !iconoLimpio.startsWith('fa');
  }

  obtenerClaseIcono(icono: string | null | undefined): string {
    if (!icono || icono === 'null' || icono === '') {
      return 'fas fa-clipboard-list';
    }
    
    const iconoLimpio = icono.trim();
    
    // Si ya tiene 'fas ' o 'far '
    if (iconoLimpio.startsWith('fas ') || iconoLimpio.startsWith('far ')) {
      return iconoLimpio;
    }
    
    // Si solo tiene 'fa-algo', agregar 'fas'
    if (iconoLimpio.startsWith('fa-')) {
      return `fas ${iconoLimpio}`;
    }
    
    return 'fas fa-clipboard-list';
  }
}
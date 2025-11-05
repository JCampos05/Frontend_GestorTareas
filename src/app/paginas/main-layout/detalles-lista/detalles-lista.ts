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
      }
    } catch (error) {
      console.error('Error al cargar información de lista:', error);
    }
  }
}
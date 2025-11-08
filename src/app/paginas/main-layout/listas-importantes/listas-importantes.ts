import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListasService, Lista } from '../../../core/services/listas/listas';
import { Router } from '@angular/router';

@Component({
  selector: 'app-listas-importantes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './listas-importantes.html',
  styleUrl: './listas-importantes.css'
})
export class ListasImportantesComponent implements OnInit {
  listas: Lista[] = [];

  constructor(
    private listasService: ListasService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.cargarListasImportantes();
  }

  async cargarListasImportantes() {
    try {
      this.listas = await this.listasService.obtenerListasImportantes();
    } catch (error) {
      console.error('Error al cargar listas importantes:', error);
    }
  }

  abrirLista(idLista: number) {
    this.router.navigate(['/app/lista', idLista]);
  }
}
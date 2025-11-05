import { Component } from '@angular/core';
import { ColumnasComponent } from '../../../componentes/columna/columna';
import { Router } from '@angular/router';

@Component({
  selector: 'app-completadas',
  standalone: true,
  imports: [ColumnasComponent],
  templateUrl: './completadas.html',
  styleUrl: './completadas.css'
})
export class CompletadasComponent {
  constructor(private router: Router) {
    this.router.navigate([], { 
      queryParams: { estado: 'C' }, 
      queryParamsHandling: 'merge',
      replaceUrl: true 
    });
  }
}
import { Component } from '@angular/core';
import { ColumnasComponent } from '../../../componentes/columna/columna';
import { Router } from '@angular/router';

@Component({
  selector: 'app-progreso',
  standalone: true,
  imports: [ColumnasComponent],
  templateUrl: './progreso.html',
  styleUrl: './progreso.css'
})
export class ProgresoComponent {
  constructor(private router: Router) {
    this.router.navigate([], { 
      queryParams: { estado: 'N' }, 
      queryParamsHandling: 'merge',
      replaceUrl: true 
    });
  }
}
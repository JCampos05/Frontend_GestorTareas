import { Component } from '@angular/core';
import { ColumnasComponent } from '../../../componentes/columna/columna';
import { Router } from '@angular/router';

@Component({
  selector: 'app-vencidas',
  standalone: true,
  imports: [ColumnasComponent],
  templateUrl: './vencidas.html',
  styleUrl: './vencidas.css' 
})
export class VencidasComponent {
  constructor(private router: Router) {
    this.router.navigate([], { 
      queryParams: { filtro: 'vencidas' }, 
      queryParamsHandling: 'merge',
      replaceUrl: true 
    });
  }
}
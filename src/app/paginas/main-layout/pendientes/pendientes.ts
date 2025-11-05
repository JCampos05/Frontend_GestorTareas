import { Component, OnInit } from '@angular/core';
import { ColumnasComponent } from '../../../componentes/columna/columna';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-pendientes',
  standalone: true,
  imports: [ColumnasComponent],
  templateUrl: './pendientes.html',
  styleUrl: './pendientes.css' 
})
export class PendientesComponent implements OnInit {
  
  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Verificar si ya tenemos el queryParam, si no, agregarlo
    if (!this.route.snapshot.queryParams['estado']) {
      this.router.navigate([], { 
        relativeTo: this.route,
        queryParams: { estado: 'P' }, 
        queryParamsHandling: 'merge'
      });
    }
  }
}
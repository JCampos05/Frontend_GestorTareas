import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableroComponent } from '../../../componentes/tablero/tablero';

@Component({
  selector: 'app-mi-dia',
  standalone: true,
  imports: [CommonModule, TableroComponent],
  templateUrl: './mi-dia.html',
  styleUrl: './mi-dia.css'
})
export class MiDiaComponent {
  obtenerFechaHoy(): string {
    const hoy = new Date();
    return hoy.toLocaleDateString('es-MX', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}
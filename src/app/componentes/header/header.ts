import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent {
  @Output() toggleSidebarEvent = new EventEmitter<void>();
  searchQuery: string = '';

  toggleSidebar() {
    this.toggleSidebarEvent.emit();
  }

  onSearch() {
    console.log('Buscando:', this.searchQuery);
    // TODO: Implementar búsqueda
  }

  cambiarVista() {
    console.log('Función pendiente: cambiar vista de día');
    // TODO: Implementar cambio de vista
  }

  loginGoogle() {
    console.log('Login con Google');
    // TODO: Implementar autenticación
  }
}
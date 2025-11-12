import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompartirService } from '../../core/services/compartir/compartir';

// DEBUGGING: Agregar logs para rastrear el flujo

@Component({
  selector: 'app-modal-compartir',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-compartir.html',
  styleUrls: ['./modal-compartir.css']
})
export class ModalCompartirComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() tipo: 'categoria' | 'lista' = 'categoria';
  @Input() itemId: number = 0;
  @Input() itemNombre: string = '';
  @Input() claveExistente: string | null = null; // Nueva prop para recibir clave actual
  @Output() close = new EventEmitter<void>();
  @Output() compartido = new EventEmitter<string>();

  claveGenerada: string = '';
  urlCompartir: string = '';
  loading = false;
  copiado = false;

  constructor(private compartirService: CompartirService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      // Si ya tiene clave existente, mostrarla directamente
      if (this.claveExistente) {
        this.claveGenerada = this.claveExistente;
      } else {
        this.claveGenerada = '';
      }
      this.copiado = false;
    }
  }

  // Generar NUEVA clave (actualiza BD)
  confirmarCompartir() {
    this.loading = true;

    const compartir$ = this.tipo === 'categoria'
      ? this.compartirService.compartirCategoria(this.itemId)
      : this.compartirService.compartirLista(this.itemId);

    compartir$.subscribe({
      next: (response) => {
        console.log('✅ Respuesta completa del servidor:', response);
        
        // CRITICAL: Usar la clave que viene en lista.claveCompartir (la que está en la BD)
        if (response.lista?.claveCompartir) {
          this.claveGenerada = response.lista.claveCompartir;
          console.log('✅ Clave tomada de response.lista.claveCompartir:', this.claveGenerada);
        } else if (response.clave) {
          this.claveGenerada = response.clave;
          console.log('⚠️ Clave tomada de response.clave:', this.claveGenerada);
        } else {
          console.error('❌ No se encontró clave en la respuesta');
        }
        
        this.urlCompartir = response.url || '';
        this.loading = false;
        
        // Emitir la clave correcta que está en la BD
        this.compartido.emit(this.claveGenerada);
      },
      error: (error) => {
        console.error('❌ Error al compartir:', error);
        this.loading = false;
      }
    });
  }

  // Copiar clave ACTUAL (sin modificar BD)
  copiarClaveActual() {
    if (!this.claveGenerada) return;
    
    navigator.clipboard.writeText(this.claveGenerada).then(() => {
      this.copiado = true;
      setTimeout(() => this.copiado = false, 2000);
    });
  }

  copiarClave() {
    navigator.clipboard.writeText(this.claveGenerada);
    this.copiado = true;
    setTimeout(() => this.copiado = false, 2000);
  }

  copiarUrl() {
    navigator.clipboard.writeText(this.urlCompartir);
    this.copiado = true;
    setTimeout(() => this.copiado = false, 2000);
  }

  cerrar() {
    this.claveGenerada = '';
    this.urlCompartir = '';
    this.copiado = false;
    this.close.emit();
  }
}
import { Component, ViewEncapsulation, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GeneralComponent } from './general/general';
import { RedesSocialesComponent } from './redes-sociales/redes-sociales';
import { SeguridadComponent } from './seguridad/seguridad';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, GeneralComponent, RedesSocialesComponent, SeguridadComponent],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css',
  encapsulation: ViewEncapsulation.None
})
export class ConfiguracionComponent implements OnInit, OnDestroy {
  // ✅ CRÍTICO: Output para comunicarse con el componente padre
  @Output() cerrarModal = new EventEmitter<void>();
  
  seccionActiva: 'general' | 'redes' | 'seguridad' = 'general';
  private escListener: ((event: KeyboardEvent) => void) | null = null;

  constructor(private router: Router) {}

  ngOnInit() {
    console.log('🎯 Configuración inicializada');
    
    // ✅ Configurar listener de ESC manualmente
    this.escListener = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Esc') {
        console.log('⌨️ ESC presionado - Cerrando modal');
        this.cerrar();
      }
    };
    
    // Agregar el listener
    document.addEventListener('keydown', this.escListener);
  }

  ngOnDestroy() {
    console.log('💀 Configuración destruyéndose');
    
    // ✅ CRÍTICO: Limpiar el listener al destruir el componente
    if (this.escListener) {
      document.removeEventListener('keydown', this.escListener);
      console.log('🧹 Listener de ESC removido');
    }
  }

  cambiarSeccion(seccion: 'general' | 'redes' | 'seguridad') {
    console.log('🔄 Cambiando a sección:', seccion);
    this.seccionActiva = seccion;
  }

  cerrar() {
    console.log('🚪 Cerrando configuración mediante Output...');
    
    // ✅ Remover el listener antes de emitir
    if (this.escListener) {
      document.removeEventListener('keydown', this.escListener);
      this.escListener = null;
    }
    
    // ✅ Emitir evento al componente padre (Header)
    this.cerrarModal.emit();
  }

  cerrarSiEsOverlay(event: MouseEvent) {
    // Verificar que el click fue EN el overlay mismo
    if (event.target !== event.currentTarget) {
      console.log('ℹ️ Click dentro del container, NO cerrando');
      return;
    }

    console.log('✅ Click en overlay - Cerrando');
    this.cerrar();
  }
}
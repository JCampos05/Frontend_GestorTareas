import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { TableroComponent } from '../../../componentes/principal/tablero/tablero';
import { ClimaService, ClimaData } from '../../../core/services/clima/clima';

@Component({
  selector: 'app-mi-dia',
  standalone: true,
  imports: [CommonModule, TableroComponent, HttpClientModule],
  templateUrl: './mi-dia.html',
  styleUrl: './mi-dia.css',
  providers: [ClimaService]
})
export class MiDiaComponent implements OnInit {
  climaData: ClimaData | null = null;
  cargandoClima = false;
  errorClima = false;
  mostrarModalEliminar = false;
  tareaAEliminar: any = null;

  constructor(private climaService: ClimaService) {}

  async ngOnInit() {
    await this.cargarClima();
  }

  async cargarClima() {
    this.cargandoClima = true;
    this.errorClima = false;

    try {
      // Intentar obtener ubicación actual
      console.log('🔍 Solicitando ubicación del dispositivo...');
      const position = await this.climaService.obtenerUbicacionActual();
      
      console.log('✅ Ubicación obtenida:', {
        latitud: position.coords.latitude,
        longitud: position.coords.longitude,
        precision: position.coords.accuracy + 'm'
      });
      
      this.climaService.obtenerClimaPorCoordenadas(
        position.coords.latitude,
        position.coords.longitude
      ).subscribe({
        next: (data) => {
          console.log('🌤️ Clima obtenido para:', data.ciudad, data.pais);
          this.climaData = data;
          this.cargandoClima = false;
        },
        error: (error) => {
          console.error('❌ Error al obtener clima:', error);
          this.errorClima = true;
          this.cargandoClima = false;
        }
      });
    } catch (error: any) {
      // Si falla la geolocalización, usar ciudad por defecto
      console.warn('⚠️ No se pudo obtener ubicación:', error.message);
      console.log('📍 Usando ubicación por defecto: Mexico City');
      
      this.climaService.obtenerClimaPorCiudad('Mexico City').subscribe({
        next: (data) => {
          console.log('🌤️ Clima por defecto obtenido:', data.ciudad);
          this.climaData = data;
          this.cargandoClima = false;
        },
        error: (error) => {
          console.error('❌ Error al obtener clima por defecto:', error);
          this.errorClima = true;
          this.cargandoClima = false;
        }
      });
    }
  }

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
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/authentication/authentication';
import { NotificacionesService } from '../../core/services/notification/notification';

@Component({
  selector: 'app-registrate',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './crear-cuenta.html',
  styleUrl: './crear-cuenta.css'
})
export class Registrate {
  
  // Campos del formulario
  nombre: string = '';
  apellido: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  aceptaTerminos: boolean = false;
  
  // Estados
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificacionesService: NotificacionesService,
  ) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit() {
    // Limpiar mensaje de error previo
    this.errorMessage = '';

    // Validar que las contraseñas coincidan
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    // Validar términos y condiciones
    if (!this.aceptaTerminos) {
      this.errorMessage = 'Debes aceptar los términos y condiciones';
      return;
    }

    this.isLoading = true;

    console.log('Intentando registrar usuario...', {
      nombre: this.nombre,
      apellido: this.apellido,
      email: this.email
    });

    // Llamar al servicio de autenticación
    this.authService.registrar({
      nombre: this.nombre,
      apellido: this.apellido,
      email: this.email,
      password: this.password
    }).subscribe({
      next: (response) => {
        console.log('✅ Registro exitoso:', response);
        this.isLoading = false;
        
        // Mostrar mensaje de éxito
        this.notificacionesService.mostrar('exito',`¡Bienvenido ${response.usuario.nombre}! Tu cuenta ha sido creada exitosamente.`);
        //alert(`¡Bienvenido ${response.usuario.nombre}! Tu cuenta ha sido creada exitosamente.`);
        
        // Redirigir a la aplicación principal o dashboard
        this.router.navigate(['/app']);
      },
      error: (error) => {
        console.error('❌ Error en el registro:', error);
        console.error('Error completo:', JSON.stringify(error, null, 2));
        this.isLoading = false;
        
        // Mostrar mensaje de error específico
        if (error.error?.error) {
          this.errorMessage = error.error.error;
        } else if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor. Verifica que esté corriendo en el puerto 3000.';
        } else {
          this.errorMessage = 'Error al crear la cuenta. Por favor intenta de nuevo.';
        }
      }
    });
  }

  onLogin() {
    this.router.navigate(['/login']);
  }
}
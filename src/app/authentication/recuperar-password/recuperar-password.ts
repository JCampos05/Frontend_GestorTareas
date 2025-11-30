import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/authentication/authentication';
import { NotificacionesService } from '../../core/services/notification/notification';

@Component({
  selector: 'app-recuperar-password',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './recuperar-password.html',
  styleUrl: './recuperar-password.css'
})
export class RecuperarPasswordComponent {
  email: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificacionesService: NotificacionesService
  ) {}

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email) {
      this.errorMessage = 'Por favor ingresa tu email';
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.errorMessage = 'Por favor ingresa un email válido';
      return;
    }

    this.isLoading = true;

    this.authService.solicitarRecuperacionPassword(this.email).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = '¡Código enviado! Revisa tu email.';
        this.notificacionesService.exito('Código enviado a tu email');

        setTimeout(() => {
          this.router.navigate(['/verificar-recuperacion'], {
            queryParams: {
              email: this.email,
              emailOfuscado: response.emailOfuscado || this.ofuscarEmail(this.email)
            }
          });
        }, 1000);
      },
      error: (error) => {
        this.isLoading = false;

        if (error.status === 429) {
          const segundos = error.error?.segundosRestantes || 60;
          this.errorMessage = `Debes esperar ${segundos} segundos antes de solicitar otro código`;
        } else {
          this.errorMessage = error.error?.mensaje || 'Error al enviar el código';
        }
      }
    });
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  ofuscarEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 3) {
      return `${local[0]}***@${domain}`;
    }
    return `${local.slice(0, 3)}***@${domain}`;
  }

  volverAlLogin() {
    this.router.navigate(['/login']);
  }
}
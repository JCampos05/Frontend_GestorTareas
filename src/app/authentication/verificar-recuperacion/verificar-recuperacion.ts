import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/authentication/authentication';
import { NotificacionesService } from '../../core/services/notification/notification';

@Component({
  selector: 'app-verificar-recuperacion',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './verificar-recuperacion.html',
  styleUrl: './verificar-recuperacion.css'
})
export class VerificarRecuperacionComponent implements OnInit, OnDestroy {
  email: string = '';
  emailOfuscado: string = '';
  codigo: string[] = ['', '', '', '', '', ''];
  
  isLoading: boolean = false;
  isResending: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  
  cooldownSeconds: number = 0;
  cooldownInterval: any;
  
  intentosRestantes: number = 3;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private notificacionesService: NotificacionesService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      this.emailOfuscado = params['emailOfuscado'] || this.ofuscarEmail(this.email);
      
      //console.log('Email recibido:', this.email); // Debug
      //console.log('Email ofuscado:', this.emailOfuscado); // Debug
      
      if (!this.email) {
        this.notificacionesService.error('Datos de recuperación no válidos');
        this.router.navigate(['/recuperar-password']);
      }
    });
  }

  ngOnDestroy() {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
  }

  onDigitInput(event: any, index: number) {
    const input = event.target;
    const value = input.value;
    
    if (value && !/^\d$/.test(value)) {
      input.value = '';
      return;
    }
    
    this.codigo[index] = value;
    
    if (value && index < 5) {
      const nextInput = document.getElementById(`digit-${index + 1}`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
    
    if (index === 5 && value) {
      this.verificarCodigo();
    }
  }

  onDigitKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !this.codigo[index] && index > 0) {
      const prevInput = document.getElementById(`digit-${index - 1}`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    
    for (let i = 0; i < digits.length && i < 6; i++) {
      this.codigo[i] = digits[i];
      const input = document.getElementById(`digit-${i}`) as HTMLInputElement;
      if (input) {
        input.value = digits[i];
      }
    }
    
    if (digits.length === 6) {
      this.verificarCodigo();
    }
  }

  verificarCodigo() {
    const codigoCompleto = this.codigo.join('');
    
    if (codigoCompleto.length !== 6) {
      this.errorMessage = 'Por favor ingresa los 6 dígitos';
      return;
    }
    
    this.errorMessage = '';
    this.isLoading = true;
    
    this.authService.verificarCodigoRecuperacion(this.email, codigoCompleto).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = '¡Código verificado!';
        
        this.notificacionesService.exito('Código verificado correctamente');
        
        setTimeout(() => {
          this.router.navigate(['/nueva-password'], {
            queryParams: {
              tokenTemporal: response.tokenTemporal,
              email: this.email
            }
          });
        }, 1000);
      },
      error: (error) => {
        this.isLoading = false;
        
        if (error.error?.error === 'CODIGO_INCORRECTO') {
          this.intentosRestantes = error.error.intentosRestantes || 0;
          this.errorMessage = error.error.mensaje || 'Código incorrecto';
          this.limpiarCodigo();
        } else if (error.error?.error === 'EXPIRADO') {
          this.errorMessage = 'El código ha expirado. Solicita uno nuevo.';
          this.limpiarCodigo();
        } else if (error.error?.error === 'INTENTOS_EXCEDIDOS') {
          this.errorMessage = 'Has excedido el número de intentos. Solicita un nuevo código.';
          this.limpiarCodigo();
        } else {
          this.errorMessage = error.error?.mensaje || 'Error al verificar el código';
        }
      }
    });
  }

  reenviarCodigo() {
    if (this.cooldownSeconds > 0) {
      return;
    }
    
    this.errorMessage = '';
    this.successMessage = '';
    this.isResending = true;
    
    this.authService.solicitarRecuperacionPassword(this.email).subscribe({
      next: (response) => {
        this.isResending = false;
        this.successMessage = '¡Código reenviado! Revisa tu email.';
        this.notificacionesService.exito('Código enviado a tu email');
        
        this.limpiarCodigo();
        this.iniciarCooldown(60);
        
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        this.isResending = false;
        
        if (error.status === 429) {
          const segundos = error.error?.segundosRestantes || 60;
          this.errorMessage = error.error?.mensaje || 'Debes esperar antes de solicitar otro código';
          this.iniciarCooldown(segundos);
        } else {
          this.errorMessage = error.error?.mensaje || 'Error al reenviar el código';
        }
      }
    });
  }

  iniciarCooldown(seconds: number) {
    this.cooldownSeconds = seconds;
    
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
    
    this.cooldownInterval = setInterval(() => {
      this.cooldownSeconds--;
      
      if (this.cooldownSeconds <= 0) {
        clearInterval(this.cooldownInterval);
      }
    }, 1000);
  }

  limpiarCodigo() {
    this.codigo = ['', '', '', '', '', ''];
    
    for (let i = 0; i < 6; i++) {
      const input = document.getElementById(`digit-${i}`) as HTMLInputElement;
      if (input) {
        input.value = '';
      }
    }
    
    const firstInput = document.getElementById('digit-0') as HTMLInputElement;
    if (firstInput) {
      firstInput.focus();
    }
  }

  volverAlRecuperar() {
    this.router.navigate(['/recuperar-password']);
  }

  ofuscarEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 3) {
      return `${local[0]}***@${domain}`;
    }
    return `${local.slice(0, 3)}***@${domain}`;
  }
}
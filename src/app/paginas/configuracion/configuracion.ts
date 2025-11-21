import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { AuthService, Usuario } from '../../core/services/authentication/authentication';
import { NotificacionesService } from '../../core/services/notification/notification';
import { CiudadAutocompleteService, Ciudad } from '../../core/services/ciudad/ciudad';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css'
})
export class ConfiguracionComponent implements OnInit {
  seccionActiva: 'general' | 'redes' | 'seguridad' = 'general';
  
  formGeneral!: FormGroup;
  formRedes!: FormGroup;
  formPassword!: FormGroup;
  
  usuario: Usuario | null = null;
  
  guardandoGeneral = false;
  guardandoRedes = false;
  guardandoPassword = false;
  
  mostrarPasswordActual = false;
  mostrarPasswordNuevo = false;
  mostrarPasswordConfirmar = false;
  
  // Autocompletado de ciudades
  ciudadesSugeridas: Ciudad[] = [];
  ciudadSeleccionada: Ciudad | null = null;
  mostrarSugerencias = false;
  buscandoCiudades = false;
  private busquedaCiudad$ = new Subject<string>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificacionesService: NotificacionesService,
    private ciudadService: CiudadAutocompleteService
  ) {}

  ngOnInit() {
    this.inicializarFormularios();
    this.cargarDatosUsuario();
    this.configurarAutocompletado();
  }

  configurarAutocompletado() {
    this.busquedaCiudad$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        console.log('🔍 Buscando ciudades con query:', query);
        this.buscandoCiudades = true;
        return this.ciudadService.buscarCiudades(query);
      })
    ).subscribe({
      next: (ciudades) => {
        console.log('✅ Ciudades recibidas:', ciudades);
        this.ciudadesSugeridas = ciudades;
        this.buscandoCiudades = false;
        this.mostrarSugerencias = ciudades.length > 0;
      },
      error: (error) => {
        console.error('❌ Error en autocompletado:', error);
        this.buscandoCiudades = false;
        this.ciudadesSugeridas = [];
      }
    });
  }

  inicializarFormularios() {
    // Formulario de datos generales
    this.formGeneral = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: [{ value: '', disabled: true }],
      telefono: [''],
      ubicacion: [''],
      cargo: [''],
      bio: ['', [Validators.maxLength(500)]]
    });

    // Formulario de redes sociales
    this.formRedes = this.fb.group({
      linkedin: ['', [this.urlValidator]],
      github: ['', [this.urlValidator]],
      twitter: ['', [this.urlValidator]],
      youtube: ['', [this.urlValidator]],
      reddit: ['', [this.urlValidator]],
      instagram: ['', [this.urlValidator]]
    });

    // Formulario de contraseña
    this.formPassword = this.fb.group({
      passwordActual: ['', [Validators.required]],
      passwordNuevo: ['', [Validators.required, Validators.minLength(6)]],
      passwordConfirmar: ['', [Validators.required]]
    }, { validators: this.passwordsCoinciden });
  }

  cargarDatosUsuario() {
    this.authService.obtenerPerfil().subscribe({
      next: (usuario) => {
        this.usuario = usuario;
        this.llenarFormularios(usuario);
      },
      error: (error) => {
        console.error('Error al cargar usuario:', error);
        const usuarioLocal = this.authService.obtenerUsuarioActual();
        if (usuarioLocal) {
          this.usuario = usuarioLocal;
          this.llenarFormularios(usuarioLocal);
        }
      }
    });
  }

  llenarFormularios(usuario: Usuario) {
    // Llenar formulario general
    this.formGeneral.patchValue({
      nombre: usuario.nombre || '',
      email: usuario.email || '',
      telefono: usuario.telefono || '',
      ubicacion: usuario.ubicacion || '',
      cargo: usuario.cargo || '',
      bio: usuario.bio || ''
    });

    // Llenar formulario de redes sociales
    if (usuario.redes_sociales) {
      this.formRedes.patchValue({
        linkedin: usuario.redes_sociales.linkedin || '',
        github: usuario.redes_sociales.github || '',
        twitter: usuario.redes_sociales.twitter || '',
        youtube: (usuario.redes_sociales as any).youtube || '',
        reddit: (usuario.redes_sociales as any).reddit || '',
        instagram: (usuario.redes_sociales as any).instagram || ''
      });
    }
  }

  cambiarSeccion(seccion: 'general' | 'redes' | 'seguridad') {
    this.seccionActiva = seccion;
  }

  // Autocompletado de ciudades
  onCiudadInput(event: any) {
    const query = event.target.value;
    console.log('📝 Input cambió:', query);
    
    if (query && query.length >= 2) {
      console.log('✅ Query válido, emitiendo búsqueda');
      this.busquedaCiudad$.next(query);
      this.ciudadSeleccionada = null;
    } else {
      console.log('⚠️ Query muy corto o vacío');
      this.ciudadesSugeridas = [];
      this.mostrarSugerencias = false;
    }
  }

  seleccionarCiudad(ciudad: Ciudad) {
    this.ciudadSeleccionada = ciudad;
    this.formGeneral.patchValue({
      ubicacion: ciudad.nombreCompleto
    });
    this.mostrarSugerencias = false;
    this.ciudadesSugeridas = [];
  }

  ocultarSugerenciasConRetraso() {
    // Dar tiempo para que el click en la sugerencia se procese
    setTimeout(() => {
      this.mostrarSugerencias = false;
    }, 200);
  }

  // Guardar datos generales
  async guardarDatosGenerales() {
    if (this.formGeneral.invalid) return;

    this.guardandoGeneral = true;
    const datos = this.formGeneral.getRawValue();

    try {
      // Actualizar todos los datos del perfil incluyendo el nombre y ubicación
      await this.authService.actualizarPerfil({
        nombre: datos.nombre,
        bio: datos.bio,
        telefono: datos.telefono,
        ubicacion: datos.ubicacion,
        cargo: datos.cargo
      }).toPromise();

      this.notificacionesService.mostrar('exito','Datos actualizados correctamente');
      
      // Emitir evento para actualizar el clima si cambió la ubicación
      if (this.ciudadSeleccionada) {
        window.dispatchEvent(new CustomEvent('ubicacionActualizada', {
          detail: {
            ciudad: this.ciudadSeleccionada.nombre,
            nombreCompleto: this.ciudadSeleccionada.nombreCompleto
          }
        }));
      }
      
      // Recargar datos del usuario
      this.cargarDatosUsuario();
      this.ciudadSeleccionada = null;
    } catch (error: any) {
      console.error('Error al guardar datos:', error);
      const mensaje = error.error?.mensaje || error.error?.error || 'Error al actualizar datos';
      this.notificacionesService.mostrar(mensaje, 'error');
    } finally {
      this.guardandoGeneral = false;
    }
  }

  cancelarCambiosGenerales() {
    if (this.usuario) {
      this.llenarFormularios(this.usuario);
    }
  }

  // Guardar redes sociales
  async guardarRedesSociales() {
    this.guardandoRedes = true;
    const redes = this.formRedes.value;

    // Filtrar solo las redes con URL
    const redesFiltradas: any = {};
    Object.keys(redes).forEach(key => {
      if (redes[key] && redes[key].trim() !== '') {
        redesFiltradas[key] = redes[key];
      }
    });

    try {
      await this.authService.actualizarPerfil({
        redes_sociales: redesFiltradas
      }).toPromise();

      this.notificacionesService.mostrar('exito','Redes sociales actualizadas correctamente');
      this.cargarDatosUsuario();
    } catch (error: any) {
      console.error('Error al guardar redes sociales:', error);
      const mensaje = error.error?.mensaje || 'Error al actualizar redes sociales';
      this.notificacionesService.mostrar(mensaje, 'error');
    } finally {
      this.guardandoRedes = false;
    }
  }

  cancelarCambiosRedes() {
    if (this.usuario) {
      this.llenarFormularios(this.usuario);
    }
  }

  // Cambiar contraseña
  async cambiarPassword() {
    if (this.formPassword.invalid) return;

    this.guardandoPassword = true;
    const { passwordActual, passwordNuevo } = this.formPassword.value;

    try {
      await this.authService.cambiarPassword({
        passwordActual,
        passwordNuevo
      }).toPromise();

      this.notificacionesService.mostrar('exito','Contraseña actualizada correctamente');
      this.formPassword.reset();
      this.mostrarPasswordActual = false;
      this.mostrarPasswordNuevo = false;
      this.mostrarPasswordConfirmar = false;
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      const mensaje = error.error?.mensaje || 'Error al cambiar contraseña';
      this.notificacionesService.mostrar(mensaje, 'error');
    } finally {
      this.guardandoPassword = false;
    }
  }

  cancelarCambiosPassword() {
    this.formPassword.reset();
    this.mostrarPasswordActual = false;
    this.mostrarPasswordNuevo = false;
    this.mostrarPasswordConfirmar = false;
  }

  // Validadores personalizados
  urlValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return urlPattern.test(control.value) ? null : { urlInvalida: true };
  }

  passwordsCoinciden(group: AbstractControl): ValidationErrors | null {
    const nuevo = group.get('passwordNuevo')?.value;
    const confirmar = group.get('passwordConfirmar')?.value;
    return nuevo === confirmar ? null : { noCoinciden: true };
  }

  // Validaciones de requisitos de contraseña
  validarLongitud(): boolean {
    const password = this.formPassword.get('passwordNuevo')?.value;
    return password && password.length >= 6;
  }

  validarMayuscula(): boolean {
    const password = this.formPassword.get('passwordNuevo')?.value;
    return password && /[A-Z]/.test(password);
  }

  validarMinuscula(): boolean {
    const password = this.formPassword.get('passwordNuevo')?.value;
    return password && /[a-z]/.test(password);
  }

  validarNumero(): boolean {
    const password = this.formPassword.get('passwordNuevo')?.value;
    return password && /[0-9]/.test(password);
  }

  cerrar() {
    this.router.navigate(['/app/mi-dia']);
  }
}
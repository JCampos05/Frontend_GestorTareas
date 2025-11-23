import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { AuthService, Usuario } from '../../core/services/authentication/authentication';
import { NotificacionesService } from '../../core/services/notification/notification';
import { CiudadAutocompleteService, Ciudad } from '../../core/services/ciudad/ciudad';
import { ZonasService, ZonaHoraria } from '../../core/services/zonas/zonas';

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

  // Zonas horarias
  zonasHorarias: ZonaHoraria[] = [];
  zonasAgrupadasPorRegion: { region: string; zonas: ZonaHoraria[] }[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificacionesService: NotificacionesService,
    private ciudadService: CiudadAutocompleteService,
    private zonasService: ZonasService
  ) { }

  ngOnInit() {
    this.inicializarFormularios();
    this.cargarDatosUsuario();
    this.configurarAutocompletado();
    this.cargarZonasHorarias();
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

  cargarZonasHorarias() {
    this.zonasService.obtenerZonasHorarias().subscribe({
      next: (response) => {
        console.log('✅ Zonas horarias recibidas:', response);
        this.zonasHorarias = response.zonas || [];
        this.agruparZonasPorRegion();
      },
      error: (error) => {
        console.error('❌ Error al cargar zonas horarias:', error);
        this.notificacionesService.mostrar('error', 'Error al cargar zonas horarias');
      }
    });
  }

  agruparZonasPorRegion() {
    const agrupadas = this.zonasHorarias.reduce((acc, zona) => {
      if (!acc[zona.region]) {
        acc[zona.region] = [];
      }
      acc[zona.region].push(zona);
      return acc;
    }, {} as Record<string, ZonaHoraria[]>);

    this.zonasAgrupadasPorRegion = Object.keys(agrupadas).map(region => ({
      region,
      zonas: agrupadas[region]
    }));

    console.log('✅ Zonas agrupadas:', this.zonasAgrupadasPorRegion);
  }

  inicializarFormularios() {
    // Formulario de datos generales
    this.formGeneral = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: [{ value: '', disabled: true }],
      telefono: [''],
      ubicacion: [''],
      zonaHoraria: [''], // Campo opcional
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
        console.log('✅ Usuario cargado:', usuario);
        this.usuario = usuario;
        this.llenarFormularios(usuario);
      },
      error: (error) => {
        console.error('❌ Error al cargar usuario:', error);
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
      zonaHoraria: usuario.zona_horaria || '',
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

  // Método para cerrar solo cuando se hace clic en el overlay
  cerrarSiEsOverlay(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.cerrar();
    }
  }

  // Autocompletado de ciudades
  onCiudadInput(event: any) {
    const query = event.target.value;
    console.log('🔍 Input cambió:', query);

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
    if (this.formGeneral.invalid) {
      console.log('⚠️ Formulario inválido');
      return;
    }

    this.guardandoGeneral = true;
    const datos = this.formGeneral.getRawValue();

    console.log('💾 Guardando datos generales:', datos);

    try {
      // Actualizar todos los datos del perfil
      await this.authService.actualizarPerfil({
        nombre: datos.nombre,
        bio: datos.bio,
        telefono: datos.telefono,
        ubicacion: datos.ubicacion,
        cargo: datos.cargo
      }).toPromise();

      // Actualizar zona horaria si cambió y no está vacía
      if (datos.zonaHoraria && datos.zonaHoraria.trim() !== '') {
        console.log('🕐 Actualizando zona horaria:', datos.zonaHoraria);
        await this.zonasService.actualizarZonaUsuario(datos.zonaHoraria).toPromise();
      }

      this.notificacionesService.mostrar('exito', 'Datos actualizados correctamente');

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
      console.error('❌ Error al guardar datos:', error);
      const mensaje = error.error?.mensaje || error.error?.error || 'Error al actualizar datos';
      this.notificacionesService.mostrar('error', mensaje);
    } finally {
      this.guardandoGeneral = false;
    }
  }

  cancelarCambiosGenerales() {
    console.log('🔙 Cancelando cambios generales');
    if (this.usuario) {
      this.llenarFormularios(this.usuario);
    }
    this.formGeneral.markAsPristine();
    this.formGeneral.markAsUntouched();
  }

  // Guardar redes sociales
  async guardarRedesSociales() {
    this.guardandoRedes = true;
    const redes = this.formRedes.value;

    console.log('💾 Guardando redes sociales:', redes);

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

      this.notificacionesService.mostrar('exito', 'Redes sociales actualizadas correctamente');
      this.cargarDatosUsuario();
    } catch (error: any) {
      console.error('❌ Error al guardar redes sociales:', error);
      const mensaje = error.error?.mensaje || 'Error al actualizar redes sociales';
      this.notificacionesService.mostrar('error', mensaje);
    } finally {
      this.guardandoRedes = false;
    }
  }

  cancelarCambiosRedes() {
    console.log('🔙 Cancelando cambios de redes');
    if (this.usuario) {
      this.llenarFormularios(this.usuario);
    }
    this.formRedes.markAsPristine();
    this.formRedes.markAsUntouched();
  }

  // Cambiar contraseña
  async cambiarPassword() {
    if (this.formPassword.invalid) {
      console.log('⚠️ Formulario de contraseña inválido');
      return;
    }

    this.guardandoPassword = true;
    const { passwordActual, passwordNuevo } = this.formPassword.value;

    console.log('🔐 Cambiando contraseña');

    try {
      await this.authService.cambiarPassword({
        passwordActual,
        passwordNuevo
      }).toPromise();

      this.notificacionesService.mostrar('exito', 'Contraseña actualizada correctamente');
      this.formPassword.reset();
      this.mostrarPasswordActual = false;
      this.mostrarPasswordNuevo = false;
      this.mostrarPasswordConfirmar = false;
    } catch (error: any) {
      console.error('❌ Error al cambiar contraseña:', error);
      const mensaje = error.error?.mensaje || 'Error al cambiar contraseña';
      this.notificacionesService.mostrar('error', mensaje);
    } finally {
      this.guardandoPassword = false;
    }
  }

  cancelarCambiosPassword() {
    console.log('🔙 Cancelando cambios de contraseña');
    this.formPassword.reset();
    this.mostrarPasswordActual = false;
    this.mostrarPasswordNuevo = false;
    this.mostrarPasswordConfirmar = false;
    this.formPassword.markAsPristine();
    this.formPassword.markAsUntouched();
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
    console.log('🚪 Cerrando configuración');
    this.router.navigate(['/app/mi-dia']);
  }
}
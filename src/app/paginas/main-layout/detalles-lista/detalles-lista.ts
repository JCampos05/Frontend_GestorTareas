import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ListasService } from '../../../core/services/listas/listas';
import { CompartirService, UsuarioCompartido, InfoCompartidos } from '../../../core/services/compartir/compartir';
import { TareasService, Tarea } from '../../../core/services/tareas/tareas';
import { ColumnasComponent } from '../../../componentes/principal/columna/columna';
import { ModalUsuariosListaComponent } from '../../../componentes/modales/modal-usuarios-lista/modal-usuarios-lista';
import { ModalAsignarTareaComponent } from '../../../componentes/modales/modal-asignar-tarea/modal-asignar-tarea'; // ✅ NUEVO

@Component({
  selector: 'app-detalle-lista',
  standalone: true,
  imports: [
    CommonModule,
    ColumnasComponent,
    ModalUsuariosListaComponent,
    ModalAsignarTareaComponent //  NUEVO
  ],
  templateUrl: './detalles-lista.html',
  styleUrl: './detalles-lista.css'
})
export class DetalleListaComponent implements OnInit, AfterViewInit {
  @ViewChild(ColumnasComponent) columnasComponent?: ColumnasComponent;

  nombreLista: string = '';
  descripcionLista: string = '';
  iconoLista: string = '';
  colorLista: string = '';
  idLista: number = 0;
  idUsuarioActual: number = 0;
  idCreadorLista: number = 0;

  usuariosCompartidos: UsuarioCompartido[] = [];
  esPropietario = false;
  esAdmin = false;
  compartible = false;
  modalUsuariosAbierto = false;

  infoCompartidos: InfoCompartidos | null = null;

  // ✅ NUEVAS propiedades para asignación
  modalAsignarAbierto = false;
  tareaSeleccionada: Tarea | null = null;

  constructor(
    private route: ActivatedRoute,
    private listasService: ListasService,
    private compartirService: CompartirService,
    private tareasService: TareasService
  ) {
    const authUsuario = localStorage.getItem('auth_usuario');
    if (authUsuario) {
      const usuarioData = JSON.parse(authUsuario);
      this.idUsuarioActual = usuarioData.idUsuario || 0;
    } else {
      console.error('⚠️ No se encontró auth_usuario en localStorage');
    }
  }

  ngAfterViewInit() {
    setTimeout(() => this.actualizarPermisosColumnas());
  }

  private actualizarPermisosColumnas() {
    if (this.columnasComponent) {
      this.columnasComponent.puedeEditar = this.puedeEditarTareas();
      this.columnasComponent.puedeEliminar = this.puedeEliminarTareas();
      this.columnasComponent.puedeAsignar = this.puedeAsignarTareas(); // ✅ NUEVO
    }
  }

  async ngOnInit() {
    this.route.params.subscribe(async params => {
      this.idLista = +params['id'];
      await this.cargarInfoLista();
      this.cargarInfoCompartidos();
    });
  }

  async cargarInfoLista() {
    try {
      const lista = await this.listasService.obtenerListaConTareas(this.idLista);

      if (lista) {
        this.nombreLista = lista.nombre || '';
        this.descripcionLista = lista.descripcion || '';
        this.iconoLista = lista.icono || '';
        this.colorLista = lista.color || '#0052CC';
      }
    } catch (error) {
      console.error('Error al cargar información de lista:', error);
    }
  }

  cargarInfoCompartidos() {
    this.compartirService.obtenerInfoCompartidosLista(this.idLista).subscribe({
      next: (infoCompartidos) => {
        this.infoCompartidos = infoCompartidos;

        if (infoCompartidos) {
          this.usuariosCompartidos = infoCompartidos.usuarios || [];
          this.compartible = !!infoCompartidos.lista?.claveCompartir;

          const usuarioCreador = this.usuariosCompartidos.find(u => u.esCreador);
          this.idCreadorLista = usuarioCreador?.idUsuario || 0;

          this.esPropietario = this.idCreadorLista === this.idUsuarioActual;

          const tuRol = infoCompartidos.lista?.tuRol;
          this.esAdmin = tuRol === 'admin' || this.esPropietario;
        }
      },
      error: (error) => {
        this.compartible = false;
        this.usuariosCompartidos = [];
        this.infoCompartidos = null;
        this.verificarPropietarioDirecto();
      }
    });
    setTimeout(() => this.actualizarPermisosColumnas(), 100);
  }

  async verificarPropietarioDirecto() {
    try {
      const lista = await this.listasService.obtenerLista(this.idLista);
      if (lista) {
        this.idCreadorLista = lista.idUsuario || 0;
        this.esPropietario = lista.idUsuario === this.idUsuarioActual;

        if (this.esPropietario) {
          this.esAdmin = true;
        }
      }
    } catch (error) {
      console.error('Error al verificar propietario:', error);
    }
  }

  puedeEditarTareas(): boolean {
    if (this.idCreadorLista === this.idUsuarioActual && this.idCreadorLista !== 0) {
      return true;
    }

    if (!this.infoCompartidos) {
      return false;
    }

    const tuRol = this.infoCompartidos.lista?.tuRol;

    const rolesConPermiso = ['admin', 'editor', 'colaborador'];
    const puedeEditar = rolesConPermiso.includes(tuRol || '');

    return puedeEditar;
  }

  puedeEliminarTareas(): boolean {
    if (this.idCreadorLista === this.idUsuarioActual && this.idCreadorLista !== 0) {
      return true;
    }

    if (!this.infoCompartidos) {
      return false;
    }

    const tuRol = this.infoCompartidos.lista?.tuRol;

    const puedeEliminar = ['admin', 'editor'].includes(tuRol || '');

    return puedeEliminar;
  }

  // ✅ NUEVO: Permiso para asignar tareas
  puedeAsignarTareas(): boolean {
    // Solo propietario y admin pueden asignar
    if (this.idCreadorLista === this.idUsuarioActual && this.idCreadorLista !== 0) {
      return true;
    }

    if (!this.infoCompartidos) {
      return false;
    }

    const tuRol = this.infoCompartidos.lista?.tuRol;
    return tuRol === 'admin';
  }

  puedeCompartir(): boolean {
    if (this.esPropietario) return true;

    if (!this.infoCompartidos) return false;

    const tuRol = this.infoCompartidos.usuarios.find(
      u => u.idUsuario === this.idUsuarioActual
    )?.rol;

    return tuRol === 'admin';
  }

  toggleTareaCompletada(tarea: any) {
    if (!this.puedeEditarTareas()) {
      alert('No tienes permisos para modificar tareas en esta lista. Tu rol es de solo lectura.');
      return;
    }

    const estadoAnterior = tarea.estado;
    const nuevoEstado = tarea.estado === 'C' ? 'P' : 'C';

    tarea.estado = nuevoEstado;

    this.tareasService.cambiarEstado(tarea.idTarea, nuevoEstado).subscribe({
      next: (response) => {
        // Éxito
      },
      error: (error) => {
        tarea.estado = estadoAnterior;

        if (error.status === 403) {
          const mensaje = error.error?.detalles || 'No tienes permisos para modificar tareas en esta lista';
          alert(mensaje);
        } else {
          alert('Error al actualizar el estado de la tarea');
        }
      }
    });
  }

  abrirModalAsignarTarea(tarea: Tarea) {
    console.log('📋 Abriendo modal de asignación para tarea:', tarea);
    this.tareaSeleccionada = tarea;
    this.modalAsignarAbierto = true;
  }

  abrirModalAsignar() {
    console.log('📋 Usuarios compartidos:', this.usuariosCompartidos.length);

    // Verificar que hay usuarios compartidos
    /*if (this.usuariosCompartidos.length <= 1) { // <= 1 porque el propietario también cuenta
      alert('Primero debes compartir la lista con otros usuarios para poder asignar tareas.');
      return;
    }*/

    // Abrir modal sin tarea específica
    this.tareaSeleccionada = null;
    this.modalAsignarAbierto = true;

    console.log('📋 Abriendo modal de asignación (sin tarea específica)');
  }

  cerrarModalAsignar() {
    this.modalAsignarAbierto = false;
    this.tareaSeleccionada = null;
  }

  async onTareaAsignada() {
    console.log('✅ Tarea asignada/desasignada exitosamente');

    // Cerrar el modal primero
    this.cerrarModalAsignar();

    // Recargar SOLO las tareas de la lista actual, sin cambiar de vista
    if (this.columnasComponent) {
      const idLista = this.idLista;

      if (idLista) {
        // Recargar tareas de esta lista específica
        await this.columnasComponent.cargarTareasDeLista(idLista);
      } else {
        // Recargar todas las tareas (para vista "Mis tareas")
        await this.columnasComponent.cargarTareas();
      }
    }
  }

  abrirModalUsuarios() {
    this.modalUsuariosAbierto = true;
  }

  cerrarModalUsuarios() {
    this.modalUsuariosAbierto = false;
  }

  async hacerCompartible() {
    if (!confirm('¿Deseas hacer esta lista compartible? Podrás invitar usuarios después.')) {
      return;
    }

    const datosActualizados = {
      nombre: this.nombreLista,
      descripcion: this.descripcionLista,
      icono: this.iconoLista,
      color: this.colorLista,
      compartible: true
    };

    try {
      await this.listasService.actualizarLista(this.idLista, datosActualizados);
      this.compartible = true;
      alert('Lista ahora es compartible. ¡Ya puedes gestionar usuarios!');
    } catch (error) {
      alert('Error al actualizar lista');
    }
  }

  onUsuariosActualizados() {
    this.cargarInfoCompartidos();
  }

  obtenerIniciales(nombre: string): string {
    if (!nombre) return '?';
    const palabras = nombre.trim().split(' ');
    if (palabras.length === 1) {
      return palabras[0].substring(0, 2).toUpperCase();
    }
    return (palabras[0][0] + palabras[palabras.length - 1][0]).toUpperCase();
  }

  esEmoji(icono: string | null | undefined): boolean {
    if (!icono || icono === 'null' || icono === '') return false;
    const iconoLimpio = icono.trim();
    return !iconoLimpio.startsWith('fa');
  }

  obtenerClaseIcono(icono: string | null | undefined): string {
    if (!icono || icono === 'null' || icono === '') {
      return 'fas fa-clipboard-list';
    }

    const iconoLimpio = icono.trim();

    if (iconoLimpio.startsWith('fas ') || iconoLimpio.startsWith('far ')) {
      return iconoLimpio;
    }

    if (iconoLimpio.startsWith('fa-')) {
      return `fas ${iconoLimpio}`;
    }

    return 'fas fa-clipboard-list';
  }
}
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ListasService } from '../../../core/services/listas/listas';
import { CompartirService, UsuarioCompartido, InfoCompartidos } from '../../../core/services/compartir/compartir';
import { TareasService } from '../../../core/services/tareas/tareas'; // ✅ AGREGAR
import { ColumnasComponent } from '../../../componentes/columna/columna';
import { ModalUsuariosListaComponent } from '../../../componentes/modal-usuarios-lista/modal-usuarios-lista';

@Component({
  selector: 'app-detalle-lista',
  standalone: true,
  imports: [CommonModule, ColumnasComponent, ModalUsuariosListaComponent],
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

  // Compartir
  usuariosCompartidos: UsuarioCompartido[] = [];
  esPropietario = false;
  esAdmin = false;
  compartible = false;
  modalUsuariosAbierto = false;

  // ✅ AGREGAR: Info completa de compartidos
  infoCompartidos: InfoCompartidos | null = null;

  constructor(
    private route: ActivatedRoute,
    private listasService: ListasService,
    private compartirService: CompartirService,
    private tareasService: TareasService // ✅ AGREGAR servicio
  ) {
    const authUsuario = localStorage.getItem('auth_usuario');
    if (authUsuario) {
      const usuarioData = JSON.parse(authUsuario);
      this.idUsuarioActual = usuarioData.idUsuario || 0;
      //console.log('👤 Usuario actual cargado:', this.idUsuarioActual);
    } else {
      console.error('❌ No se encontró auth_usuario en localStorage');
    }
  }
  ngAfterViewInit() {
    setTimeout(() => this.actualizarPermisosColumnas());
  }

  private actualizarPermisosColumnas() {
    if (this.columnasComponent) {
      this.columnasComponent.puedeEditar = this.puedeEditarTareas();
      this.columnasComponent.puedeEliminar = this.puedeEliminarTareas();
      //console.log('🔄 Permisos actualizados');
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
      //console.log('📦 DATOS COMPLETOS DE LA LISTA:', lista);

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
    //console.log('🔄 Cargando info de compartidos para lista:', this.idLista);

    this.compartirService.obtenerInfoCompartidosLista(this.idLista).subscribe({
      next: (infoCompartidos) => {
        //console.log('📋 INFO COMPARTIDOS RECIBIDO:', infoCompartidos);

        this.infoCompartidos = infoCompartidos;

        if (infoCompartidos) {
          this.usuariosCompartidos = infoCompartidos.usuarios || [];
          this.compartible = !!infoCompartidos.lista?.claveCompartir;

          // Buscar el creador en los usuarios
          const usuarioCreador = this.usuariosCompartidos.find(u => u.esCreador);
          this.idCreadorLista = usuarioCreador?.idUsuario || 0;

          // Verificar si eres el propietario
          this.esPropietario = this.idCreadorLista === this.idUsuarioActual;

          // Tu rol viene directo de tuRol
          const tuRol = infoCompartidos.lista?.tuRol;
          this.esAdmin = tuRol === 'admin' || this.esPropietario;

          //console.log('🔍 === ESTADO DESPUÉS DE CARGAR ===');
          /*console.log({
            idCreadorLista: this.idCreadorLista,
            idUsuarioActual: this.idUsuarioActual,
            esPropietario: this.esPropietario,
            esAdmin: this.esAdmin,
            tuRol: tuRol,
            compartible: this.compartible,
            totalUsuarios: this.usuariosCompartidos.length
          });*/
          //console.log('===================================');
        }
      },
      error: (error) => {
        //console.log('⚠️ No hay info de compartidos (lista no compartida):', error);
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

        // 🔧 FIX: Si eres propietario, también eres admin
        if (this.esPropietario) {
          this.esAdmin = true;
        }

        /*console.log('✅ Verificación directa:', {
          idCreadorLista: this.idCreadorLista,
          idUsuarioActual: this.idUsuarioActual,
          esPropietario: this.esPropietario,
          esAdmin: this.esAdmin
        });*/
      }
    } catch (error) {
      console.error('Error al verificar propietario:', error);
    }
  }

  puedeEditarTareas(): boolean {
    //console.log('🔍 === VERIFICANDO PERMISOS DE EDICIÓN ===');

    // 1️⃣ Verificar si eres propietario por ID directo
    if (this.idCreadorLista === this.idUsuarioActual && this.idCreadorLista !== 0) {
      //console.log('✅ Eres propietario (por ID), puedes editar');
      return true;
    }

    // 2️⃣ Si no hay info de compartidos, no puedes editar
    if (!this.infoCompartidos) {
      //console.log('❌ No hay info de compartidos y no eres propietario');
      return false;
    }

    // 3️⃣ Obtener tu rol desde la info de compartidos
    const tuRol = this.infoCompartidos.lista?.tuRol;

    /*console.log('📊 Debug completo:', {
      idCreadorLista: this.idCreadorLista,
      idUsuarioActual: this.idUsuarioActual,
      esPropietario: this.esPropietario,
      tuRol: tuRol,
      tieneInfoCompartidos: !!this.infoCompartidos
    });*/

    // 4️⃣ Verificar si el rol permite editar
    const rolesConPermiso = ['admin', 'editor', 'colaborador'];
    const puedeEditar = rolesConPermiso.includes(tuRol || '');

    //console.log(`${puedeEditar ? '✅' : '❌'} Rol "${tuRol}" ${puedeEditar ? 'SÍ' : 'NO'} puede editar`);
    //console.log('================================');

    return puedeEditar;
  }

  puedeEliminarTareas(): boolean {
    // 1️⃣ Verificar propietario directo
    if (this.idCreadorLista === this.idUsuarioActual && this.idCreadorLista !== 0) {
      //console.log('✅ Eres propietario, puedes eliminar');
      return true;
    }

    // 2️⃣ Si no hay info compartidos, no puedes eliminar
    if (!this.infoCompartidos) {
      //console.log('❌ No hay info compartidos, no puedes eliminar');
      return false;
    }

    // 3️⃣ Verificar rol desde tuRol
    const tuRol = this.infoCompartidos.lista?.tuRol;

    // Solo admin y editor pueden eliminar
    const puedeEliminar = ['admin', 'editor'].includes(tuRol || '');

    //console.log(`${puedeEliminar ? '✅' : '❌'} Rol "${tuRol}" ${puedeEliminar ? 'SÍ' : 'NO'} puede eliminar`);

    return puedeEliminar;
  }

  puedeCompartir(): boolean {
    if (this.esPropietario) return true;

    if (!this.infoCompartidos) return false;

    const tuRol = this.infoCompartidos.usuarios.find(
      u => u.idUsuario === this.idUsuarioActual
    )?.rol;

    // Solo admin puede compartir
    return tuRol === 'admin';
  }

  // ✅ MÉTODO CORREGIDO para cambiar estado de tarea
  toggleTareaCompletada(tarea: any) {
    // Verificar permisos ANTES de hacer cualquier cambio
    if (!this.puedeEditarTareas()) {
      //console.warn('⚠️ Usuario sin permisos para editar tareas');
      alert('No tienes permisos para modificar tareas en esta lista. Tu rol es de solo lectura.');
      return;
    }

    const estadoAnterior = tarea.estado;
    const nuevoEstado = tarea.estado === 'C' ? 'P' : 'C';

    // Optimistic update
    tarea.estado = nuevoEstado;

    this.tareasService.cambiarEstado(tarea.idTarea, nuevoEstado).subscribe({
      next: (response) => {
        //console.log('✅ Estado actualizado exitosamente');
      },
      error: (error) => {
        //console.error('❌ Error al cambiar estado:', error);

        // Revertir el cambio
        tarea.estado = estadoAnterior;

        // Mostrar mensaje según el error
        if (error.status === 403) {
          const mensaje = error.error?.detalles || 'No tienes permisos para modificar tareas en esta lista';
          alert(mensaje);
        } else {
          alert('Error al actualizar el estado de la tarea');
        }
      }
    });
  }

  abrirModalUsuarios() {
    //console.log('📂 Abriendo modal de usuarios');
    /*console.log('📊 Estado actual:', {
      compartible: this.compartible,
      esPropietario: this.esPropietario,
      esAdmin: this.esAdmin
    });*/
    this.modalUsuariosAbierto = true;
  }

  cerrarModalUsuarios() {
    //console.log('🔒 Cerrando modal de usuarios');
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
      //console.log('✅ Lista marcada como compartible');
      this.compartible = true;
      alert('Lista ahora es compartible. ¡Ya puedes gestionar usuarios!');
    } catch (error) {
      //console.error('❌ Error al hacer compartible:', error);
      alert('Error al actualizar lista');
    }
  }

  onUsuariosActualizados() {
    //console.log('🔄 Usuarios actualizados, recargando info...');
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
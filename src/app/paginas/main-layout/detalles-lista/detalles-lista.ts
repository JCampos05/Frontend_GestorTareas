import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ListasService } from '../../../core/services/listas/listas';
import { CompartirService, UsuarioCompartido, InfoCompartidos } from '../../../core/services/compartir/compartir';
import { TareasService, Tarea } from '../../../core/services/tareas/tareas';
import { ChatService } from '../../../core/services/chat/chat';
import { SocketService } from '../../../core/services/sockets/sockets';
import { ColumnasComponent } from '../../../componentes/principal/columna/columna';
import { ModalUsuariosListaComponent } from '../../../componentes/modales/modal-usuarios-lista/modal-usuarios-lista';
import { ModalAsignarTareaComponent } from '../../../componentes/modales/modal-asignar-tarea/modal-asignar-tarea';
import { ChatComponent } from '../../../componentes/chat/chat/chat';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-detalle-lista',
  standalone: true,
  imports: [
    CommonModule,
    ColumnasComponent,
    ModalUsuariosListaComponent,
    ModalAsignarTareaComponent,
    ChatComponent
  ],
  templateUrl: './detalles-lista.html',
  styleUrl: './detalles-lista.css'
})
export class DetalleListaComponent implements OnInit, AfterViewInit, OnDestroy {
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

  // Asignación de tareas
  modalAsignarAbierto = false;
  tareaSeleccionada: Tarea | null = null;

  // ⭐ NUEVO: Chat
  chatAbierto = false;
  mensajesNoLeidos = 0;
  usuarioActual: any;
  mostrarBotonChat = false; // Nueva propiedad para controlar visibilidad

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private listasService: ListasService,
    private compartirService: CompartirService,
    private tareasService: TareasService,
    private chatService: ChatService,
    private socketService: SocketService
  ) {
    const authUsuario = localStorage.getItem('auth_usuario');
    if (authUsuario) {
      const usuarioData = JSON.parse(authUsuario);
      this.idUsuarioActual = usuarioData.idUsuario || 0;
      this.usuarioActual = usuarioData;
    } else {
      console.error('⚠️ No se encontró auth_usuario en localStorage');
    }
  }

  ngAfterViewInit() {
    setTimeout(() => this.actualizarPermisosColumnas());
  }

  ngOnDestroy() {
    // Limpiar subscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private actualizarPermisosColumnas() {
    if (this.columnasComponent) {
      this.columnasComponent.puedeEditar = this.puedeEditarTareas();
      this.columnasComponent.puedeEliminar = this.puedeEliminarTareas();
      this.columnasComponent.puedeAsignar = this.puedeAsignarTareas();
    }
  }

  async ngOnInit() {
    console.log('🎯 DetalleListaComponent ngOnInit iniciando...');
    
    this.route.params.subscribe(async params => {
      this.idLista = +params['id'];
      console.log('🎯 ID Lista cargado:', this.idLista);
      
      await this.cargarInfoLista();
      this.cargarInfoCompartidos();
    });

    // ⭐ Conectar socket si no está conectado
    this.conectarSocket();

    // ⭐ Escuchar nuevos mensajes para actualizar contador
    this.suscribirseAMensajes();
    
    console.log('🎯 Mensajes no leídos inicial:', this.mensajesNoLeidos);
  }

  // ⭐ NUEVO: Conectar socket al iniciar
  private conectarSocket(): void {
    if (!this.socketService.isConnected) {
      const token = localStorage.getItem('token');
      if (token) {
        this.socketService.connect(token);
      }
    }
  }

  // ⭐ NUEVO: Suscribirse a nuevos mensajes
  private suscribirseAMensajes(): void {
    const messageSub = this.socketService.onMessage().subscribe(mensaje => {
      console.log('📨 Nuevo mensaje recibido en detalles-lista:', mensaje);
      
      // Si el mensaje es de esta lista y el chat está cerrado, actualizar contador
      if (mensaje.idLista === this.idLista && !this.chatAbierto && mensaje.idUsuario !== this.idUsuarioActual) {
        this.mensajesNoLeidos++;
        console.log('🔔 Mensajes no leídos actualizados:', this.mensajesNoLeidos);
      }
    });

    this.subscriptions.push(messageSub);
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
          
          console.log('👥 Usuarios compartidos cargados:', this.usuariosCompartidos.length);
          console.log('👥 Es compartible:', this.compartible);
          
          // ⭐ ACTUALIZAR: Determinar si mostrar botón de chat
          this.mostrarBotonChat = this.usuariosCompartidos.length > 1;
          console.log('👁️ Mostrar botón chat:', this.mostrarBotonChat);
          
          // Cargar mensajes no leídos DESPUÉS de cargar usuarios
          if (this.mostrarBotonChat) {
            setTimeout(() => {
              this.cargarMensajesNoLeidos();
            }, 500);
          }
        }
      },
      error: (error) => {
        this.compartible = false;
        this.usuariosCompartidos = [];
        this.infoCompartidos = null;
        this.mostrarBotonChat = false;
        this.verificarPropietarioDirecto();
      }
    });
    setTimeout(() => this.actualizarPermisosColumnas(), 100);
  }

  // ⭐ NUEVO: Cargar mensajes no leídos
  private cargarMensajesNoLeidos(): void {
    console.log('📊 Cargando mensajes no leídos para lista:', this.idLista);
    console.log('📊 Usuarios compartidos:', this.usuariosCompartidos.length);
    
    this.chatService.obtenerNoLeidos(this.idLista).subscribe({
      next: (data) => {
        console.log('📊 Respuesta de obtenerNoLeidos:', data);
        if (data && data.length > 0) {
          this.mensajesNoLeidos = data[0].mensajesNoLeidos || 0;
          console.log('✅ Mensajes no leídos cargados:', this.mensajesNoLeidos);
        } else {
          console.log('⚠️ No hay datos de mensajes no leídos');
          this.mensajesNoLeidos = 0;
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar mensajes no leídos:', error);
        this.mensajesNoLeidos = 0;
      }
    });
  }

  // ⭐ NUEVO: Toggle del chat
  toggleChat(): void {
    this.chatAbierto = !this.chatAbierto;

    // Si se abre el chat, marcar mensajes como leídos
    if (this.chatAbierto) {
      setTimeout(() => {
        this.mensajesNoLeidos = 0;
        this.chatService.marcarComoLeidos(this.idLista).subscribe();
      }, 1000);
    }
  }

  // ⭐ Obtener contador para mostrar en el badge
  getMensajesNoLeidosDisplay(): string {
    console.log('🔢 getMensajesNoLeidosDisplay() llamado:', this.mensajesNoLeidos);
    if (this.mensajesNoLeidos === 0) return '';
    if (this.mensajesNoLeidos > 99) return '99+';
    return this.mensajesNoLeidos.toString();
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
    return rolesConPermiso.includes(tuRol || '');
  }

  puedeEliminarTareas(): boolean {
    if (this.idCreadorLista === this.idUsuarioActual && this.idCreadorLista !== 0) {
      return true;
    }

    if (!this.infoCompartidos) {
      return false;
    }

    const tuRol = this.infoCompartidos.lista?.tuRol;
    return ['admin', 'editor'].includes(tuRol || '');
  }

  puedeAsignarTareas(): boolean {
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
    this.cerrarModalAsignar();

    if (this.columnasComponent) {
      const idLista = this.idLista;

      if (idLista) {
        await this.columnasComponent.cargarTareasDeLista(idLista);
      } else {
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
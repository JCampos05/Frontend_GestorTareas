import { Component, OnInit, OnDestroy, Input, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, take } from 'rxjs/operators';
import { SocketService, Mensaje, UsuarioOnline } from '../../../core/services/sockets/sockets';
import { ChatService } from '../../../core/services/chat/chat';
import { AuthService } from '../../../core/services/authentication/authentication';
import { NotificacionesService } from '../../../core/services/notification/notification';


@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() idLista!: number;
  @Input() usuarioActual: any;

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  mensajes: Mensaje[] = [];
  usuariosOnline: UsuarioOnline[] = [];
  usuariosEscribiendo: Set<number> = new Set();
  isConnected = false;
  isLoading = false;
  isSending = false;

  nuevoMensaje = '';
  private typingSubject = new Subject<string>();

  limite = 50;
  offset = 0;
  hasMoreMessages = true;

  private shouldScrollToBottom = true;
  private lastScrollHeight = 0;

  private subscriptions: Subscription[] = [];

  constructor(
    private socketService: SocketService,
    private chatService: ChatService,
    private authService: AuthService,
    private notificacionesService: NotificacionesService,
  ) { }

  ngOnInit(): void {
    //console.log('Chat Component Init - Lista:', this.idLista);

    if (!this.idLista) {
      //console.error('No se proporcionó idLista al componente de chat');
      return;
    }

    // Obtener usuario actual usando el servicio de auth
    if (!this.usuarioActual) {
      this.usuarioActual = this.authService.obtenerUsuarioActual();

      if (this.usuarioActual) {
        //console.log('Usuario actual cargado desde AuthService:', this.usuarioActual);
      } else {
        //console.error('No se encontró usuario autenticado');
        this.notificacionesService.error('No estás autenticado. Por favor, inicia sesión nuevamente.');
        //alert('No estás autenticado. Por favor, inicia sesión nuevamente.');
        return;
      }
    }

    this.inicializarChat();
    this.configurarTypingDebounce();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      // Desactivar después de scrollear para permitir navegación manual
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    //console.log('Chat Component Destroy');
    this.salirDelChat();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private inicializarChat(): void {
    const token = this.authService.obtenerToken();

    if (!token) {
      //console.error('No se encontró token de autenticación');
      //console.log('   Detalles de depuración:');
      //console.log('   - localStorage.token:', localStorage.getItem('token') ? 'Existe' : 'NO existe');
      //console.log('   - localStorage.auth_usuario:', localStorage.getItem('auth_usuario') ? 'Existe' : 'NO existe');
      //console.log('   - Contenido auth_usuario:', localStorage.getItem('auth_usuario'));
      this.notificacionesService.mostrar('advertencia','Datos actualizados correctamente');
      //alert('No estás autenticado. Por favor, cierra sesión e inicia sesión nuevamente.');
      return;
    }

    //console.log('Token encontrado, iniciando conexión...');
    //console.log('   Token (primeros 30 chars):', token.substring(0, 30) + '...');
    //console.log('   Token (últimos 10 chars): ...' + token.substring(token.length - 10));

    // Conectar socket si no está conectado
    if (!this.socketService.isConnected) {
      //console.log('Conectando socket...');
      this.socketService.connect(token);
    } else {
      //console.log('Socket ya está conectado');
    }

    // Configurar listeners de eventos
    this.configurarEventListeners();

    // Esperar conexión antes de unirse a la lista
    const connectSub = this.socketService.onConnect()
      .pipe(
        filter(connected => connected === true),
        take(1)
      )
      .subscribe(() => {
        //console.log('Socket conectado, uniéndose a lista', this.idLista);
        this.isConnected = true;

        // Pequeño delay para asegurar que el servidor está listo
        setTimeout(() => {
          this.socketService.joinList(this.idLista);
          this.cargarHistorial();
        }, 500);
      });

    this.subscriptions.push(connectSub);
  }

  private configurarEventListeners(): void {
    // Monitorear estado de conexión
    const connectSub = this.socketService.onConnect().subscribe(connected => {
      //console.log('Estado de conexión actualizado:', connected);
      this.isConnected = connected;

      if (!connected) {
        //console.warn('Conexión perdida, limpiando usuarios online');
        this.usuariosOnline = [];
      }
    });
    this.subscriptions.push(connectSub);

    // Nuevo mensaje
    const messageSub = this.socketService.onMessage().subscribe(mensaje => {
      //console.log('Nuevo mensaje recibido:', mensaje);
      this.agregarMensaje(mensaje);
      this.shouldScrollToBottom = this.isScrolledNearBottom();
    });
    this.subscriptions.push(messageSub);

    // Usuarios online
    const onlineSub = this.socketService.onUsersOnline().subscribe(usuarios => {
      //console.log('Usuarios online actualizados:', usuarios.length, usuarios);
      this.usuariosOnline = usuarios;
    });
    this.subscriptions.push(onlineSub);

    // Usuario se unió
    const joinedSub = this.socketService.onUserJoined().subscribe(usuario => {
      //console.log('Usuario se unió:', usuario.email);
    });
    this.subscriptions.push(joinedSub);

    // Usuario salió
    const leftSub = this.socketService.onUserLeft().subscribe(usuario => {
      //console.log('Usuario salió:', usuario.email);
    });
    this.subscriptions.push(leftSub);

    // Usuario escribiendo
    const typingSub = this.socketService.onTyping().subscribe(usuario => {
      if (usuario.idUsuario !== this.usuarioActual?.idUsuario) {
        this.usuariosEscribiendo.add(usuario.idUsuario);

        setTimeout(() => {
          this.usuariosEscribiendo.delete(usuario.idUsuario);
        }, 3000);
      }
    });
    this.subscriptions.push(typingSub);

    // Usuario dejó de escribir
    const typingStopSub = this.socketService.onTypingStop().subscribe(data => {
      this.usuariosEscribiendo.delete(data.idUsuario);
    });
    this.subscriptions.push(typingStopSub);

    // Mensaje editado
    const editedSub = this.socketService.onMessageEdited().subscribe(data => {
      const index = this.mensajes.findIndex(m => m.idMensaje === data.idMensaje);
      if (index !== -1) {
        this.mensajes[index] = {
          ...this.mensajes[index],
          contenido: data.contenido,
          editado: true,
          fechaEdicion: data.fechaEdicion
        };
      }
    });
    this.subscriptions.push(editedSub);

    // Mensaje eliminado
    const deletedSub = this.socketService.onMessageDeleted().subscribe(data => {
      this.mensajes = this.mensajes.filter(m => m.idMensaje !== data.idMensaje);
    });
    this.subscriptions.push(deletedSub);

    // Errores
    const errorSub = this.socketService.onError().subscribe(error => {
      //console.error('Error del socket:', error);
      this.notificacionesService.mostrar('error',`Error en el chat: ${error.message}`);
      //alert(`Error en el chat: ${error.message}`);
    });
    this.subscriptions.push(errorSub);

    // Join exitoso
    const joinSuccessSub = this.socketService.onJoinSuccess().subscribe(data => {
      //console.log('Unido exitosamente a la sala:', data);
    });
    this.subscriptions.push(joinSuccessSub);
  }

  cargarHistorial(): void {
    if (this.isLoading) return;

    this.isLoading = true;
    const currentScrollHeight = this.messagesContainer?.nativeElement.scrollHeight || 0;
    this.lastScrollHeight = currentScrollHeight;

    //console.log('Cargando historial de mensajes...');

    this.chatService.obtenerHistorial(this.idLista, this.limite, this.offset)
      .subscribe({
        next: (mensajes) => {
          //console.log('Historial cargado:', mensajes.length, 'mensajes');

          if (mensajes.length < this.limite) {
            this.hasMoreMessages = false;
          }

          this.mensajes = [...mensajes.reverse(), ...this.mensajes];
          this.offset += mensajes.length;

          this.isLoading = false;

          if (this.offset === mensajes.length) {
            this.shouldScrollToBottom = true;
          } else {
            this.shouldScrollToBottom = false;
            setTimeout(() => {
              const newScrollHeight = this.messagesContainer?.nativeElement.scrollHeight || 0;
              const scrollDiff = newScrollHeight - this.lastScrollHeight;
              this.messagesContainer.nativeElement.scrollTop = scrollDiff;
            }, 100);
          }
        },
        error: (error) => {
          //console.error('Error al cargar historial:', error);
          this.isLoading = false;
          this.notificacionesService.mostrar('error','Error al cargar mensajes. Intenta recargar la página.');
          //alert('Error al cargar mensajes. Intenta recargar la página.');
        }
      });
  }

  onScroll(event: Event): void {
    const element = event.target as HTMLElement;

    if (element.scrollTop === 0 && this.hasMoreMessages && !this.isLoading) {
      //console.log('Cargando más mensajes antiguos...');
      this.cargarHistorial();
    }
  }

  private agregarMensaje(mensaje: Mensaje): void {
    if (!this.mensajes.find(m => m.idMensaje === mensaje.idMensaje)) {
      this.mensajes.push(mensaje);
    }
  }

  private configurarTypingDebounce(): void {
    this.typingSubject
      .pipe(
        debounceTime(1000),
        distinctUntilChanged()
      )
      .subscribe(() => {
        if (this.idLista && this.isConnected) {
          this.socketService.stopTyping(this.idLista);
        }
      });
  }

  onInputChange(): void {
    if (this.nuevoMensaje.trim() && this.idLista && this.isConnected) {
      //console.log('Usuario empezó a escribir');
      this.socketService.startTyping(this.idLista);
      this.typingSubject.next(this.nuevoMensaje);
    } else if (this.idLista && this.isConnected && this.nuevoMensaje.length === 0) {
      //console.log('Usuario dejó de escribir');
      this.socketService.stopTyping(this.idLista);
    }
  }

  handleEnter(event: KeyboardEvent): void {
    if (event.shiftKey) {
      return;
    }

    event.preventDefault();
    this.enviarMensaje();
  }

  enviarMensaje(): void {
    const contenido = this.nuevoMensaje.trim();

    if (!contenido || this.isSending || !this.isConnected) {
      if (!this.isConnected) {
        console.error('No se puede enviar mensaje: socket no conectado');
        this.notificacionesService.mostrar('advertencia','No estás conectado al chat. Intenta recargar la página.');
        //alert('No estás conectado al chat. Intenta recargar la página.');
      }
      return;
    }

    //console.log('Enviando mensaje:', contenido.substring(0, 50) + '...');
    this.isSending = true;

    // Detener indicador ANTES de enviar
    this.socketService.stopTyping(this.idLista);

    this.socketService.sendMessage(this.idLista, contenido);
    this.nuevoMensaje = '';
    this.isSending = false;
    this.shouldScrollToBottom = true;
  }

  private isScrolledNearBottom(): boolean {
    if (!this.messagesContainer) return true;

    const element = this.messagesContainer.nativeElement;
    const threshold = 150;
    const position = element.scrollTop + element.clientHeight;
    const height = element.scrollHeight;

    return position >= height - threshold;
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      //console.error('Error al hacer scroll:', err);
    }
  }

  esMiMensaje(mensaje: Mensaje): boolean {
    return mensaje.idUsuario === this.usuarioActual?.idUsuario;
  }

  getNombresEscribiendo(): string {
    const nombres = Array.from(this.usuariosEscribiendo)
      .map(idUsuario => {
        const usuario = this.usuariosOnline.find(u => u.idUsuario === idUsuario);
        return usuario?.nombre || usuario?.email || 'Alguien';
      });

    if (nombres.length === 0) return '';
    if (nombres.length === 1) return `${nombres[0]} está escribiendo...`;
    if (nombres.length === 2) return `${nombres[0]} y ${nombres[1]} están escribiendo...`;
    return `${nombres[0]} y ${nombres.length - 1} más están escribiendo...`;
  }

  formatearFecha(fecha: Date | string): string {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    const ahora = new Date();
    const diff = ahora.getTime() - date.getTime();
    const minutos = Math.floor(diff / 60000);

    //mostrar hora hoy
    const esHoy = date.toDateString() === ahora.toDateString();

    if (minutos < 1) {
      return 'Ahora';
    }

    if (esHoy) {
      // Mostrar hora en formato 12h con AM/PM
      const horas = date.getHours();
      const mins = date.getMinutes();
      const ampm = horas >= 12 ? 'PM' : 'AM';
      const horas12 = horas % 12 || 12;
      const minsStr = mins.toString().padStart(2, '0');

      if (minutos < 60) {
        return `Hace ${minutos}m • ${horas12}:${minsStr} ${ampm}`;
      }

      return `${horas12}:${minsStr} ${ampm}`;
    }

    // Si es de ayer
    const ayer = new Date(ahora);
    ayer.setDate(ayer.getDate() - 1);
    const esAyer = date.toDateString() === ayer.toDateString();

    if (esAyer) {
      const horas = date.getHours();
      const mins = date.getMinutes();
      const ampm = horas >= 12 ? 'PM' : 'AM';
      const horas12 = horas % 12 || 12;
      const minsStr = mins.toString().padStart(2, '0');
      return `Ayer ${horas12}:${minsStr} ${ampm}`;
    }

    // Si es de esta semana (últimos 7 días)
    const dias = Math.floor(minutos / 1440);
    if (dias < 7) {
      const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const horas = date.getHours();
      const mins = date.getMinutes();
      const ampm = horas >= 12 ? 'PM' : 'AM';
      const horas12 = horas % 12 || 12;
      const minsStr = mins.toString().padStart(2, '0');
      return `${diasSemana[date.getDay()]} ${horas12}:${minsStr} ${ampm}`;
    }

    // Para fechas más antiguas
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private salirDelChat(): void {
    if (this.idLista && this.isConnected) {
      this.socketService.leaveList(this.idLista);
    }
  }

  marcarTodosLeidos(): void {
    if (this.idLista && this.isConnected) {
      this.socketService.markAllAsRead(this.idLista);
    }
  }

  trackByMensajeId(index: number, mensaje: Mensaje): number {
    return mensaje.idMensaje;
  }
}
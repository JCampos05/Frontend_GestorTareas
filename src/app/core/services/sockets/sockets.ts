import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export interface Mensaje {
  idMensaje: number;
  contenido: string;
  idUsuario: number;
  idLista: number;
  editado: boolean;
  fechaCreacion: Date | string;
  fechaEdicion?: Date | string | null;
  eliminado: boolean;
  nombreUsuario?: string;
  emailUsuario?: string;
  usuario?: UsuarioMensaje;
  totalLecturas?: number;
  leidoPorMi?: boolean;
}

export interface UsuarioMensaje {
  idUsuario: number;
  email: string;
  nombre?: string;
}

export interface UsuarioOnline {
  idUsuario: number;
  email: string;
  nombre?: string;
  ultimaActividad?: Date | string;
  conexionesActivas?: number;
}

export interface UsuarioEscribiendo {
  idUsuario: number;
  email: string;
  nombre?: string;
}

export interface EventoSocket {
  event: string;
  message: string;
}

export interface RespuestaJoinList {
  idLista: number;
  room: string;
  usuariosOnline: number;
}

export interface MensajeEditado {
  idMensaje: number;
  contenido: string;
  editado: boolean;
  fechaEdicion: Date | string;
}

export interface MensajeEliminado {
  idMensaje: number;
  idUsuario: number;
}

export interface MensajeLeido {
  idMensaje: number;
  idUsuario: number;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  // URL del backend 
  private readonly API_URL = 'http://localhost:3000';
  
  private socket: Socket | null = null;
  
  private connected$ = new BehaviorSubject<boolean>(false);
  private messages$ = new Subject<Mensaje>();
  private messageEdited$ = new Subject<MensajeEditado>();
  private messageDeleted$ = new Subject<MensajeEliminado>();
  private messageRead$ = new Subject<MensajeLeido>();
  private userJoined$ = new Subject<UsuarioOnline>();
  private userLeft$ = new Subject<UsuarioOnline>();
  private usersOnline$ = new BehaviorSubject<UsuarioOnline[]>([]);
  private typing$ = new Subject<UsuarioEscribiendo>();
  private typingStop$ = new Subject<{ idUsuario: number }>();
  private errors$ = new Subject<EventoSocket>();
  private joinSuccess$ = new Subject<RespuestaJoinList>();

  private currentListId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10; 

  constructor() {
    //console.log('SocketService inicializado');
  }

  connect(token: string): void {
    if (this.socket?.connected) {
      //console.log('Socket ya está conectado');
      return;
    }

    //console.log('Intentando conectar a Socket.IO...');
    //console.log(`   URL: ${this.API_URL}/chat`);

    this.socket = io(`${this.API_URL}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'], // Priorizar websocket
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000 // Timeout de 20 segundos
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket conectado exitosamente!');
      console.log(`Socket ID: ${this.socket?.id}`);
      this.connected$.next(true);
      this.reconnectAttempts = 0;

      // Reconectar a la lista si estábamos en una
      if (this.currentListId) {
        console.log(`Reconectando a lista ${this.currentListId}`);
        this.joinList(this.currentListId);
      }
    });

    // Desconexión
    this.socket.on('disconnect', (reason) => {
      console.log('Socket desconectado:', reason);
      this.connected$.next(false);
      
      if (reason === 'io server disconnect') {
        console.log('Servidor desconectó el socket, reconectando manualmente...');
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Error de conexión al socket:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Máximo de intentos de reconexión alcanzado');
        this.errors$.next({
          event: 'connect_error',
          message: 'No se pudo conectar al servidor de chat después de varios intentos'
        });
      } else {
        //console.log(`Intento de reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      }
    });

    // Eventos de sala
    this.socket.on('join:success', (data: RespuestaJoinList) => {
      //console.log('Unido exitosamente a la lista:', data);
      this.currentListId = data.idLista;
      this.joinSuccess$.next(data);
    });

    this.socket.on('users:online', (data: { usuarios: UsuarioOnline[] }) => {
      //console.log('Usuarios online actualizados:', data.usuarios.length);
      this.usersOnline$.next(data.usuarios);
    });

    this.socket.on('user:joined', (data: UsuarioOnline) => {
      //console.log('Usuario se unió:', data.email);
      this.userJoined$.next(data);
      
      const currentUsers = this.usersOnline$.value;
      if (!currentUsers.find(u => u.idUsuario === data.idUsuario)) {
        this.usersOnline$.next([...currentUsers, data]);
      }
    });

    this.socket.on('user:left', (data: UsuarioOnline) => {
      //console.log('Usuario salió:', data.email);
      this.userLeft$.next(data);
      
      const currentUsers = this.usersOnline$.value;
      this.usersOnline$.next(
        currentUsers.filter(u => u.idUsuario !== data.idUsuario)
      );
    });

    // Eventos de mensajes
    this.socket.on('message:new', (data: Mensaje) => {
      //console.log('Nuevo mensaje recibido:', data);
      this.messages$.next(data);
    });

    this.socket.on('message:edited', (data: MensajeEditado) => {
      //console.log('Mensaje editado:', data);
      this.messageEdited$.next(data);
    });

    this.socket.on('message:deleted', (data: MensajeEliminado) => {
      //console.log('Mensaje eliminado:', data);
      this.messageDeleted$.next(data);
    });

    this.socket.on('message:read', (data: MensajeLeido) => {
      //console.log('Mensaje leído:', data);
      this.messageRead$.next(data);
    });

    // Eventos de estado
    this.socket.on('typing:user', (data: UsuarioEscribiendo) => {
      this.typing$.next(data);
    });

    this.socket.on('typing:stop', (data: { idUsuario: number }) => {
      this.typingStop$.next(data);
    });

    // Eventos de error
    this.socket.on('error', (error: EventoSocket) => {
      //console.error('Error del servidor:', error);
      this.errors$.next(error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      //console.log('Desconectando socket...');
      this.socket.disconnect();
      this.socket = null;
      this.connected$.next(false);
      this.currentListId = null;
      this.usersOnline$.next([]);
    }
  }

  joinList(idLista: number): void {
    if (!this.socket) {
      //console.error('Socket no conectado, no se puede unir a lista');
      return;
    }

    if (!this.socket.connected) {
      //console.error('Socket no está conectado, esperando conexión...');
      
      // Esperar a que se conecte
      const checkConnection = setInterval(() => {
        if (this.socket?.connected) {
          clearInterval(checkConnection);
          //console.log('Socket conectado, intentando unirse a lista...');
          this.socket.emit('join:list', { idLista });
        }
      }, 500);

      // Timeout de 10 segundos
      setTimeout(() => {
        clearInterval(checkConnection);
        if (!this.socket?.connected) {
          //console.error('Timeout al esperar conexión del socket');
        }
      }, 10000);
      
      return;
    }

    //console.log(`Uniéndose a lista ${idLista}...`);
    this.socket.emit('join:list', { idLista });
  }

  leaveList(idLista: number): void {
    if (!this.socket) return;

    //console.log(`Saliendo de lista ${idLista}`);
    this.socket.emit('leave:list', { idLista });
    
    if (this.currentListId === idLista) {
      this.currentListId = null;
      this.usersOnline$.next([]);
    }
  }

  sendMessage(idLista: number, contenido: string): void {
    if (!this.socket) {
      //console.error('Socket no conectado');
      return;
    }

    if (!contenido.trim()) {
      //console.warn('Mensaje vacío, no se envía');
      return;
    }

    //console.log(`Enviando mensaje a lista ${idLista}:`, contenido.substring(0, 50));
    this.socket.emit('message:send', { idLista, contenido: contenido.trim() });
  }

  editMessage(idMensaje: number, contenido: string): void {
    if (!this.socket) return;
    this.socket.emit('message:edit', { idMensaje, contenido: contenido.trim() });
  }

  deleteMessage(idMensaje: number, idLista: number): void {
    if (!this.socket) return;
    this.socket.emit('message:delete', { idMensaje, idLista });
  }

  markAsRead(idMensaje: number, idLista: number): void {
    if (!this.socket) return;
    this.socket.emit('message:read', { idMensaje, idLista });
  }

  markAllAsRead(idLista: number): void {
    if (!this.socket) return;
    this.socket.emit('messages:read_all', { idLista });
  }

  startTyping(idLista: number): void {
    if (!this.socket) return;
    this.socket.emit('typing:start', { idLista });
  }

  stopTyping(idLista: number): void {
    if (!this.socket) return;
    this.socket.emit('typing:stop', { idLista });
  }

  getOnlineUsers(idLista: number): void {
    if (!this.socket) return;
    this.socket.emit('get:online_users', { idLista });
  }

  getStatistics(idLista: number): void {
    if (!this.socket) return;
    this.socket.emit('get:statistics', { idLista });
  }

  // ========== OBSERVABLES ==========

  onConnect(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  onMessage(): Observable<Mensaje> {
    return this.messages$.asObservable();
  }

  onMessageEdited(): Observable<MensajeEditado> {
    return this.messageEdited$.asObservable();
  }

  onMessageDeleted(): Observable<MensajeEliminado> {
    return this.messageDeleted$.asObservable();
  }

  onMessageRead(): Observable<MensajeLeido> {
    return this.messageRead$.asObservable();
  }

  onUserJoined(): Observable<UsuarioOnline> {
    return this.userJoined$.asObservable();
  }

  onUserLeft(): Observable<UsuarioOnline> {
    return this.userLeft$.asObservable();
  }

  onUsersOnline(): Observable<UsuarioOnline[]> {
    return this.usersOnline$.asObservable();
  }

  onTyping(): Observable<UsuarioEscribiendo> {
    return this.typing$.asObservable();
  }

  onTypingStop(): Observable<{ idUsuario: number }> {
    return this.typingStop$.asObservable();
  }

  onError(): Observable<EventoSocket> {
    return this.errors$.asObservable();
  }

  onJoinSuccess(): Observable<RespuestaJoinList> {
    return this.joinSuccess$.asObservable();
  }

  // ========== GETTERS ==========

  get isConnected(): boolean {
    return this.connected$.value;
  }

  get currentList(): number | null {
    return this.currentListId;
  }

  getUsersOnlineSync(): UsuarioOnline[] {
    return this.usersOnline$.value;
  }
}
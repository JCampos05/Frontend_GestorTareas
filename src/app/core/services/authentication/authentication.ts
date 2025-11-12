import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Usuario {
  idUsuario: number;
  nombre: string;
  email: string;
}

export interface AuthResponse {
  mensaje: string;
  token: string;
  usuario: Usuario;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  apellido?: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/usuarios';
  private tokenKey = 'auth_token';
  private usuarioKey = 'auth_usuario';
  
  private usuarioActualSubject = new BehaviorSubject<Usuario | null>(this.obtenerUsuarioAlmacenado());
  public usuarioActual$ = this.usuarioActualSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Registro de usuario
  registrar(datos: RegisterRequest): Observable<AuthResponse> {
    // Tu backend espera solo: nombre, email, password
    // Combinamos nombre y apellido si existe
    const nombreCompleto = datos.apellido 
      ? `${datos.nombre} ${datos.apellido}` 
      : datos.nombre;

    const body = {
      nombre: nombreCompleto,
      email: datos.email,
      password: datos.password
    };

    return this.http.post<AuthResponse>(`${this.apiUrl}/registrar`, body)
      .pipe(
        tap(response => {
          this.guardarSesion(response.token, response.usuario);
        })
      );
  }

  // Login de usuario
  login(datos: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, datos)
      .pipe(
        tap(response => {
          this.guardarSesion(response.token, response.usuario);
        })
      );
  }

  // Obtener perfil del usuario
  obtenerPerfil(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/perfil`, {
      headers: this.obtenerHeaders()
    });
  }

  // Verificar si existen usuarios en la BD
  verificarUsuarios(): Observable<{ existenUsuarios: boolean }> {
    return this.http.get<{ existenUsuarios: boolean }>(`${this.apiUrl}/verificar`);
  }

  // Guardar sesión
  private guardarSesion(token: string, usuario: Usuario): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.usuarioKey, JSON.stringify(usuario));
    this.usuarioActualSubject.next(usuario);
  }

  // Obtener token
  obtenerToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Obtener usuario almacenado
  private obtenerUsuarioAlmacenado(): Usuario | null {
    const usuarioStr = localStorage.getItem(this.usuarioKey);
    return usuarioStr ? JSON.parse(usuarioStr) : null;
  }

  // Obtener usuario actual
  obtenerUsuarioActual(): Usuario | null {
    return this.usuarioActualSubject.value;
  }

  // Verificar si está autenticado
  estaAutenticado(): boolean {
    return !!this.obtenerToken();
  }

  // Cerrar sesión
  cerrarSesion(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.usuarioKey);
    this.usuarioActualSubject.next(null);
  }

  // Obtener headers con token
  private obtenerHeaders(): HttpHeaders {
    const token = this.obtenerToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
}
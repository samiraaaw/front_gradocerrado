import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private API_URL = 'http://localhost:5183/api'; // URL fija para tu backend local
  private readonly SESSION_STORAGE_KEY = 'grado_cerrado_session';
  private currentSession: any = null;

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  constructor(private http: HttpClient) {
    this.loadSessionFromStorage();
    console.log('ApiService inicializado con URL:', this.API_URL);
  }

  // REGISTRO DE USUARIO - Backend real con PostgreSQL
  registerUser(userData: { name: string, email: string }): Observable<any> {
    const url = `${this.API_URL}/auth/register`;
    
    console.log('Enviando registro a:', url, userData);
    
    return this.http.post<any>(url, userData, this.httpOptions)
      .pipe(
        map((response: any) => {
          console.log('Usuario registrado exitosamente:', response);
          return response;
        }),
        catchError((error: any) => {
          console.error('Error al registrar usuario:', error);
          throw error;
        })
      );
  }

  // LOGIN DE USUARIO - Backend real con PostgreSQL
  loginUser(loginData: { email: string, password: string }): Observable<any> {
    const url = `${this.API_URL}/auth/login`;
    
    console.log('Enviando login a:', url, { email: loginData.email });
    
    return this.http.post<any>(url, loginData, this.httpOptions)
      .pipe(
        map((response: any) => {
          console.log('Login exitoso:', response);
          return response;
        }),
        catchError((error: any) => {
          console.error('Error en login:', error);
          throw error;
        })
      );
  }

  // VERIFICAR ESTADO DE LA BASE DE DATOS
  checkDatabaseStatus(): Observable<any> {
    const url = `${this.API_URL}/Database/status`;
    
    return this.http.get<any>(url, this.httpOptions)
      .pipe(
        map((response: any) => {
          console.log('Estado de la base de datos:', response);
          return response;
        }),
        catchError((error: any) => {
          console.error('Error verificando base de datos:', error);
          throw error;
        })
      );
  }

  // MÉTODOS DE SESIÓN (mantener los existentes)
  startStudySession(sessionData: any): Observable<any> {
    const url = `${this.API_URL}/Study/start-session`;
    
    const requestData = {
      studentId: sessionData.studentId || "00000000-0000-0000-0000-000000000001",
      difficulty: sessionData.difficulty || "basico",
      legalAreas: sessionData.legalAreas || ["Derecho Civil"]
    };
    
    console.log('Enviando datos al backend:', requestData);
    
    return this.http.post<any>(url, requestData, this.httpOptions)
      .pipe(
        map((response: any) => {
          console.log('Sesión iniciada exitosamente:', response);
          this.setCurrentSession(response);
          return response;
        }),
        catchError((error: any) => {
          console.error('Error al iniciar sesión:', error);
          throw error;
        })
      );
  }

  getCurrentSession(): any {
    return this.currentSession;
  }

  setCurrentSession(session: any): void {
    this.currentSession = session;
    this.saveSessionToStorage(session);
  }

  updateCurrentQuestionIndex(index: number): void {
    if (this.currentSession) {
      this.currentSession.currentQuestionIndex = index;
      this.saveSessionToStorage(this.currentSession);
    }
  }

  clearCurrentSession(): void {
    this.currentSession = null;
    localStorage.removeItem(this.SESSION_STORAGE_KEY);
  }

  // MÉTODOS PRIVADOS DE STORAGE
  private saveSessionToStorage(session: any): void {
    try {
      localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Error guardando sesión:', error);
    }
  }

  private loadSessionFromStorage(): void {
    try {
      const storedSession = localStorage.getItem(this.SESSION_STORAGE_KEY);
      if (storedSession) {
        this.currentSession = JSON.parse(storedSession);
      }
    } catch (error) {
      console.error('Error cargando sesión:', error);
      this.clearCurrentSession();
    }
  }

  // TEST DE CONEXIÓN
  checkConnection(): Observable<boolean> {
    const url = `${this.API_URL}/Database/status`;
    
    return this.http.get(url)
      .pipe(
        map(() => true),
        catchError(() => of(false))
      );
  }
}
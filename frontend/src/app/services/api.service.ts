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

  // ✅ REGISTRO DE USUARIO CORREGIDO - Ahora incluye password
  registerUser(userData: { name: string, email: string, password: string }): Observable<any> {
    const url = `${this.API_URL}/auth/register`;
    
    // Validar que todos los campos requeridos estén presentes
    if (!userData.name || !userData.email || !userData.password) {
      console.error('Datos incompletos para registro:', userData);
      throw new Error('Faltan datos requeridos: name, email y password');
    }
    
    console.log('Enviando registro a:', url, { 
      name: userData.name, 
      email: userData.email, 
      password: userData.password ? '***' : 'undefined' 
    });
    
    return this.http.post<any>(url, userData, this.httpOptions)
      .pipe(
        map((response: any) => {
          console.log('Usuario registrado exitosamente:', response);
          return response;
        }),
        catchError((error: any) => {
          console.error('Error al registrar usuario:', error);
          
          // Mejorar el manejo de errores específicos
          let errorMessage = 'Error al registrar usuario';
          
          if (error.status === 400 && error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.status === 0) {
            errorMessage = 'No se puede conectar al servidor. Verifica que el backend esté funcionando.';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          throw { ...error, friendlyMessage: errorMessage };
        })
      );
  }

  // ✅ LOGIN DE USUARIO MEJORADO
  loginUser(loginData: { email: string, password: string }): Observable<any> {
    const url = `${this.API_URL}/auth/login`;
    
    console.log('Enviando login a:', url, { email: loginData.email });
    
    return this.http.post<any>(url, loginData, this.httpOptions)
      .pipe(
        map((response: any) => {
          console.log('Login exitoso:', response);
          
          // Guardar usuario en localStorage si el login es exitoso
          if (response.success && response.user) {
            localStorage.setItem('currentUser', JSON.stringify(response.user));
          }
          
          return response;
        }),
        catchError((error: any) => {
          console.error('Error en login:', error);
          
          let errorMessage = 'Error al iniciar sesión';
          
          if (error.status === 400 && error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.status === 0) {
            errorMessage = 'No se puede conectar al servidor. Verifica que el backend esté funcionando.';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          throw { ...error, friendlyMessage: errorMessage };
        })
      );
  }

  // ✅ VERIFICAR ESTADO DE LA BASE DE DATOS
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

  // ✅ CREAR TABLAS DE BASE DE DATOS (por si es necesario)
  createDatabaseTables(): Observable<any> {
    const url = `${this.API_URL}/Database/create-tables`;
    
    return this.http.post<any>(url, {}, this.httpOptions)
      .pipe(
        map((response: any) => {
          console.log('Tablas creadas:', response);
          return response;
        }),
        catchError((error: any) => {
          console.error('Error creando tablas:', error);
          throw error;
        })
      );
  }

  // ✅ USUARIOS REGISTRADOS (para debugging)
  getRegisteredUsers(): Observable<any> {
    const url = `${this.API_URL}/Study/registered-users`;
    
    return this.http.get<any>(url, this.httpOptions)
      .pipe(
        map((response: any) => {
          console.log('Usuarios registrados:', response);
          return response;
        }),
        catchError((error: any) => {
          console.error('Error obteniendo usuarios:', error);
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

  // ✅ CERRAR SESIÓN
  logout(): void {
    localStorage.removeItem('currentUser');
    this.clearCurrentSession();
  }

  // ✅ OBTENER USUARIO ACTUAL
  getCurrentUser(): any {
    try {
      const userString = localStorage.getItem('currentUser');
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      return null;
    }
  }

  // ✅ VERIFICAR SI ESTÁ LOGUEADO
  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null;
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

  // ✅ TEST DE CONEXIÓN MEJORADO
  checkConnection(): Observable<boolean> {
    const url = `${this.API_URL}/status`; // Endpoint más simple para test
    
    return this.http.get(url)
      .pipe(
        map(() => {
          console.log('✅ Conexión al backend exitosa');
          return true;
        }),
        catchError((error) => {
          console.error('❌ Error de conexión al backend:', error);
          return of(false);
        })
      );
  }

  // ✅ TEST COMPLETO DEL SISTEMA
  testFullSystem(): Observable<any> {
    console.log('🧪 Iniciando test completo del sistema...');
    
    return new Observable(observer => {
      // Test 1: Conexión básica
      this.checkConnection().subscribe({
        next: (connected) => {
          if (!connected) {
            observer.error('❌ Backend no disponible');
            return;
          }
          
          console.log('✅ Test 1: Conexión OK');
          
          // Test 2: Estado de la base de datos
          this.checkDatabaseStatus().subscribe({
            next: (dbStatus) => {
              console.log('✅ Test 2: Base de datos OK', dbStatus);
              
              observer.next({
                connection: true,
                database: dbStatus,
                message: 'Sistema completamente operativo'
              });
              observer.complete();
            },
            error: (dbError) => {
              console.log('⚠️ Test 2: Problema con base de datos', dbError);
              observer.next({
                connection: true,
                database: false,
                databaseError: dbError,
                message: 'Backend conectado pero hay problemas con la base de datos'
              });
              observer.complete();
            }
          });
        },
        error: (error) => {
          observer.error('❌ No se puede conectar al backend');
        }
      });
    });
  }

  
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// ========================================
// INTERFACES 
// ========================================

export interface SubmitAnswerRequest {
  testId: number;
  preguntaId: number;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  timeSpent: string; 
  numeroOrden: number;
  isCorrect: boolean;
}

export interface SubmitAnswerResponse {
  success: boolean;
  isCorrect: boolean;
  respuestaId: number;
  explanation: string;
  correctAnswer: string;
}

export interface StudyFrequencyConfig {
  frecuenciaSemanal: number;
  objetivoDias: 'flexible' | 'estricto' | 'personalizado';
  diasPreferidos: number[];
  recordatorioActivo: boolean;
  horaRecordatorio: string;
}

export interface StudyFrequencyResponse {
  success: boolean;
  data: {
    estudianteId: number;
    frecuenciaSemanal: number;
    objetivoDias: string;
    diasPreferidos: number[];
    recordatorioActivo: boolean;
    horaRecordatorio: string;
  };
}

export interface CumplimientoResponse {
  success: boolean;
  data: {
    objetivoSemanal: number;
    diasEstudiadosSemana: number;
    porcentajeCumplimiento: number;
    rachaActual: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private API_URL = 'http://localhost:5183/api';
  private readonly SESSION_STORAGE_KEY = 'grado_cerrado_session';
  
  // ✅ NUEVO: BehaviorSubject para manejar la sesión actual
  private currentSession$ = new BehaviorSubject<any>(null);
  
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

  // ========================================
  // AUTENTICACIÓN
  // ========================================

  registerUser(userData: { name: string, email: string, password: string }): Observable<any> {
    const url = `${this.API_URL}/auth/register`;
    
    if (!userData.name || !userData.email || !userData.password) {
      console.error('Datos incompletos para registro:', userData);
      throw new Error('Faltan datos requeridos: name, email y password');
    }
    
    console.log('Enviando registro a:', url, { 
      name: userData.name, 
      email: userData.email, 
      password: '***'
    });
    
    return this.http.post<any>(url, userData, this.httpOptions)
      .pipe(
        map((response: any) => {
          console.log('Usuario registrado exitosamente:', response);
          return response;
        }),
        catchError((error: any) => {
          console.error('Error al registrar usuario:', error);
          
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

  loginUser(loginData: { email: string, password: string }): Observable<any> {
    const url = `${this.API_URL}/auth/login`;
    
    console.log('Enviando login a:', url, { email: loginData.email });
    
    return this.http.post<any>(url, loginData, this.httpOptions)
      .pipe(
        map((response: any) => {
          console.log('Login exitoso:', response);
          
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

  logout(): void {
    localStorage.removeItem('currentUser');
    this.clearCurrentSession();
  }

  getCurrentUser(): any {
    try {
      const userString = localStorage.getItem('currentUser');
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      return null;
    }
  }

  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null;
  }

  // ========================================
  // SESIONES DE ESTUDIO
  // ========================================

  /**
   * ✅ ACTUALIZADO: Iniciar sesión ESCRITA con soporte de modo adaptativo
   */
  startStudySession(config: {
    studentId: number;
    difficulty: string;
    legalAreas: string[];
    questionCount?: number;
    adaptiveMode?: boolean;
  }): Observable<any> {
    const url = `${this.API_URL}/Study/start-session`;
    
    const currentUser = this.getCurrentUser();
    
    // ✅ Obtener configuración de modo adaptativo del localStorage
    const adaptiveConfig = localStorage.getItem(`adaptive_mode_${currentUser?.id}`);
    let adaptiveEnabled = false;
    
    if (adaptiveConfig) {
      try {
        const parsed = JSON.parse(adaptiveConfig);
        adaptiveEnabled = parsed.enabled || false;
      } catch (error) {
        console.error('Error parseando adaptive config:', error);
      }
    }
    
    // Si se pasa explícitamente en config, usar ese valor
    if (config.adaptiveMode !== undefined) {
      adaptiveEnabled = config.adaptiveMode;
    }
    
    console.log('🎯 Modo adaptativo:', adaptiveEnabled);
    
    const requestBody = {
      studentId: config.studentId,
      difficulty: config.difficulty || "basico",
      legalAreas: config.legalAreas || [],
      questionCount: config.questionCount || 5,
      adaptiveMode: adaptiveEnabled // ✅ INCLUIR modo adaptativo
    };
    
    console.log('📚 Iniciando sesión ESCRITA:', requestBody);
    
    return this.http.post<any>(url, requestBody, this.httpOptions)
      .pipe(
        tap(response => {
          if (response.success) {
            console.log('✅ Sesión iniciada:', response);
            console.log('🎯 Modo adaptativo activo:', response.adaptiveEnabled);
            
            // Guardar la sesión actual
            this.currentSession$.next(response);
            this.saveSessionToStorage(response);
          }
        }),
        catchError(error => {
          console.error('❌ Error iniciando sesión:', error);
          throw error;
        })
      );
  }

  /**
   * ✅ Iniciar sesión ORAL
   */
  startOralStudySession(sessionData: any): Observable<any> {
    const url = `${this.API_URL}/Study/start-oral-session`;
    
    const requestData = {
      studentId: sessionData.studentId || 1,
      difficulty: sessionData.difficulty || "intermedio",
      legalAreas: sessionData.legalAreas || ["Derecho Civil"],
      questionCount: sessionData.questionCount || 5
    };
    
    console.log('🎤 Iniciando sesión ORAL:', requestData);
    
    return this.http.post<any>(url, requestData, this.httpOptions)
      .pipe(
        tap(response => {
          if (response.success) {
            console.log('✅ Sesión ORAL iniciada:', response);
            
            if (response.questions && response.questions.length > 0) {
              console.log('📋 Tipo de preguntas recibidas:', response.questions[0].type);
            }
            
            this.currentSession$.next(response);
            this.saveSessionToStorage(response);
          }
        }),
        catchError(error => {
          console.error('❌ Error iniciando sesión ORAL:', error);
          throw error;
        })
      );
  }

  getCurrentSession(): any {
    return this.currentSession$.value;
  }

  setCurrentSession(session: any): void {
    this.currentSession$.next(session);
    this.saveSessionToStorage(session);
  }

  updateCurrentQuestionIndex(index: number): void {
    const currentSession = this.currentSession$.value;
    if (currentSession) {
      currentSession.currentQuestionIndex = index;
      this.currentSession$.next(currentSession);
      this.saveSessionToStorage(currentSession);
    }
  }

  clearCurrentSession(): void {
    this.currentSession$.next(null);
    localStorage.removeItem(this.SESSION_STORAGE_KEY);
  }

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
        const session = JSON.parse(storedSession);
        this.currentSession$.next(session);
      }
    } catch (error) {
      console.error('Error cargando sesión:', error);
      this.clearCurrentSession();
    }
  }

  // ========================================
  // RESPUESTAS
  // ========================================

  submitAnswer(answerData: SubmitAnswerRequest): Observable<SubmitAnswerResponse> {
    const url = `${this.API_URL}/Study/submit-answer`;
    
    console.log('📤 Enviando respuesta al backend:', answerData);
    
    return this.http.post<SubmitAnswerResponse>(url, answerData, this.httpOptions)
      .pipe(
        map((response: SubmitAnswerResponse) => {
          console.log('✅ Respuesta guardada:', response);
          return response;
        }),
        catchError((error: any) => {
          console.error('❌ Error enviando respuesta:', error);
          
          let errorMessage = 'Error al guardar la respuesta';
          
          if (error.status === 0) {
            errorMessage = 'No se puede conectar al servidor';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          throw { ...error, friendlyMessage: errorMessage };
        })
      );
  }

  evaluateOralAnswer(evaluationData: {
    testId: number;
    preguntaGeneradaId: number;
    numeroOrden: number;
    transcription: string;
  }): Observable<any> {
    const url = `${this.API_URL}/Speech/evaluate-oral-answer`;
    
    console.log('📊 Evaluando respuesta oral:', evaluationData);
    
    return this.http.post<any>(url, evaluationData, this.httpOptions)
      .pipe(
        map((response: any) => {
          console.log('✅ Evaluación recibida:', response);
          return response;
        }),
        catchError((error: any) => {
          console.error('❌ Error evaluando respuesta:', error);
          throw error;
        })
      );
  }

  // ========================================
  // MODO ADAPTATIVO
  // ========================================

  /**
   * ✅ NUEVO: Obtener temas débiles del estudiante
   */
  getWeakTopics(studentId: number): Observable<any> {
    const url = `${this.API_URL}/Study/weak-topics/${studentId}`;
    
    console.log('📊 Obteniendo temas débiles para estudiante:', studentId);
    
    return this.http.get<any>(url, this.httpOptions)
      .pipe(
        map((response: any) => {
          console.log('✅ Temas débiles obtenidos:', response);
          return response;
        }),
        catchError((error: any) => {
          console.error('❌ Error obteniendo temas débiles:', error);
          
          // Retornar array vacío en caso de error
          return of({
            success: true,
            data: [],
            totalWeakTopics: 0
          });
        })
      );
  }

  /**
   * ✅ NUEVO: Obtener configuración de modo adaptativo desde BD
   */
  getAdaptiveModeConfig(studentId: number): Observable<any> {
    const url = `${this.API_URL}/Study/adaptive-mode/${studentId}`;
    
    console.log('📊 Obteniendo configuración adaptativa para estudiante:', studentId);
    
    return this.http.get<any>(url, this.httpOptions)
      .pipe(
        map((response: any) => {
          console.log('✅ Configuración adaptativa obtenida:', response);
          return response;
        }),
        catchError((error: any) => {
          console.error('❌ Error obteniendo configuración adaptativa:', error);
          
          return of({
            success: true,
            data: {
              studentId: studentId,
              adaptiveModeEnabled: false
            }
          });
        })
      );
  }

  /**
   * ✅ NUEVO: Actualizar configuración de modo adaptativo en BD
   */
  updateAdaptiveModeConfig(studentId: number, enabled: boolean): Observable<any> {
    const url = `${this.API_URL}/Study/adaptive-mode/${studentId}`;
    
    console.log('💾 Actualizando modo adaptativo:', { studentId, enabled });
    
    return this.http.put<any>(url, { enabled }, this.httpOptions)
      .pipe(
        map((response: any) => {
          console.log('✅ Modo adaptativo actualizado en BD:', response);
          return response;
        }),
        catchError((error: any) => {
          console.error('❌ Error actualizando modo adaptativo:', error);
          
          let errorMessage = 'Error al guardar la configuración';
          
          if (error.status === 0) {
            errorMessage = 'No se puede conectar al servidor';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          throw { ...error, friendlyMessage: errorMessage };
        })
      );
  }

  // ========================================
  // DASHBOARD Y ESTADÍSTICAS
  // ========================================

  getDashboardStats(studentId: number): Observable<any> {
    const url = `${this.API_URL}/Dashboard/stats/${studentId}`;
    
    return this.http.get<any>(url, this.httpOptions)
      .pipe(
        map((response: any) => {
          console.log('Estadísticas del dashboard:', response);
          return response;
        }),
        catchError((error: any) => {
          console.error('Error obteniendo estadísticas:', error);
          throw error;
        })
      );
  }

  getRecentSessions(studentId: number, limit: number = 10): Observable<any> {
    const url = `${this.API_URL}/Dashboard/recent-sessions/${studentId}?limit=${limit}`;
    
    return this.http.get<any>(url, this.httpOptions)
      .pipe(
        map((response: any) => {
          console.log('Sesiones recientes:', response);
          return response;
        }),
        catchError((error: any) => {
          console.error('Error obteniendo sesiones:', error);
          throw error;
        })
      );
  }

  getAreaStats(studentId: number): Observable<any> {
    const url = `${this.API_URL}/Dashboard/area-stats/${studentId}`;
    
    return this.http.get<any>(url, this.httpOptions)
      .pipe(
        map((response: any) => {
          console.log('Estadísticas por área:', response);
          return response;
        }),
        catchError((error: any) => {
          console.error('Error obteniendo stats por área:', error);
          throw error;
        })
      );
  }

  getAreaStatsWithTemas(studentId: number): Observable<any> {
    const url = `${this.API_URL}/Dashboard/area-stats-with-temas/${studentId}`;
    
    return this.http.get<any>(url, this.httpOptions)
      .pipe(
        map((response: any) => {
          console.log('Estadísticas por área con temas:', response);
          return response;
        }),
        catchError((error: any) => {
          console.error('Error obteniendo stats por área con temas:', error);
          throw error;
        })
      );
  }

  getSubtemaStats(studentId: number): Observable<any> {
    const url = `${this.API_URL}/Dashboard/subtema-stats/${studentId}`;
    
    return this.http.get<any>(url, this.httpOptions)
      .pipe(
        map((response: any) => {
          console.log('Estadísticas por subtema:', response);
          return response;
        }),
        catchError((error: any) => {
          console.error('Error obteniendo stats por subtema:', error);
          throw error;
        })
      );
  }

  getHierarchicalStats(studentId: number): Observable<any> {
    const url = `${this.API_URL}/Dashboard/hierarchical-stats/${studentId}`;
    return this.http.get<any>(url, this.httpOptions).pipe(
      map((response: any) => {
        console.log('Estadísticas jerárquicas:', response);
        return response;
      }),
      catchError((error: any) => {
        console.error('Error obteniendo stats jerárquicas:', error);
        throw error;
      })
    );
  }

  getWeeklyProgress(studentId: number): Observable<any> {
    const url = `${this.API_URL}/Dashboard/weekly-progress/${studentId}`;
    return this.http.get(url, this.httpOptions);
  }

  // ========================================
  // DEBILIDADES (WEAKNESS)
  // ========================================

  getTopTemasDebiles(studentId: number): Observable<any> {
    const url = `${this.API_URL}/Weakness/top-debiles/${studentId}`;
    
    return this.http.get<any>(url, this.httpOptions)
      .pipe(
        map((response: any) => {
          console.log('Top temas débiles:', response);
          return response;
        }),
        catchError((error: any) => {
          console.error('Error obteniendo temas débiles:', error);
          throw error;
        })
      );
  }

  getResumenDebilidades(studentId: number): Observable<any> {
    const url = `${this.API_URL}/Weakness/resumen/${studentId}`;
    
    return this.http.get<any>(url, this.httpOptions)
      .pipe(
        map((response: any) => {
          console.log('Resumen debilidades:', response);
          return response;
        }),
        catchError((error: any) => {
          console.error('Error obteniendo resumen:', error);
          throw error;
        })
      );
  }

  // ========================================
  // FRECUENCIA DE ESTUDIO
  // ========================================

  getStudyFrequency(studentId: number): Observable<StudyFrequencyResponse> {
    const url = `${this.API_URL}/StudyFrequency/${studentId}`;
    
    return this.http.get<StudyFrequencyResponse>(url, this.httpOptions)
      .pipe(
        map((response: StudyFrequencyResponse) => {
          console.log('✅ Frecuencia obtenida:', response);
          return response;
        }),
        catchError((error: any) => {
          console.error('❌ Error obteniendo frecuencia:', error);
          
          return of({
            success: true,
            data: {
              estudianteId: studentId,
              frecuenciaSemanal: 3,
              objetivoDias: 'flexible',
              diasPreferidos: [],
              recordatorioActivo: true,
              horaRecordatorio: '19:00'
            }
          } as StudyFrequencyResponse);
        })
      );
  }

  updateStudyFrequency(studentId: number, config: StudyFrequencyConfig): Observable<any> {
    const url = `${this.API_URL}/StudyFrequency/${studentId}`;
    
    console.log('📤 Actualizando frecuencia:', config);
    
    return this.http.put(url, config, this.httpOptions)
      .pipe(
        map((response: any) => {
          console.log('✅ Frecuencia actualizada:', response);
          return response;
        }),
        catchError((error: any) => {
          console.error('❌ Error actualizando frecuencia:', error);
          
          let errorMessage = 'Error al guardar la configuración';
          
          if (error.status === 0) {
            errorMessage = 'No se puede conectar al servidor';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          throw { ...error, friendlyMessage: errorMessage };
        })
      );
  }

  getStudyFrequencyCumplimiento(studentId: number): Observable<CumplimientoResponse> {
    const url = `${this.API_URL}/StudyFrequency/${studentId}/cumplimiento`;
    
    return this.http.get<CumplimientoResponse>(url, this.httpOptions)
      .pipe(
        map((response: CumplimientoResponse) => {
          console.log('✅ Cumplimiento obtenido:', response);
          return response;
        }),
        catchError((error: any) => {
          console.error('❌ Error obteniendo cumplimiento:', error);
          
          return of({
            success: true,
            data: {
              objetivoSemanal: 3,
              diasEstudiadosSemana: 0,
              porcentajeCumplimiento: 0,
              rachaActual: 0
            }
          } as CumplimientoResponse);
        })
      );
  }

  // ========================================
  // UTILIDADES Y DEBUG
  // ========================================

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

  checkConnection(): Observable<boolean> {
    const url = `${this.API_URL}/status`;
    
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

  testFullSystem(): Observable<any> {
    console.log('🧪 Iniciando test completo del sistema...');
    
    return new Observable(observer => {
      this.checkConnection().subscribe({
        next: (connected) => {
          if (!connected) {
            observer.error('❌ Backend no disponible');
            return;
          }
          
          console.log('✅ Test 1: Conexión OK');
          
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
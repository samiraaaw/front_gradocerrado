import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AudioService, AudioRecordingState } from 'src/app/services/audio';
import { ApiService } from '../../../../services/api.service';

interface Question {
  id: string;
  text: string;
  questionText: string;
  type: number;
  category: string;
  legalArea: string;
  difficulty: number;
  correctAnswer: string;
  explanation: string;
  userAnswer?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-test-oral-civil',
  templateUrl: './test-oral-civil.page.html',
  styleUrls: ['./test-oral-civil.page.scss'],
  standalone: false
})
export class TestOralCivilPage implements OnInit, OnDestroy {

  // Variables de estado del test
  questions: Question[] = [];
  currentQuestionNumber: number = 1;
  totalQuestions: number = 5;
  userAnswers: { [questionId: string]: string } = {};
  
  // Variables de audio
  isPlaying: boolean = false;
  audioCompleted: boolean = false;
  audioProgress: string = '00:02';
  currentAudio: HTMLAudioElement | null = null;
  
  // Variables de grabación
  isRecording: boolean = false;
  hasRecording: boolean = false;
  recordingTime: string = '00:00';
  recordingDuration: number = 0;
  audioBlob: Blob | null = null;
  audioUrl: string | null = null;
  isPlayingRecording: boolean = false;
  recordingAudio: HTMLAudioElement | null = null;

    // 🆕 AGREGAR ESTAS DOS VARIABLES
  private questionStartTime: number = 0;  
  // Subscription al estado de grabación
  private recordingStateSubscription: Subscription | null = null;

    // 🎓 TIMERS PARA SIMULAR INTERROGATORIO REAL
  // ⚠️ CAMBIAR DE private A public PARA QUE EL TEMPLATE PUEDA ACCEDERLOS
  public questionReadyTime: number = 0;        // Cuando termina de reproducirse la pregunta
  public responseStartTime: number = 0;        // Cuando empieza a grabar
  public questionResponseTime: number = 0;     // Tiempo total de respuesta
  
  
  // Variables auxiliares para UI
  private responseTimer: any;
  public elapsedResponseTime: string = '00:00'; // Para mostrar en pantalla
  
  
  // Variables del backend
  private sessionId: string = '';
  private currentSession: any = null;
  isLoading: boolean = true;
  loadingError: boolean = false;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private audioService: AudioService,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    this.sessionId = 'session_' + Date.now();
    
    // Cargar preguntas desde el backend
    await this.loadQuestionsFromBackend();
    
    if (!this.audioService.isRecordingSupported()) {
      await this.showUnsupportedAlert();
      return;
    }
    
    const initialized = await this.audioService.initializeRecording();
    if (!initialized) {
      await this.showMicrophoneErrorAlert();
      return;
    }
    
    this.recordingStateSubscription = this.audioService.recordingState$.subscribe(
      (state: AudioRecordingState) => {
        this.isRecording = state.isRecording;
        this.recordingDuration = state.recordingDuration;
        this.audioBlob = state.audioBlob;
        this.audioUrl = state.audioUrl;
        this.hasRecording = state.audioBlob !== null && state.audioBlob.size > 0;
        
        if (this.isRecording || this.hasRecording) {
          this.recordingTime = this.audioService.formatDuration(state.recordingDuration);
        }
        
        console.log('Estado de grabacion actualizado:', {
          isRecording: this.isRecording,
          hasRecording: this.hasRecording,
          duration: this.recordingTime,
          audioBlobSize: this.audioBlob?.size,
          audioUrl: this.audioUrl
        });
        
        this.cdr.detectChanges();
      }
    );
  }

async loadQuestionsFromBackend() {
  try {
    console.log('Cargando preguntas desde el backend...');
    this.isLoading = true;
    
    setTimeout(async () => { // ⚠️ Hacer async
      this.currentSession = this.apiService.getCurrentSession();
      console.log('Sesión obtenida del ApiService:', this.currentSession);
      
      if (!this.currentSession) {
        console.error('No hay sesión activa');
        this.loadingError = true;
        this.isLoading = false;
        return;
      }

      try {
        this.sessionId = String(this.currentSession?.testId || this.currentSession?.session?.testId || '');
        this.totalQuestions = this.currentSession?.totalQuestions || 5;
        
        const backendQuestions = this.currentSession?.questions || [];
        this.questions = this.convertBackendQuestions(backendQuestions);
        console.log('Preguntas convertidas exitosamente:', this.questions.length);
        
        if (this.questions.length === 0) {
          console.error('No se cargaron preguntas');
          this.loadingError = true;
          this.isLoading = false;
          return;
        }
        
        this.isLoading = false;
        
        // Iniciar timer para primera pregunta
        this.questionStartTime = Date.now();
        console.log('⏱️ Timer iniciado para primera pregunta');
        
        // 🆕 REPRODUCIR AUTOMÁTICAMENTE LA PRIMERA PREGUNTA
        setTimeout(() => {
          this.playAudio();
          console.log('🔊 Reproduciendo automáticamente la primera pregunta');
        }, 500); // Pequeño delay para que se cargue todo
        
        console.log('Carga de sesión completada exitosamente');
        
      } catch (conversionError) {
        console.error('Error en conversión de preguntas:', conversionError);
        this.loadingError = true;
        this.isLoading = false;
      }
    }, 100);
    
  } catch (error) {
    console.error('Error en loadQuestionsFromBackend:', error);
    this.loadingError = true;
    this.isLoading = false;
  }
}
  // CONVERTIR PREGUNTAS (igual que civil-escrito)
  convertBackendQuestions(backendQuestions: any[]): Question[] {
    console.log('Convirtiendo preguntas del backend, cantidad:', backendQuestions?.length || 0);
    
    if (!Array.isArray(backendQuestions)) {
      console.error('backendQuestions no es un array:', backendQuestions);
      return [];
    }
    
    return backendQuestions.map((q: any, index: number) => {
      console.log(`Procesando pregunta ${index + 1}:`, q);
      
      const convertedQuestion: Question = {
        id: q.id || `temp-${index}`,
        text: q.questionText || q.text || q.enunciado || 'Texto no disponible',
        questionText: q.questionText || q.text || q.enunciado || 'Texto no disponible',
        type: q.type || 1,
        category: q.category || q.legalArea || 'Sin categoría',
        legalArea: q.legalArea || q.category || 'General',
        difficulty: q.difficulty || 3,
        correctAnswer: q.correctAnswer || 'A',
        explanation: q.explanation || 'Explicación no disponible'
      };

      try {
        Object.keys(q || {}).forEach(key => {
          if (!(key in convertedQuestion)) {
            (convertedQuestion as any)[key] = q[key];
          }
        });
      } catch (error) {
        console.warn('Error copiando propiedades adicionales:', error);
      }

      return convertedQuestion;
    });
  }

  ngOnDestroy() {
    this.stopResponseTimer();
    
    if (this.recordingStateSubscription) {
      this.recordingStateSubscription.unsubscribe();
    }
    
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    
    if (this.recordingAudio) {
      this.recordingAudio.pause();
      this.recordingAudio = null;
    }
    
    this.audioService.stopMediaStreams();
  }

  // ========================================
  // GESTIÓN DE PREGUNTAS
  // ========================================
  
  getCurrentQuestion(): Question | null {
    return this.questions[this.currentQuestionNumber - 1] || null;
  }

  getCurrentQuestionText(): string {
    const question = this.getCurrentQuestion();
    return question ? question.text : '';
  }

  // ========================================
// MÉTODOS HELPER PARA EL TEMPLATE
// ========================================

/**
 * Determina si debe mostrar advertencia de tiempo
 * @returns true si el tiempo excede el límite (2 minutos)
 */
getTimerWarning(): boolean {
  if (this.questionReadyTime === 0) return false;
  
  const elapsed = Math.floor((Date.now() - this.questionReadyTime) / 1000);
  return elapsed > 120; // Advertir después de 2 minutos
}

/**
 * Obtiene un mensaje según el tiempo transcurrido
 * @returns Mensaje de estado del tiempo
 */
getTimerMessage(): string {
  if (this.questionReadyTime === 0) return '';
  
  const elapsed = Math.floor((Date.now() - this.questionReadyTime) / 1000);
  
  if (elapsed < 30) {
    return '⚡ Buen ritmo';
  } else if (elapsed < 60) {
    return '👍 Tiempo razonable';
  } else if (elapsed < 120) {
    return '⏰ Considera finalizar pronto';
  } else {
    return '⚠️ Tiempo extenso';
  }
}

  getProgress(): number {
    return (this.currentQuestionNumber / this.totalQuestions) * 100;
  }

  // ========================================
  // CONTROL DE AUDIO - REPRODUCCIÓN DE PREGUNTA
  // ========================================
  
  toggleAudio() {
    if (this.isPlaying) {
      this.pauseAudio();
    } else {
      this.playAudio();
    }
  }

  playAudio() {
    const questionText = this.getCurrentQuestionText();
    console.log('🎙️ Reproduciendo pregunta:', questionText);
    
    this.isPlaying = true;
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(questionText);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;
      
      // 🎓 CUANDO TERMINA LA PREGUNTA = INICIA EL INTERROGATORIO
      utterance.onend = () => {
        this.isPlaying = false;
        this.audioCompleted = true;
        this.audioProgress = 'Completado';
        
        // ⏱️ AQUÍ EMPIEZA EL TIEMPO DEL ESTUDIANTE
        this.questionReadyTime = Date.now();
        this.startResponseTimer(); // Mostrar contador en pantalla
        
        console.log('⏱️ INTERROGATORIO INICIADO - El estudiante puede empezar a pensar/responder');
        console.log('⏱️ Hora de inicio:', new Date(this.questionReadyTime).toLocaleTimeString());
        
        this.cdr.detectChanges();
      };
      
      utterance.onerror = () => {
        this.isPlaying = false;
        console.error('Error al reproducir audio');
        this.cdr.detectChanges();
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback si no hay speech synthesis
      setTimeout(() => {
        this.isPlaying = false;
        this.audioCompleted = true;
        this.audioProgress = 'Completado';
        
        this.questionReadyTime = Date.now();
        this.startResponseTimer();
        
        console.log('⏱️ INTERROGATORIO INICIADO (fallback)');
        this.cdr.detectChanges();
      }, 3000);
    }
  }

    stopResponseTimer() {
    if (this.responseTimer) {
      clearInterval(this.responseTimer);
      this.responseTimer = null;
    }
  }

  // ========================================
  // CONTADOR VISUAL (OPCIONAL PERO RECOMENDADO)
  // ========================================
  startResponseTimer() {
    // Limpiar timer anterior si existe
    if (this.responseTimer) {
      clearInterval(this.responseTimer);
    }
    
    // Actualizar cada segundo para mostrar al usuario
    this.responseTimer = setInterval(() => {
      if (this.questionReadyTime > 0) {
        const elapsed = Math.floor((Date.now() - this.questionReadyTime) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        this.elapsedResponseTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        this.cdr.detectChanges();
      }
    }, 1000);
  }


  pauseAudio() {
    console.log('Pausando audio');
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    this.isPlaying = false;
    this.cdr.detectChanges();
  }

  getAudioIcon(): string {
    if (this.isPlaying) return 'pause';
    if (this.audioCompleted) return 'checkmark';
    return 'play';
  }

getAudioStatus(): string {
  if (this.isPlaying) return 'Reproduciendo pregunta...';
  if (this.audioCompleted) return 'Reproducir nuevamente';
  return 'Escuchando pregunta...'; // Cambiar el texto por defecto
}


  // ========================================
  // CONTROL DE GRABACIÓN
  // ========================================
  
  toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  startRecording() {
    console.log('🎤 Iniciando grabación de respuesta');
    
    // Registrar primera interacción (opcional, para análisis)
    if (this.responseStartTime === 0 && this.questionReadyTime > 0) {
      this.responseStartTime = Date.now();
      const thinkingTime = Math.round((this.responseStartTime - this.questionReadyTime) / 1000);
      console.log(`💭 Tiempo de pensamiento: ${thinkingTime} segundos`);
    }
    
    this.audioService.startRecording();
  }

  stopRecording() {
    console.log('Deteniendo grabacion');
    this.audioService.stopRecording();
  }

  restartRecording() {
    console.log('Reiniciando grabacion');
    this.audioService.clearRecording();
    this.recordingTime = '00:00';
    this.hasRecording = false;
    
    setTimeout(() => {
      this.startRecording();
    }, 300);
  }

  replayRecording() {
    if (!this.audioUrl) {
      console.warn('No hay audio para reproducir');
      return;
    }
    
    console.log('Reproduciendo grabacion');
    
    if (this.isPlayingRecording && this.recordingAudio) {
      this.recordingAudio.pause();
      this.isPlayingRecording = false;
      console.log('Grabacion pausada');
      this.cdr.detectChanges();
      return;
    }
    
    if (!this.recordingAudio || this.recordingAudio.src !== this.audioUrl) {
      this.recordingAudio = new Audio(this.audioUrl);
      
      this.recordingAudio.onended = () => {
        this.isPlayingRecording = false;
        console.log('Reproduccion completada');
        this.cdr.detectChanges();
      };
      
      this.recordingAudio.onerror = (error) => {
        this.isPlayingRecording = false;
        console.error('Error al reproducir:', error);
        this.cdr.detectChanges();
      };
    }
    
    this.recordingAudio.play()
      .then(() => {
        this.isPlayingRecording = true;
        console.log('Reproduciendo grabacion...');
        this.cdr.detectChanges();
      })
      .catch(error => {
        console.error('Error al reproducir audio:', error);
        this.isPlayingRecording = false;
        this.cdr.detectChanges();
      });
  }

  getRecordingIcon(): string {
    if (this.isRecording) return 'stop';
    if (this.hasRecording) return 'checkmark';
    return 'mic';
  }

  getRecordingStatus(): string {
    if (this.isRecording) return 'Grabando... Habla ahora';
    if (this.hasRecording) return 'Grabacion completada';
    return 'Toca para grabar tu respuesta';
  }
  
  getReplayButtonText(): string {
    return this.isPlayingRecording ? 'Pausar' : 'Reproducir';
  }

  // ENVIAR RESPUESTA - FIN DEL INTERROGATORIO
  // ========================================
async submitVoiceAnswer() {
  if (!this.hasRecording || !this.audioBlob) {
    const alert = await this.alertController.create({
      header: 'Sin grabación',
      message: 'Por favor, graba tu respuesta antes de enviar.',
      buttons: ['OK']
    });
    await alert.present();
    return;
  }
  
  const question = this.getCurrentQuestion();
  if (!question) return;

  if (this.questionReadyTime > 0) {
    const now = Date.now();
    this.questionResponseTime = Math.round((now - this.questionReadyTime) / 1000);
    
    const thinkingTime = this.responseStartTime > 0 
      ? Math.round((this.responseStartTime - this.questionReadyTime) / 1000)
      : 0;
    
    console.log('===== ANÁLISIS DEL INTERROGATORIO =====');
    console.log(`Tiempo TOTAL de respuesta: ${this.questionResponseTime}s`);
    console.log(`  • Tiempo pensando: ${thinkingTime}s`);
    console.log('========================================');
  } else {
    this.questionResponseTime = 0;
  }
  
  this.stopResponseTimer();
  
  try {
    const loading = await this.loadingController.create({
      message: 'Procesando tu respuesta...',
      spinner: 'crescent'
    });
    await loading.present();
    
    // 1. TRANSCRIBIR AUDIO
    const response = await this.audioService.uploadAudio(
      this.audioBlob,
      question.id,
      this.sessionId,
      this.currentQuestionNumber,
      this.questionResponseTime
    );
    
    console.log('Transcripción recibida:', response);
    
    // 2. EVALUAR RESPUESTA
    let isCorrect = false;
    let confidence = 0;
    let feedback = '';
    let correctAnswerText = '';
    let explanation = '';
    
    if (response.success && response.transcription) {
      loading.message = 'Evaluando tu respuesta...';
      
      try {
        const evaluation = await this.apiService.evaluateOralAnswer({
          testId: parseInt(this.sessionId),
          preguntaGeneradaId: parseInt(question.id),
          numeroOrden: this.currentQuestionNumber,
          transcription: response.transcription
        }).toPromise();
        
        console.log('Evaluación recibida:', evaluation);
        
        isCorrect = evaluation.isCorrect;
        confidence = evaluation.confidence;
        feedback = evaluation.feedback;
        correctAnswerText = evaluation.correctAnswer;
        explanation = evaluation.explanation || '';
        
      } catch (evalError) {
        console.error('Error al evaluar respuesta:', evalError);
        isCorrect = false;
        confidence = 0;
        feedback = 'No se pudo evaluar la respuesta automáticamente.';
        explanation = '';
      }
    }
    
    await loading.dismiss();
    
    // 3. GUARDAR RESPUESTA
    this.userAnswers[question.id] = JSON.stringify({
      type: 'voice',
      transcription: response.transcription || 'Texto no disponible',
      audioId: response.audioId || 'voice_' + this.currentQuestionNumber,
      timestamp: new Date().toISOString(),
      responseTime: this.questionResponseTime,
      recordingDuration: this.recordingDuration,
      size: this.audioBlob.size,
      confidence: confidence,
      isCorrect: isCorrect,
      feedback: feedback,
      correctAnswer: correctAnswerText,
      explanation: explanation
    });
    
    this.questionReadyTime = 0;
    this.responseStartTime = 0;
    this.questionResponseTime = 0;
    this.elapsedResponseTime = '00:00';
    
    this.audioService.clearRecording();
    
    if (this.recordingAudio) {
      this.recordingAudio.pause();
      this.recordingAudio = null;
      this.isPlayingRecording = false;
    }
    
    // 4. MOSTRAR RESULTADO CON RETROALIMENTACIÓN DETALLADA
    await this.showDetailedFeedback(
      isCorrect, 
      response.transcription, 
      correctAnswerText, 
      explanation,
      confidence
    );
    
    // Continuar después de cerrar el alert
    setTimeout(() => {
      this.nextQuestion();
    }, 500);
    
  } catch (error: any) {
    console.error('Error al enviar respuesta:', error);
    
    this.stopResponseTimer();
    
    const loading = await this.loadingController.getTop();
    if (loading) {
      await loading.dismiss();
    }
    
    const alert = await this.alertController.create({
      header: 'Error',
      message: error.message || 'Hubo un problema al procesar tu respuesta.',
      buttons: ['OK']
    });
    await alert.present();
  }
}

// NUEVO MÉTODO: Mostrar retroalimentación detallada
async showDetailedFeedback(
  isCorrect: boolean,
  userAnswer: string,
  correctAnswer: string,
  explanation: string,
  confidence: number
) {
  const header = isCorrect ? '✅ ¡Correcto!' : '❌ Incorrecto';

  let message = `Tu respuesta:\n"${userAnswer || 'Sin transcripción'}"\n\n`;
  
  if (!isCorrect) {
    message += `Respuesta correcta:\n${correctAnswer}\n\n`;
  }
  
  if (explanation && explanation !== 'No hay explicación disponible.') {
    message += `Explicación:\n${explanation}`;
  }

  const alert = await this.alertController.create({
    header: header,
    message: message,
    cssClass: isCorrect ? 'oral-alert-correct' : 'oral-alert-incorrect',
    buttons: [
      {
        text: 'Continuar',
        role: 'confirm'
      }
    ]
  });

  await alert.present();
  await alert.onDidDismiss();
}
  // ========================================
  // NAVEGACIÓN
  // ========================================
  
  canGoToNext(): boolean {
    return this.hasRecording || this.hasAnsweredCurrentQuestion();
  }

  hasAnsweredCurrentQuestion(): boolean {
    const questionId = this.getCurrentQuestion()?.id;
    return questionId ? !!this.userAnswers[questionId] : false;
  }

  isLastQuestion(): boolean {
    return this.currentQuestionNumber === this.totalQuestions;
  }

  nextQuestion() {
    if (!this.canGoToNext()) return;
    
    if (this.isLastQuestion()) {
      this.completeTest();
    } else {
      this.currentQuestionNumber++;
      this.resetQuestionState();
    }
  }

  previousQuestion() {
    if (this.currentQuestionNumber > 1) {
      this.currentQuestionNumber--;
      this.resetQuestionState();
    }
  }

  // ========================================
  // RESETEAR ESTADO PARA NUEVA PREGUNTA
  // ========================================
resetQuestionState() {
  this.isPlaying = false;
  this.audioCompleted = false;
  this.audioProgress = '00:02';
  
  if (this.currentAudio) {
    this.currentAudio.pause();
    this.currentAudio = null;
  }
  
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  
  if (this.recordingAudio) {
    this.recordingAudio.pause();
    this.recordingAudio = null;
    this.isPlayingRecording = false;
  }
  
  this.audioService.clearRecording();
  
  // RESETEAR TIMERS DEL INTERROGATORIO
  this.stopResponseTimer();
  this.questionReadyTime = 0;
  this.responseStartTime = 0;
  this.questionResponseTime = 0;
  this.elapsedResponseTime = '00:00';
  
  console.log('🔄 Estado reseteado para pregunta', this.currentQuestionNumber);
  
  this.cdr.detectChanges();
  
  // 🆕 REPRODUCIR AUTOMÁTICAMENTE LA SIGUIENTE PREGUNTA
  setTimeout(() => {
    this.playAudio();
    console.log('🔊 Reproduciendo automáticamente pregunta', this.currentQuestionNumber);
  }, 300); // Pequeño delay
}


  // ========================================
  // FINALIZACIÓN DEL TEST
  // ========================================
  
  async completeTest() {
    console.log('Completando test oral con respuestas:', this.userAnswers);
    
    const alert = await this.alertController.create({
      header: 'Test Completado',
      message: 'Has completado todas las preguntas del modo oral.',
      buttons: [
        {
          text: 'Ver Resultados',
          handler: () => {
            this.saveResultsAndNavigateToSummary();
          }
        }
      ]
    });

    await alert.present();
  }

  saveResultsAndNavigateToSummary() {
    const results = this.calculateResults();
    localStorage.setItem('current_oral_test_results', JSON.stringify(results));
    this.apiService.clearCurrentSession();
    this.router.navigate(['/civil/civil-oral/resumen-test-civil-oral']);
  }

calculateResults() {
  const totalQuestions = this.questions.length;
  const answeredQuestions = Object.keys(this.userAnswers).length;
  
  // Calcular respuestas correctas REALES basadas en la evaluación
  let correctAnswers = 0;
  
  const questionDetails = this.questions.map((question, index) => {
    const answerData = this.userAnswers[question.id];
    
    if (answerData) {
      try {
        const parsedAnswer = JSON.parse(answerData);
        const isCorrect = parsedAnswer.isCorrect || false;
        
        if (isCorrect) {
          correctAnswers++;
        }
        
        return {
          questionNumber: index + 1,
          question: question.text,
          answered: true,
          correct: isCorrect,
          userAnswer: parsedAnswer.transcription || 'Sin respuesta',
          correctAnswer: parsedAnswer.correctAnswer || question.correctAnswer || 'N/A',
          feedback: parsedAnswer.feedback || '',
          confidence: parsedAnswer.confidence || 0,
          responseTime: parsedAnswer.responseTime || 0
        };
      } catch (error) {
        console.error('Error parseando respuesta:', error);
        return {
          questionNumber: index + 1,
          question: question.text,
          answered: false,
          correct: false,
          userAnswer: 'Error al procesar',
          correctAnswer: question.correctAnswer || 'N/A',
          responseTime: 0
        };
      }
    } else {
      return {
        questionNumber: index + 1,
        question: question.text,
        answered: false,
        correct: false,
        userAnswer: 'Sin respuesta',
        correctAnswer: question.correctAnswer || 'N/A',
        responseTime: 0
      };
    }
  });

  const percentage = totalQuestions > 0 
    ? Math.round((correctAnswers / totalQuestions) * 100) 
    : 0;

  console.log('📊 RESULTADOS FINALES:', {
    total: totalQuestions,
    correctas: correctAnswers,
    incorrectas: totalQuestions - correctAnswers,
    porcentaje: percentage
  });

  return {
    totalQuestions,
    correctAnswers,
    incorrectAnswers: totalQuestions - correctAnswers,
    percentage,
    questionDetails,
    testType: 'oral',
    completedAt: new Date().toISOString()
  };
}

  // ========================================
  // ALERTAS DE ERROR
  // ========================================
  
  async showUnsupportedAlert() {
    const alert = await this.alertController.create({
      header: 'Funcion no disponible',
      message: 'Tu navegador no soporta la grabacion de audio. Por favor, usa un navegador compatible como Chrome, Firefox o Safari.',
      buttons: [
        {
          text: 'Volver',
          handler: () => {
            this.router.navigate(['/civil/civil-oral']);
          }
        }
      ]
    });
    await alert.present();
  }

  async showMicrophoneErrorAlert() {
    const alert = await this.alertController.create({
      header: 'Error de microfono',
      message: 'No se pudo acceder al microfono. Por favor, verifica los permisos y que el microfono este conectado.',
      buttons: [
        {
          text: 'Reintentar',
          handler: async () => {
            const initialized = await this.audioService.initializeRecording();
            if (!initialized) {
              this.showMicrophoneErrorAlert();
            }
          }
        },
        {
          text: 'Volver',
          handler: () => {
            this.router.navigate(['/civil/civil-oral']);
          }
        }
      ]
    });
    await alert.present();
  }
}
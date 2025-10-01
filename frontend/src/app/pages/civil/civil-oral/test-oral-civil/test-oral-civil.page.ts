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
  
  // Subscription al estado de grabación
  private recordingStateSubscription: Subscription | null = null;
  
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

  // CARGAR PREGUNTAS DESDE EL BACKEND (igual que civil-escrito)
  async loadQuestionsFromBackend() {
    try {
      console.log('Cargando preguntas desde el backend...');
      this.isLoading = true;
      
      setTimeout(() => {
        this.currentSession = this.apiService.getCurrentSession();
        console.log('Sesión obtenida del ApiService:', this.currentSession);
        
        if (!this.currentSession) {
          console.error('No hay sesión activa');
          this.loadingError = true;
          this.isLoading = false;
          return;
        }

        try {
          this.sessionId = this.currentSession?.session?.id || 'sin-id';
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
    console.log('Reproduciendo pregunta:', questionText);
    
    this.isPlaying = true;
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(questionText);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;
      
      utterance.onend = () => {
        this.isPlaying = false;
        this.audioCompleted = true;
        this.audioProgress = 'Completado';
        this.cdr.detectChanges();
      };
      
      utterance.onerror = () => {
        this.isPlaying = false;
        console.error('Error al reproducir audio');
        this.cdr.detectChanges();
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => {
        this.isPlaying = false;
        this.audioCompleted = true;
        this.audioProgress = 'Completado';
        this.cdr.detectChanges();
      }, 3000);
    }
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
    if (this.audioCompleted) return 'Audio completado';
    return 'Escuchar pregunta';
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
    console.log('Iniciando grabacion de respuesta');
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

  // ========================================
  // ENVÍO DE RESPUESTA
  // ========================================
  
  async submitVoiceAnswer() {
    if (!this.hasRecording || !this.audioBlob) {
      console.warn('No hay grabacion para enviar');
      
      const alert = await this.alertController.create({
        header: 'Sin grabacion',
        message: 'Por favor, graba tu respuesta antes de enviar.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }
    
    const question = this.getCurrentQuestion();
    if (!question) return;
    
    console.log('Enviando respuesta de voz para pregunta:', this.currentQuestionNumber);
    console.log('Tamaño del audio:', this.audioBlob.size, 'bytes');
    console.log('Tipo de audio:', this.audioBlob.type);
    
    try {
      const loading = await this.loadingController.create({
        message: 'Procesando tu respuesta...',
        spinner: 'crescent'
      });
      await loading.present();
      
      const response = await this.audioService.uploadAudio(
        this.audioBlob,
        question.id,
        this.sessionId
      );
      
      await loading.dismiss();
      
      console.log('Respuesta del backend:', response);
      
      this.userAnswers[question.id] = JSON.stringify({
        type: 'voice',
        transcription: response.text || response.transcription || 'Texto no disponible',
        audioId: response.audioId || 'voice_' + this.currentQuestionNumber,
        timestamp: new Date().toISOString(),
        duration: this.recordingDuration,
        size: this.audioBlob.size,
        confidence: response.confidence || null
      });
      
      this.audioService.clearRecording();
      
      if (this.recordingAudio) {
        this.recordingAudio.pause();
        this.recordingAudio = null;
        this.isPlayingRecording = false;
      }
      
      const transcription = response.text || response.transcription || 'No se pudo transcribir el audio';
      
      const alert = await this.alertController.create({
        header: 'Respuesta procesada',
        message: `Tu respuesta: "${transcription}"`,
        buttons: ['OK']
      });
      await alert.present();
      
      setTimeout(() => {
        this.nextQuestion();
      }, 1500);
      
    } catch (error: any) {
      console.error('Error al enviar respuesta:', error);
      
      const loading = await this.loadingController.getTop();
      if (loading) {
        await loading.dismiss();
      }
      
      const errorMessage = error.message || 'Hubo un problema al procesar tu respuesta. Por favor, intenta nuevamente.';
      
      const alert = await this.alertController.create({
        header: 'Error',
        message: errorMessage,
        buttons: ['OK']
      });
      await alert.present();
    }
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
    this.cdr.detectChanges();
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
    const correctAnswers = answeredQuestions;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    
    const questionDetails = this.questions.map((question, index) => {
      const answered = !!this.userAnswers[question.id];
      return {
        questionNumber: index + 1,
        question: question.text,
        answered: answered,
        correct: answered,
        userAnswer: answered ? 'Respuesta de voz' : 'Sin respuesta',
        correctAnswer: question.correctAnswer || 'N/A'
      };
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
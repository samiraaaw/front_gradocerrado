import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AudioService, AudioRecordingState } from '../../../../services/audio';  // ✅ CORREGIDO
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
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class TestOralCivilPage implements OnInit, OnDestroy {

  questions: Question[] = [];
  currentQuestionNumber: number = 1;
  totalQuestions: number = 5;
  userAnswers: { [questionId: string]: string } = {};
  
  isPlaying: boolean = false;
  audioCompleted: boolean = false;
  audioProgress: string = '00:02';
  currentAudio: HTMLAudioElement | null = null;
  
  isRecording: boolean = false;
  hasRecording: boolean = false;
  recordingTime: string = '00:00';
  recordingDuration: number = 0;
  audioBlob: Blob | null = null;
  audioUrl: string | null = null;
  isPlayingRecording: boolean = false;
  recordingAudio: HTMLAudioElement | null = null;

  private questionStartTime: number = 0;
  private recordingStateSubscription: Subscription | null = null;

  public questionReadyTime: number = 0;
  public responseStartTime: number = 0;
  public questionResponseTime: number = 0;
  
  private responseTimer: any;
  public elapsedResponseTime: string = '00:00';
  
  sessionId: string = '';
  testId: number = 0;
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
        
        this.cdr.detectChanges();
      }
    );
  }

  async loadQuestionsFromBackend() {
    try {
      console.log('📥 Cargando preguntas desde el backend...');
      this.isLoading = true;
      
      const session = this.apiService.getCurrentSession();
      
      if (!session || !session.questions || session.questions.length === 0) {
        console.error('❌ No hay sesión activa o no tiene preguntas');
        this.loadingError = true;
        this.isLoading = false;
        return;
      }

      console.log('✅ Sesión encontrada:', session);
      
      this.testId = session.testId || session.session?.id || 0;
      this.sessionId = session.session?.id?.toString() || '';
      
      setTimeout(() => {
        try {
          this.questions = this.convertBackendQuestions(session.questions);
          
          if (this.questions.length === 0) {
            console.error('❌ No se pudieron convertir las preguntas');
            this.loadingError = true;
            this.isLoading = false;
            return;
          }

          this.totalQuestions = this.questions.length;
          this.currentQuestionNumber = 1;
          
          console.log(`✅ ${this.totalQuestions} preguntas cargadas`);
          
          this.isLoading = false;
          this.cdr.detectChanges();
          
          setTimeout(() => {
            this.playAudio();
            console.log('▶️ Reproduciendo automáticamente la primera pregunta');
          }, 500);
          
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

  convertBackendQuestions(backendQuestions: any[]): Question[] {
    if (!Array.isArray(backendQuestions)) {
      console.error('backendQuestions no es un array:', backendQuestions);
      return [];
    }
    
    return backendQuestions.map((q: any, index: number) => {
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

  getCurrentQuestion(): Question | null {
    return this.questions[this.currentQuestionNumber - 1] || null;
  }

  getCurrentQuestionText(): string {
    const question = this.getCurrentQuestion();
    return question ? question.text : '';
  }

  getProgress(): number {
    if (this.totalQuestions === 0) return 0;
    return (this.currentQuestionNumber / this.totalQuestions) * 100;
  }

  getTimerWarning(): boolean {
    if (this.questionReadyTime === 0) return false;
    const elapsed = Math.floor((Date.now() - this.questionReadyTime) / 1000);
    return elapsed > 120;
  }

  getTimerMessage(): string {
    if (this.questionReadyTime === 0) return '';
    
    const elapsed = Math.floor((Date.now() - this.questionReadyTime) / 1000);
    
    if (elapsed < 30) return '⚡ Buen ritmo';
    else if (elapsed < 60) return '👍 Tiempo razonable';
    else if (elapsed < 120) return '⏰ Considera finalizar pronto';
    else return '⚠️ Tiempo extenso';
  }

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
      
      utterance.onend = () => {
        this.isPlaying = false;
        this.audioCompleted = true;
        this.audioProgress = 'Completado';
        
        this.questionReadyTime = Date.now();
        this.startResponseTimer();
        
        console.log('⏱️ INTERROGATORIO INICIADO');
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
        
        this.questionReadyTime = Date.now();
        this.startResponseTimer();
        
        console.log('⏱️ INTERROGATORIO INICIADO (fallback)');
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

  startResponseTimer() {
    if (this.responseTimer) {
      clearInterval(this.responseTimer);
    }
    
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

  stopResponseTimer() {
    if (this.responseTimer) {
      clearInterval(this.responseTimer);
      this.responseTimer = null;
    }
  }

  getAudioIcon(): string {
    if (this.isPlaying) return 'pause-circle';
    if (this.audioCompleted) return 'checkmark-circle';
    return 'play-circle';
  }

  getAudioStatus(): string {
    if (this.isPlaying) return 'Reproduciendo...';
    if (this.audioCompleted) return 'Pregunta escuchada';
    return 'Escuchar pregunta';
  }

  toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  startRecording() {
    console.log('🎤 Iniciando grabación de respuesta');
    
    if (this.responseStartTime === 0 && this.questionReadyTime > 0) {
      this.responseStartTime = Date.now();
      const thinkingTime = Math.round((this.responseStartTime - this.questionReadyTime) / 1000);
      console.log(`💭 Tiempo de pensamiento: ${thinkingTime} segundos`);
    }
    
    this.audioService.startRecording();
  }

  stopRecording() {
    console.log('Deteniendo grabación');
    this.audioService.stopRecording();
  }

  restartRecording() {
    console.log('Reiniciando grabación');
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
    
    console.log('Reproduciendo grabación');
    
    if (this.isPlayingRecording && this.recordingAudio) {
      this.recordingAudio.pause();
      this.isPlayingRecording = false;
      this.cdr.detectChanges();
      return;
    }
    
    if (!this.recordingAudio || this.recordingAudio.src !== this.audioUrl) {
      this.recordingAudio = new Audio(this.audioUrl);
      
      this.recordingAudio.onended = () => {
        this.isPlayingRecording = false;
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
        this.cdr.detectChanges();
      })
      .catch(error => {
        console.error('Error al reproducir audio:', error);
        this.isPlayingRecording = false;
        this.cdr.detectChanges();
      });
  }

  getRecordingIcon(): string {
    return this.isRecording ? 'stop-circle' : 'mic-circle';
  }

  getRecordingStatus(): string {
    if (this.isRecording) return 'Grabando... Habla ahora';
    if (this.hasRecording) return 'Grabación completada';
    return 'Toca para grabar tu respuesta';
  }
  
  getReplayButtonText(): string {
    return this.isPlayingRecording ? 'Pausar' : 'Reproducir';
  }

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
      
      const response = await this.audioService.uploadAudio(
        this.audioBlob,
        question.id,
        this.sessionId,
        this.currentQuestionNumber,
        this.questionResponseTime
      );
      
      console.log('Transcripción recibida:', response);
      
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
      
      await this.showDetailedFeedback(
        isCorrect, 
        response.transcription, 
        correctAnswerText, 
        explanation,
        confidence
      );
      
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
    
    this.stopResponseTimer();
    this.questionReadyTime = 0;
    this.responseStartTime = 0;
    this.questionResponseTime = 0;
    this.elapsedResponseTime = '00:00';
    
    console.log('🔄 Estado reseteado para pregunta', this.currentQuestionNumber);
    
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.playAudio();
      console.log('🔊 Reproduciendo automáticamente pregunta', this.currentQuestionNumber);
    }, 300);
  }

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
 
  async showUnsupportedAlert() {
    const alert = await this.alertController.create({
      header: 'Función no disponible',
      message: 'Tu navegador no soporta la grabación de audio. Por favor, usa un navegador compatible como Chrome, Firefox o Safari.',
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
      header: 'Error de micrófono',
      message: 'No se pudo acceder al micrófono. Por favor, verifica los permisos y que el micrófono esté conectado.',
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

  retryLoading() {
    this.loadingError = false;
    this.isLoading = true;
    this.loadQuestionsFromBackend();
  }

  playQuestion() {
    this.playAudio();
  }
}
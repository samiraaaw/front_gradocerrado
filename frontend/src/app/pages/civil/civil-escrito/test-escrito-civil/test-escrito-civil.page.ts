import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
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
  options?: any[];
  [key: string]: any;
}

interface BackendSession {
  testId?: number; // ✅ AGREGAR
  session: any;
  questions: any[];
  currentQuestionIndex: number;
  totalQuestions: number;
}

@Component({
  selector: 'app-test-escrito-civil',
  templateUrl: './test-escrito-civil.page.html',
  styleUrls: ['./test-escrito-civil.page.scss'],
  standalone: false
})
export class TestEscritoCivilPage implements OnInit, OnDestroy {

  testConfig = {
    numberOfQuestions: 10,
    difficulty: 'Intermedio',
    adaptiveMode: true,
    immediateFeedback: false,
    onlyFailedQuestions: false,
    timeLimit: 25
  };

  currentQuestionIndex = 0;
  questions: Question[] = [];
  selectedAnswer: string = '';
  timeRemaining = 0;
  timer: any;
  isTestCompleted = false;
  isLoading = true;
  loadingError = false;

  totalQuestions = 10;
  currentQuestionNumber = 1;

  currentSession: BackendSession | null = null;
  sessionId: string = '';
  testId: number = 0; // ✅ AGREGAR

  // ✅ NUEVO: Control de tiempo por pregunta
  questionStartTime: Date = new Date();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private alertController: AlertController,
    private loadingController: LoadingController // ✅ AGREGAR
  ) { 
    console.log('TestEscritoCivilPage constructor inicializado');
  }

  ngOnInit() {
    console.log('TestEscritoCivilPage ngOnInit iniciado');
    this.loadSessionFromBackend();
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async loadSessionFromBackend() {
    try {
      console.log('Iniciando carga de sesión...');
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
          // ✅ CAPTURAR testId del backend
          this.testId = this.currentSession?.testId || 0;
          this.sessionId = this.currentSession?.session?.sessionId || this.currentSession?.session?.id || 'sin-id';
          this.totalQuestions = this.currentSession?.totalQuestions || 10;
          this.currentQuestionIndex = this.currentSession?.currentQuestionIndex || 0;
          this.currentQuestionNumber = this.currentQuestionIndex + 1;
          
          const backendQuestions = this.currentSession?.questions || [];
          this.questions = this.convertBackendQuestions(backendQuestions);
          
          console.log(`✅ Test ID: ${this.testId}`);
          console.log(`✅ Preguntas cargadas: ${this.questions.length}`);
          
          if (this.questions.length === 0) {
            console.error('No se cargaron preguntas');
            this.loadingError = true;
            this.isLoading = false;
            return;
          }
          
          // ✅ Iniciar contador de tiempo
          this.questionStartTime = new Date();
          
          this.startTimer();
          this.isLoading = false;
          console.log('Carga de sesión completada exitosamente');
          
        } catch (conversionError) {
          console.error('Error en conversión de preguntas:', conversionError);
          this.loadingError = true;
          this.isLoading = false;
        }
      }, 100);
      
    } catch (error) {
      console.error('Error en loadSessionFromBackend:', error);
      this.loadingError = true;
      this.isLoading = false;
    }
  }

  convertBackendQuestions(backendQuestions: any[]): Question[] {
    console.log('Convirtiendo preguntas del backend, cantidad:', backendQuestions?.length || 0);
    
    if (!Array.isArray(backendQuestions)) {
      console.error('backendQuestions no es un array:', backendQuestions);
      return [];
    }
    
    return backendQuestions.map((q: any, index: number) => {
      console.log(`Procesando pregunta ${index + 1}:`, q);
      
      const convertedQuestion: Question = {
        id: String(q.id) || `temp-${index}`,
        text: q.questionText || q.text || q.enunciado || 'Texto no disponible',
        questionText: q.questionText || q.text || q.enunciado || 'Texto no disponible',
        type: q.type || 1,
        category: q.category || q.tema || q.legalArea || 'Sin categoría',
        legalArea: q.legalArea || q.tema || q.category || 'General',
        difficulty: q.difficulty || 3,
        correctAnswer: q.correctAnswer || 'A',
        explanation: q.explanation || 'Explicación no disponible',
        options: q.options || []
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

  getCurrentQuestion(): Question | null {
    if (this.currentQuestionIndex >= 0 && this.currentQuestionIndex < this.questions.length) {
      return this.questions[this.currentQuestionIndex];
    }
    return null;
  }

  getCurrentQuestionOptions(): { id: string; text: string; letter?: string }[] {
    const question = this.getCurrentQuestion();
    if (!question) return [];

    const q: any = question;

    if (Array.isArray(q.options)) {
      return q.options.map((opt: any, idx: number) => ({
        id: String(opt?.id ?? String.fromCharCode(65 + idx)),
        text: typeof opt === 'string' ? opt : (opt?.text ?? opt?.content ?? `Opción ${idx + 1}`),
        letter: String.fromCharCode(65 + idx),
      }));
    }

    const individualOptions: { id: string; text: string; letter: string }[] = [];
    if (q.optionA) individualOptions.push({ id: 'A', text: q.optionA, letter: 'A' });
    if (q.optionB) individualOptions.push({ id: 'B', text: q.optionB, letter: 'B' });
    if (q.optionC) individualOptions.push({ id: 'C', text: q.optionC, letter: 'C' });
    if (q.optionD) individualOptions.push({ id: 'D', text: q.optionD, letter: 'D' });
    if (individualOptions.length > 0) return individualOptions;

    const possibleArrayProps = ['choices', 'answers', 'alternativas'];
    for (const prop of possibleArrayProps) {
      if (Array.isArray(q[prop]) && q[prop].length > 0) {
        return q[prop].map((opt: any, idx: number) => ({
          id: String(opt?.id ?? String.fromCharCode(65 + idx)),
          text: typeof opt === 'string' ? opt : (opt?.text ?? opt?.content ?? `Opción ${idx + 1}`),
          letter: String.fromCharCode(65 + idx),
        }));
      }
    }

    return [
      { id: 'A', text: 'Debug: No se encontraron opciones reales', letter: 'A' },
      { id: 'B', text: 'Revisa la consola', letter: 'B' }
    ];
  }

  startTimer() {
    if (this.testConfig.timeLimit > 0) {
      this.timeRemaining = this.testConfig.timeLimit * 60;
      this.timer = setInterval(() => {
        this.timeRemaining--;
        if (this.timeRemaining <= 0) {
          this.completeTest();
        }
      }, 1000);
    }
  }

  // ========================================
  // ✅ MÉTODO ACTUALIZADO: SELECCIONAR RESPUESTA
  // ========================================
  
  async selectAnswer(optionId: string) {
    if (!this.canSelectOption()) {
      console.log('⚠️ Ya se respondió esta pregunta');
      return;
    }

    console.log(`👆 Usuario seleccionó: ${optionId}`);

    this.selectedAnswer = optionId;
    
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) {
      console.error('❌ No hay pregunta actual');
      return;
    }

    currentQuestion.userAnswer = optionId;

    // ✅ VERIFICAR SI ES CORRECTA
    const isCorrect = this.isCorrectAnswer(optionId);
    console.log(`${isCorrect ? '✅' : '❌'} Respuesta ${isCorrect ? 'CORRECTA' : 'INCORRECTA'}`);

    // ✅ CALCULAR TIEMPO GASTADO
    const timeSpent = Math.floor((new Date().getTime() - this.questionStartTime.getTime()) / 1000);
    console.log(`⏱️ Tiempo: ${timeSpent} segundos`);

    // ✅ ENVIAR AL BACKEND
    await this.submitAnswerToBackend(currentQuestion, optionId, isCorrect, timeSpent);
  }

  // ========================================
  // ✅ NUEVO: ENVIAR RESPUESTA AL BACKEND
  // ========================================
  
  async submitAnswerToBackend(question: Question, userAnswer: string, isCorrect: boolean, timeSpent: number) {
    if (this.testId === 0) {
      console.error('❌ No hay testId válido');
      return;
    }

    console.log('📤 Enviando respuesta al backend...');

    const loading = await this.loadingController.create({
      message: 'Guardando...',
      spinner: 'crescent',
      duration: 5000
    });

    await loading.present();

    try {

      const timeSpanString = this.formatTimeSpan(timeSpent);

      const submitData = {
        testId: this.testId,
        preguntaId: parseInt(question.id),
        userAnswer: userAnswer,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation || '',
        timeSpent: timeSpanString, 
        numeroOrden: this.currentQuestionNumber,
        isCorrect: isCorrect
      };

      console.log('📦 Datos a enviar:', submitData);

      const response = await this.apiService.submitAnswer(submitData).toPromise();

      console.log('📥 Respuesta del backend:', response);

      if (response && response.success) {
        console.log(`✅ Respuesta guardada. ID: ${response.respuestaId}`);
      } else {
        console.warn('⚠️ Backend retornó success=false');
      }

    } catch (error: any) {
      console.error('❌ Error enviando respuesta:', error);
      
      // No bloquear el flujo del test
      const alert = await this.alertController.create({
        header: 'Advertencia',
        message: 'Hubo un problema al guardar la respuesta en el servidor.',
        buttons: ['OK']
      });
      await alert.present();

    } finally {
      await loading.dismiss();
    }
    // ✅ AGREGAR ESTE MÉTODO HELPER
  }

  private formatTimeSpan(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    // Formato ISO 8601 duration: PT1H2M3S
    return `PT${hours}H${minutes}M${secs}S`;
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.currentQuestionNumber++;
      this.selectedAnswer = '';
      
      // ✅ REINICIAR TIEMPO DE LA PREGUNTA
      this.questionStartTime = new Date();
      
      this.apiService.updateCurrentQuestionIndex(this.currentQuestionIndex);
      console.log('➡️ Avanzando a pregunta:', this.currentQuestionNumber);
    } else {
      this.completeTest();
    }
  }

  async completeTest() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    
    this.isTestCompleted = true;
    console.log('🏁 Test completado');
    
    const results = this.calculateResults();
    console.log('📊 Resultados calculados:', results);
    
    this.saveResultsAndNavigateToSummary(results);
  }

  saveResultsAndNavigateToSummary(results: any) {
    const sessionResults = {
      date: new Date().toISOString(),
      percentage: results.percentage,
      correctAnswers: results.correctAnswers,
      totalQuestions: results.totalQuestions,
      totalAnswered: results.totalAnswered,
      incorrectAnswers: results.incorrectAnswers,
      timeUsed: results.timeUsed,
      timeUsedFormatted: results.timeUsedFormatted,
      level: results.level,
      grade: results.grade,
      sessionId: results.sessionId,
      testId: this.testId, // ✅ AGREGAR testId
      incorrectQuestions: results.incorrectQuestions || [],
      allQuestions: this.questions.map((q, index) => ({
        questionNumber: index + 1,
        isCorrect: q.userAnswer === q.correctAnswer,
        userAnswer: q.userAnswer,
        correctAnswer: q.correctAnswer,
        questionText: q.questionText || q.text
      }))
    };
    
    console.log('💾 Guardando resultados completos:', sessionResults);
    
    localStorage.setItem('current_test_results', JSON.stringify(sessionResults));
    this.updateGeneralStats(results);
    this.apiService.clearCurrentSession();
    
    this.router.navigate(['/civil/civil-escrito/resumen-test-civil']);
  }

  calculateResults() {
    let correctAnswers = 0;
    let totalAnswered = 0;
    const incorrectQuestions: any[] = [];
    
    this.questions.forEach((question, index) => {
      if (question.userAnswer) {
        totalAnswered++;
        if (question.userAnswer === question.correctAnswer) {
          correctAnswers++;
        } else {
          incorrectQuestions.push({
            number: index + 1,
            question: question.questionText,
            userAnswer: question.userAnswer,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation
          });
        }
      }
    });
    
    const percentage = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;
    const timeUsed = this.testConfig.timeLimit * 60 - this.timeRemaining;
    
    return {
      correctAnswers,
      incorrectAnswers: totalAnswered - correctAnswers,
      totalQuestions: this.totalQuestions,
      totalAnswered,
      percentage,
      timeUsed,
      timeUsedFormatted: this.formatTime(timeUsed),
      grade: this.getGradeFromPercentage(percentage),
      level: this.getLevelFromPercentage(percentage),
      incorrectQuestions,
      sessionId: this.sessionId
    };
  }

  updateGeneralStats(results: any) {
    const currentStats = JSON.parse(localStorage.getItem('civil_escrito_stats') || '{}');
    
    const updatedStats = {
      totalTests: (currentStats.totalTests || 0) + 1,
      totalQuestions: (currentStats.totalQuestions || 0) + results.totalAnswered,
      totalCorrect: (currentStats.totalCorrect || 0) + results.correctAnswers,
      averagePercentage: 0,
      bestScore: Math.max(currentStats.bestScore || 0, results.percentage),
      currentLevel: results.level,
      lastUpdated: new Date().toISOString()
    };
    
    updatedStats.averagePercentage = updatedStats.totalQuestions > 0 
      ? Math.round((updatedStats.totalCorrect / updatedStats.totalQuestions) * 100)
      : 0;
    
    localStorage.setItem('civil_escrito_stats', JSON.stringify(updatedStats));
  }

  // ESTADO

  hasSelectedAnswer(): boolean {
    return this.selectedAnswer !== '';
  }

  hasAnsweredCurrentQuestion(): boolean {
    const currentQuestion = this.getCurrentQuestion();
    return currentQuestion ? !!currentQuestion.userAnswer : false;
  }

  isOptionSelected(optionId: string): boolean {
    const currentQuestion = this.getCurrentQuestion();
    return currentQuestion ? currentQuestion.userAnswer === optionId : false;
  }

  canSelectOption(): boolean {
    return !this.hasAnsweredCurrentQuestion();
  }

  getProgress(): number {
    return this.totalQuestions > 0 ? (this.currentQuestionIndex / this.totalQuestions) * 100 : 0;
  }

  getCategoryColor(): string {
    return '#FF6F00';
  }

  getCurrentQuestionCategory(): string {
    const question = this.getCurrentQuestion();
    return question?.category || question?.legalArea || 'Sin categoría';
  }

  getCurrentQuestionText(): string {
    const question = this.getCurrentQuestion();
    return question?.text || question?.questionText || 'Pregunta no disponible';
  }

  // VALIDACIÓN

  isCorrectAnswer(optionId: string): boolean {
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) return false;
    
    // Verificar en options del backend si existe
    if (currentQuestion.options && Array.isArray(currentQuestion.options)) {
      const option = currentQuestion.options.find((opt: any) => String(opt.id) === String(optionId));
      if (option && typeof option.isCorrect === 'boolean') {
        return option.isCorrect;
      }
    }
    
    return String(currentQuestion.correctAnswer).trim() === String(optionId).trim();
  }

  isIncorrectAnswer(optionId: string): boolean {
    return this.hasAnsweredCurrentQuestion() && 
           this.isOptionSelected(optionId) && 
           !this.isCorrectAnswer(optionId);
  }

  getOptionState(optionId: string): string {
    if (!this.hasAnsweredCurrentQuestion()) {
      return this.isOptionSelected(optionId) ? 'selected' : 'default';
    }
    
    if (this.isCorrectAnswer(optionId)) {
      return 'correct';
    }
    
    if (this.isIncorrectAnswer(optionId)) {
      return 'incorrect';
    }
    
    return 'default';
  }

  shouldShowOptionIcon(optionId: string): boolean {
    return this.hasAnsweredCurrentQuestion();
  }

  getOptionIcon(optionId: string): string {
    if (this.isCorrectAnswer(optionId)) {
      return 'checkmark-circle';
    }
    
    if (this.isIncorrectAnswer(optionId)) {
      return 'close-circle';
    }
    
    return '';
  }

  getOptionIconColor(optionId: string): string {
    if (this.isCorrectAnswer(optionId)) {
      return '#4CAF50';
    }
    
    if (this.isIncorrectAnswer(optionId)) {
      return '#F44336';
    }
    
    return '';
  }

  // CONTROL

  exitTest() {
    console.log('Saliendo del test...');
    this.apiService.clearCurrentSession();
    this.router.navigate(['/civil/civil-escrito']);
  }

  isQuestionsLoading(): boolean {
    return this.isLoading;
  }

  hasLoadingError(): boolean {
    return this.loadingError;
  }

  retryLoading() {
    this.loadingError = false;
    this.isLoading = true;
    this.loadSessionFromBackend();
  }

  // AUXILIARES

  getGradeFromPercentage(percentage: number): string {
    if (percentage >= 90) return 'Excelente';
    if (percentage >= 80) return 'Muy Bien';
    if (percentage >= 70) return 'Bien';
    if (percentage >= 60) return 'Regular';
    if (percentage >= 50) return 'Suficiente';
    return 'Insuficiente';
  }

  getLevelFromPercentage(percentage: number): string {
    if (percentage >= 90) return 'Experto';
    if (percentage >= 75) return 'Avanzado';
    if (percentage >= 60) return 'Intermedio';
    if (percentage >= 40) return 'Básico';
    return 'Principiante';
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  debugCurrentQuestion() {
    const question = this.getCurrentQuestion();
    console.log('=== DEBUG ===');
    console.log('Pregunta:', question);
    console.log('Opciones:', this.getCurrentQuestionOptions());
    console.log('TestId:', this.testId);
    console.log('=============');
  }
}
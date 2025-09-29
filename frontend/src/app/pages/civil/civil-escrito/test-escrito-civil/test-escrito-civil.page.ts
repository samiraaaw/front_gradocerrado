import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';
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
  [key: string]: any; // Permite cualquier propiedad adicional
}

interface BackendSession {
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

  // Configuración básica
  testConfig = {
    numberOfQuestions: 10,
    difficulty: 'Intermedio',
    adaptiveMode: true,
    immediateFeedback: false,
    onlyFailedQuestions: false,
    timeLimit: 25
  };

  // Estado del test
  currentQuestionIndex = 0;
  questions: Question[] = [];
  selectedAnswer: string = '';
  timeRemaining = 0;
  timer: any;
  isTestCompleted = false;
  isLoading = true;
  loadingError = false;

  // Datos de progreso
  totalQuestions = 10;
  currentQuestionNumber = 1;

  // Datos de la sesión
  currentSession: BackendSession | null = null;
  sessionId: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private alertController: AlertController
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

  // CARGAR SESIÓN - Versión simplificada y segura
  async loadSessionFromBackend() {
    try {
      console.log('Iniciando carga de sesión...');
      this.isLoading = true;
      
      // Esperar un poco para que el localStorage esté disponible
      setTimeout(() => {
        this.currentSession = this.apiService.getCurrentSession();
        console.log('Sesión obtenida del ApiService:', this.currentSession);
        
        if (!this.currentSession) {
          console.error('No hay sesión activa, redirigiendo...');
          this.loadingError = true;
          this.isLoading = false;
          // No redirigir inmediatamente, mostrar error
          return;
        }

        try {
          // Configurar datos básicos de forma segura
          this.sessionId = this.currentSession?.session?.id || 'sin-id';
          this.totalQuestions = this.currentSession?.totalQuestions || 10;
          this.currentQuestionIndex = this.currentSession?.currentQuestionIndex || 0;
          this.currentQuestionNumber = this.currentQuestionIndex + 1;
          
          // Convertir preguntas de forma segura
          const backendQuestions = this.currentSession?.questions || [];
          this.questions = this.convertBackendQuestions(backendQuestions);
          console.log('Preguntas convertidas exitosamente:', this.questions.length);
          
          if (this.questions.length === 0) {
            console.error('No se cargaron preguntas');
            this.loadingError = true;
            this.isLoading = false;
            return;
          }
          
          this.startTimer();
          this.isLoading = false;
          console.log('Carga de sesión completada exitosamente');
          
        } catch (conversionError) {
          console.error('Error en conversión de preguntas:', conversionError);
          this.loadingError = true;
          this.isLoading = false;
        }
      }, 100); // Pequeño delay para asegurar que localStorage esté disponible
      
    } catch (error) {
      console.error('Error en loadSessionFromBackend:', error);
      this.loadingError = true;
      this.isLoading = false;
    }
  }

  // CONVERTIR PREGUNTAS - Versión simplificada y segura
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

      // Agregar todas las propiedades originales de forma segura
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

  // OBTENER PREGUNTA ACTUAL
  getCurrentQuestion(): Question | null {
    if (this.currentQuestionIndex >= 0 && this.currentQuestionIndex < this.questions.length) {
      return this.questions[this.currentQuestionIndex];
    }
    return null;
  }

  // OBTENER OPCIONES - Versión muy simplificada
  getCurrentQuestionOptions(): { id: string; text: string; }[] {
    const question = this.getCurrentQuestion();
    
    if (!question) {
      console.log('No hay pregunta actual');
      return [];
    }

    console.log('=== DEBUGGING OPCIONES ===');
    console.log('Pregunta completa:', question);
    console.log('Propiedades disponibles:', Object.keys(question));

    const questionData = question as any;

    // Formato 1: Array de opciones
    if (questionData.options && Array.isArray(questionData.options)) {
      console.log('Usando formato options array:', questionData.options);
      return questionData.options.map((option: any, index: number) => ({
        id: String.fromCharCode(65 + index),
        text: typeof option === 'string' ? option : (option.text || option.content || `Opción ${index + 1}`)
      }));
    }

    // Formato 2: Propiedades individuales
    const individualOptions = [];
    if (questionData.optionA) individualOptions.push({ id: 'A', text: questionData.optionA });
    if (questionData.optionB) individualOptions.push({ id: 'B', text: questionData.optionB });
    if (questionData.optionC) individualOptions.push({ id: 'C', text: questionData.optionC });
    if (questionData.optionD) individualOptions.push({ id: 'D', text: questionData.optionD });
    
    if (individualOptions.length > 0) {
      console.log('Usando formato opciones individuales:', individualOptions);
      return individualOptions;
    }

    // Formato 3: Buscar en otras propiedades posibles
    const possibleArrayProps = ['choices', 'answers', 'alternativas'];
    for (const prop of possibleArrayProps) {
      if (questionData[prop] && Array.isArray(questionData[prop]) && questionData[prop].length > 0) {
        console.log(`Usando ${prop} array:`, questionData[prop]);
        return questionData[prop].map((option: any, index: number) => ({
          id: String.fromCharCode(65 + index),
          text: typeof option === 'string' ? option : (option.text || option.content || `Opción ${index + 1}`)
        }));
      }
    }

    // Formato 4: Opciones de debug
    console.warn('No se encontraron opciones, usando opciones de debug');
    console.log('Estructura completa de la pregunta:', question);
    
    return [
      { id: 'A', text: 'Debug: No se encontraron opciones reales' },
      { id: 'B', text: 'Revisa la consola para ver la estructura' },
      { id: 'C', text: 'Contacta al desarrollador con esta info' },
      { id: 'D', text: `Total propiedades: ${Object.keys(question).length}` }
    ];
  }

  // MÉTODOS BÁSICOS DE FUNCIONALIDAD

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

  selectAnswer(optionId: string) {
    if (!this.canSelectOption()) {
      return;
    }

    this.selectedAnswer = optionId;
    
    const currentQuestion = this.getCurrentQuestion();
    if (currentQuestion) {
      currentQuestion.userAnswer = optionId;
    }

    console.log('Respuesta seleccionada:', optionId);
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.currentQuestionNumber++;
      this.selectedAnswer = '';
      
      this.apiService.updateCurrentQuestionIndex(this.currentQuestionIndex);
      console.log('Avanzando a pregunta:', this.currentQuestionNumber);
    } else {
      this.completeTest();
    }
  }

// MÉTODO COMPLETO DE FINALIZAR TEST SIN POPUP
async completeTest() {
  if (this.timer) {
    clearInterval(this.timer);
  }
  
  this.isTestCompleted = true;
  console.log('Test completado, calculando resultados...');
  
  // Calcular resultados
  const results = this.calculateResults();
  console.log('Resultados calculados:', results);
  
  // Guardar resultados y navegar directamente al resumen
  this.saveResultsAndNavigateToSummary(results);
}

// GUARDAR RESULTADOS Y NAVEGAR AL RESUMEN
saveResultsAndNavigateToSummary(results: any) {
  // Guardar resultados COMPLETOS para el resumen
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
    // ✅ AGREGAR: Detalles de cada pregunta para los círculos
    incorrectQuestions: results.incorrectQuestions || [],
    allQuestions: this.questions.map((q, index) => ({
      questionNumber: index + 1,
      isCorrect: q.userAnswer === q.correctAnswer,
      userAnswer: q.userAnswer,
      correctAnswer: q.correctAnswer,
      questionText: q.questionText || q.text
    }))
  };
  
  console.log('Guardando resultados completos:', sessionResults);
  
  // Guardar en localStorage para que el resumen pueda acceder
  localStorage.setItem('current_test_results', JSON.stringify(sessionResults));
  
  // Actualizar estadísticas generales
  this.updateGeneralStats(results);
  
  // Limpiar sesión actual
  this.apiService.clearCurrentSession();
  
  // Navegar al resumen del test
  this.router.navigate(['/civil/civil-escrito/resumen-test-civil']);
}
  // CALCULAR RESULTADOS DEL TEST
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

  // MOSTRAR POPUP CON RESULTADOS
  async showResultsPopup(results: any) {
    const alert = await this.alertController.create({
      header: '🎉 Test Completado',
      cssClass: 'results-popup',
      message: `
        <div class="results-container">
          <div class="score-section">
            <div class="main-score">${results.percentage}%</div>
            <div class="score-label">${results.grade}</div>
          </div>
          
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number correct">${results.correctAnswers}</div>
              <div class="stat-label">Correctas</div>
            </div>
            <div class="stat-item">
              <div class="stat-number incorrect">${results.incorrectAnswers}</div>
              <div class="stat-label">Incorrectas</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${results.totalAnswered}</div>
              <div class="stat-label">Respondidas</div>
            </div>
          </div>
          
          <div class="level-section">
            <div class="level-badge">${results.level}</div>
            <div class="time-used">Tiempo: ${results.timeUsedFormatted}</div>
          </div>
          
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${results.percentage}%"></div>
          </div>
        </div>
      `,
      buttons: [
        {
          text: 'Ver Detalles',
          role: 'secondary',
          cssClass: 'details-button',
          handler: () => {
            this.showDetailedResults(results);
          }
        },
        {
          text: 'Continuar',
          cssClass: 'continue-button',
          handler: () => {
            this.saveResultsAndNavigate(results);
          }
        }
      ],
      backdropDismiss: false
    });

    await alert.present();
  }

  // MOSTRAR RESULTADOS DETALLADOS
  async showDetailedResults(results: any) {
    let detailsMessage = '<div class="detailed-results">';
    
    if (results.incorrectQuestions.length > 0) {
      detailsMessage += '<h4>Preguntas Incorrectas:</h4>';
      results.incorrectQuestions.forEach((q: any) => {
        detailsMessage += `
          <div class="incorrect-question">
            <strong>Pregunta ${q.number}:</strong><br>
            ${q.question}<br>
            <span class="user-answer">Tu respuesta: ${q.userAnswer}</span><br>
            <span class="correct-answer">Respuesta correcta: ${q.correctAnswer}</span>
          </div>
        `;
      });
    } else {
      detailsMessage += '<h4>¡Perfecto! Todas las respuestas fueron correctas.</h4>';
    }
    
    detailsMessage += '</div>';
    
    const detailAlert = await this.alertController.create({
      header: 'Resultados Detallados',
      message: detailsMessage,
      cssClass: 'detailed-results-popup',
      buttons: [
        {
          text: 'Cerrar',
          handler: () => {
            this.saveResultsAndNavigate(results);
          }
        }
      ]
    });

    await detailAlert.present();
  }

  // GUARDAR RESULTADOS Y NAVEGAR
  saveResultsAndNavigate(results: any) {
    // Guardar resultados en localStorage para mostrar en la página principal
    const sessionResults = {
      date: new Date().toISOString(),
      percentage: results.percentage,
      correctAnswers: results.correctAnswers,
      totalQuestions: results.totalQuestions,
      timeUsed: results.timeUsed,
      level: results.level,
      grade: results.grade,
      sessionId: results.sessionId
    };
    
    // Obtener resultados anteriores
    const previousResults = JSON.parse(localStorage.getItem('civil_escrito_results') || '[]');
    previousResults.unshift(sessionResults); // Agregar al principio
    
    // Mantener solo los últimos 10 resultados
    if (previousResults.length > 10) {
      previousResults.splice(10);
    }
    
    // Guardar resultados actualizados
    localStorage.setItem('civil_escrito_results', JSON.stringify(previousResults));
    
    // Actualizar estadísticas generales
    this.updateGeneralStats(results);
    
    // Limpiar sesión actual
    this.apiService.clearCurrentSession();
    
    // Navegar de vuelta a civil-escrito
    this.router.navigate(['/civil/civil-escrito']);
  }

  // ACTUALIZAR ESTADÍSTICAS GENERALES
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
    
    // Calcular promedio
    updatedStats.averagePercentage = updatedStats.totalQuestions > 0 
      ? Math.round((updatedStats.totalCorrect / updatedStats.totalQuestions) * 100)
      : 0;
    
    localStorage.setItem('civil_escrito_stats', JSON.stringify(updatedStats));
    console.log('Estadísticas actualizadas:', updatedStats);
  }

  // MÉTODOS DE ESTADO

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

  // MÉTODOS PARA LA VISTA

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

  // MÉTODOS DE ESTADOS DE OPCIONES

  isCorrectAnswer(optionId: string): boolean {
    const currentQuestion = this.getCurrentQuestion();
    return currentQuestion ? currentQuestion.correctAnswer === optionId : false;
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

  // MÉTODOS DE CONTROL

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

  // MÉTODOS AUXILIARES

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

  // MÉTODO DE DEBUG
  debugCurrentQuestion() {
    const question = this.getCurrentQuestion();
    console.log('=== DEBUG PREGUNTA ACTUAL ===');
    console.log('Pregunta completa:', question);
    console.log('Opciones mapeadas:', this.getCurrentQuestionOptions());
    console.log('Estado de carga:', { isLoading: this.isLoading, loadingError: this.loadingError });
    console.log('===============================');
  }
}
// INICIO DEL ARCHIVO - Copiar desde aquí
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../services/api.service';

interface Question {
  id: string;
  text: string;
  questionText: string;
  type: string | number;  // ✅ CORREGIDO: Acepta string o number
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
  testId?: number;
  session: any;
  questions: any[];
  currentQuestionIndex: number;
  totalQuestions: number;
}

// ✅ AGREGADO: Interface para los resultados
interface TestResults {
  correctAnswers: number;
  incorrectAnswers: number;
  totalAnswered: number;
  totalQuestions: number;
  percentage: number;
  grade: string;
  level: string;
  incorrectQuestions: any[];
  timeUsed?: number;           // ✅ AGREGADO
  timeUsedFormatted?: string;  // ✅ AGREGADO
  sessionId?: string;          // ✅ AGREGADO
}

@Component({
  selector: 'app-test-escrito-civil',
  templateUrl: './test-escrito-civil.page.html',
  styleUrls: ['./test-escrito-civil.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
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
  testId: number = 0;

  questionStartTime: Date = new Date();

  constructor(
    private router: Router,
    private apiService: ApiService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private cdr: ChangeDetectorRef
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
      
      const session = this.apiService.getCurrentSession();
      
      if (!session || !session.questions || session.questions.length === 0) {
        console.error('❌ No hay sesión activa o no tiene preguntas');
        this.loadingError = true;
        this.isLoading = false;
        return;
      }

      console.log('✅ Sesión encontrada:', session);
      
      this.currentSession = session as BackendSession;
      this.testId = session.testId || session.session?.id || 0;
      this.sessionId = session.session?.id?.toString() || '';
      
      console.log('📝 Test ID:', this.testId);
      console.log('📝 Session ID:', this.sessionId);
      
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
          this.currentQuestionIndex = 0;
          
          console.log(`✅ ${this.totalQuestions} preguntas cargadas correctamente`);
          console.log('📋 Primera pregunta:', this.questions[0]);
          
          this.isLoading = false;
          this.cdr.detectChanges();
          
          this.startTimer();
          
          setTimeout(() => {
            this.logQuestionDebug();
          }, 500);
          
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

  logQuestionDebug() {
    const q = this.getCurrentQuestion();
    console.log('=== DEBUG PREGUNTA ACTUAL ===');
    console.log('Pregunta:', q);
    console.log('Tipo:', q?.type);
    console.log('Es V/F:', this.isTrueFalseQuestion());
    console.log('Opciones:', this.getCurrentQuestionOptions());
    console.log('=============================');
  }

  startTimer() {
    this.timeRemaining = this.testConfig.timeLimit * 60;
    
    this.timer = setInterval(() => {
      if (this.timeRemaining > 0) {
        this.timeRemaining--;
      } else {
        this.finishTest();
      }
    }, 1000);
  }

  getFormattedTime(): string {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  getCurrentQuestion(): Question | null {
    return this.questions[this.currentQuestionIndex] || null;
  }

  getCurrentQuestionOptions(): string[] {
    const question = this.getCurrentQuestion();
    
    if (!question) {
      return [];
    }

    if (this.isTrueFalseQuestion()) {
      return ['Verdadero', 'Falso'];
    }

    const options: string[] = [];
    ['optionA', 'optionB', 'optionC', 'optionD', 'optionE'].forEach(key => {
      if (question[key]) {
        options.push(question[key]);
      }
    });

    return options.length > 0 ? options : [];
  }

  isTrueFalseQuestion(): boolean {
    const question = this.getCurrentQuestion();
    return question?.type === 2 || question?.type === '2';
  }

  selectAnswer(optionId: string) {
    if (this.hasAnsweredCurrentQuestion()) {
      console.log('Ya respondiste esta pregunta');
      return;
    }
    
    const question = this.getCurrentQuestion();
    if (!question) return;

    let normalizedAnswer = optionId;
    
    if (this.isTrueFalseQuestion()) {
      normalizedAnswer = optionId === 'Verdadero' ? 'V' : 'F';
    } else {
      normalizedAnswer = optionId.toUpperCase();
      if (!['A', 'B', 'C', 'D', 'E'].includes(normalizedAnswer)) {
        const options = this.getCurrentQuestionOptions();
        const optionIndex = options.indexOf(optionId);
        if (optionIndex !== -1) {
          normalizedAnswer = String.fromCharCode(65 + optionIndex);
        }
      }
    }
    
    console.log(`✅ Respuesta seleccionada: ${normalizedAnswer} (original: ${optionId})`);
    question.userAnswer = normalizedAnswer;
    
    this.sendAnswerToBackend(question, normalizedAnswer);
    
    this.cdr.detectChanges();
  }

  async sendAnswerToBackend(question: Question, answer: string) {
  try {
    const questionEndTime = new Date();
    const responseTime = Math.floor((questionEndTime.getTime() - this.questionStartTime.getTime()) / 1000);
    
    // ✅ Convertir tiempo a formato TimeSpan (PT0H0M10S)
    const hours = Math.floor(responseTime / 3600);
    const minutes = Math.floor((responseTime % 3600) / 60);
    const seconds = responseTime % 60;
    const timeSpanString = `PT${hours}H${minutes}M${seconds}S`;
    
    // ✅ Estructura exacta que espera el backend
    const answerData = {
      testId: this.testId,
      preguntaId: parseInt(question.id),  // ✅ Convertir a number
      userAnswer: answer,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || '',
      timeSpent: timeSpanString,  // ✅ Formato TimeSpan
      numeroOrden: this.currentQuestionNumber,
      isCorrect: this.compareAnswers(answer, question.correctAnswer)
    };
    
    console.log('📤 Enviando respuesta al backend:', answerData);
    
    await this.apiService.submitAnswer(answerData).toPromise();
    console.log('✅ Respuesta enviada correctamente');
    
  } catch (error) {
    console.error('❌ Error enviando respuesta:', error);
  }
}

  nextQuestion() {
    if (!this.hasAnsweredCurrentQuestion()) {
      this.showAnswerRequiredAlert();
      return;
    }

    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.currentQuestionNumber++;
      this.selectedAnswer = '';
      
      this.questionStartTime = new Date();
      
      console.log(`➡️ Avanzando a pregunta ${this.currentQuestionNumber} de ${this.totalQuestions}`);
      this.logQuestionDebug();
    } else {
      this.finishTest();
    }
  }

  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.currentQuestionNumber--;
      this.selectedAnswer = '';
      
      console.log(`⬅️ Retrocediendo a pregunta ${this.currentQuestionNumber} de ${this.totalQuestions}`);
      this.logQuestionDebug();
    }
  }

  hasAnsweredCurrentQuestion(): boolean {
    const question = this.getCurrentQuestion();
    return !!question?.userAnswer;
  }

  async showAnswerRequiredAlert() {
    const alert = await this.alertController.create({
      header: 'Respuesta requerida',
      message: 'Debes seleccionar una respuesta antes de continuar.',
      buttons: ['OK']
    });
    
    await alert.present();
  }

  compareAnswers(userAnswer: string, correctAnswer: string): boolean {
    const normalize = (ans: string) => ans?.toString().trim().toUpperCase() || '';
    return normalize(userAnswer) === normalize(correctAnswer);
  }

  async finishTest() {
    console.log('🏁 Finalizando test...');
    
    if (this.timer) {
      clearInterval(this.timer);
    }

    const timeUsed = (this.testConfig.timeLimit * 60) - this.timeRemaining;
    const results = this.calculateResults();
    
    // ✅ CORREGIDO: Asignación correcta de propiedades
    results.timeUsed = timeUsed;
    results.timeUsedFormatted = this.formatTime(timeUsed);
    results.sessionId = this.sessionId;
    
    console.log('📊 Resultados calculados:', results);
    
    this.saveResultsAndNavigateToSummary(results);
  }

  saveResultsAndNavigateToSummary(results: TestResults) {  // ✅ CORREGIDO: Tipo específico
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
      testId: this.testId,
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

  calculateResults(): TestResults {  // ✅ CORREGIDO: Retorna tipo específico
    let correctAnswers = 0;
    let totalAnswered = 0;
    const incorrectQuestions: any[] = [];
    
    this.questions.forEach((question, index) => {
      if (question.userAnswer) {
        totalAnswered++;
        
        const isCorrect = this.compareAnswers(question.userAnswer, question.correctAnswer);
        
        if (isCorrect) {
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
    const incorrectAnswers = totalAnswered - correctAnswers;
    
    return {
      correctAnswers,
      incorrectAnswers,
      totalAnswered,
      totalQuestions: this.questions.length,
      percentage,
      grade: this.getGradeFromPercentage(percentage),
      level: this.getLevelFromPercentage(percentage),
      incorrectQuestions
    };
  }

  updateGeneralStats(results: TestResults) {  // ✅ CORREGIDO: Tipo específico
    const stats = {
      lastTestDate: new Date().toISOString(),
      lastTestScore: results.percentage,
      totalTests: (parseInt(localStorage.getItem('totalTests') || '0')) + 1,
      totalQuestions: (parseInt(localStorage.getItem('totalQuestions') || '0')) + results.totalQuestions,
      totalCorrect: (parseInt(localStorage.getItem('totalCorrect') || '0')) + results.correctAnswers
    };
    
    localStorage.setItem('totalTests', stats.totalTests.toString());
    localStorage.setItem('totalQuestions', stats.totalQuestions.toString());
    localStorage.setItem('totalCorrect', stats.totalCorrect.toString());
    localStorage.setItem('lastTestDate', stats.lastTestDate);
    localStorage.setItem('lastTestScore', stats.lastTestScore.toString());
    
    console.log('📈 Estadísticas actualizadas:', stats);
  }

  getAnswerButtonClass(optionId: string): string {
    const question = this.getCurrentQuestion();
    if (!question) return 'default';
    
    if (question.userAnswer === optionId) {
      return 'selected';
    }
    
    if (this.isCorrectAnswer(optionId)) {
      return 'correct';
    }
    
    if (this.isIncorrectAnswer(optionId)) {
      return 'incorrect';
    }
    
    return 'default';
  }

  isCorrectAnswer(optionId: string): boolean {
    const question = this.getCurrentQuestion();
    if (!question || !this.hasAnsweredCurrentQuestion()) return false;
    
    return this.compareAnswers(optionId, question.correctAnswer);
  }

  isIncorrectAnswer(optionId: string): boolean {
    const question = this.getCurrentQuestion();
    if (!question || !this.hasAnsweredCurrentQuestion()) return false;
    
    return question.userAnswer === optionId && !this.compareAnswers(optionId, question.correctAnswer);
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
    console.log('Tipo:', question?.type);
    console.log('Es V/F:', this.isTrueFalseQuestion());
    console.log('Opciones:', this.getCurrentQuestionOptions());
    console.log('TestId:', this.testId);
    console.log('=============');
  }


  getProgress(): number {
    if (this.totalQuestions === 0) return 0;
    return (this.currentQuestionNumber / this.totalQuestions) * 100;
  }

  getCategoryColor(): string {
    return '#FF6F00'; // Color naranja para Civil
  }

  getCurrentQuestionCategory(): string {
    const question = this.getCurrentQuestion();
    return question?.category || question?.legalArea || 'General';
  }

  getCurrentQuestionText(): string {
    const question = this.getCurrentQuestion();
    return question?.questionText || question?.text || 'Pregunta no disponible';
  }

  isOptionSelected(optionText: string): boolean {
    const question = this.getCurrentQuestion();
    if (!question) return false;
    return question.userAnswer === optionText;
  }

  getOptionState(optionText: string): 'correct' | 'incorrect' | 'default' {
    if (!this.hasAnsweredCurrentQuestion()) return 'default';
    
    const question = this.getCurrentQuestion();
    if (!question) return 'default';
    
    const isCorrect = this.compareAnswers(optionText, question.correctAnswer);
    const isSelected = question.userAnswer === optionText;
    
    if (isCorrect) return 'correct';
    if (isSelected && !isCorrect) return 'incorrect';
    
    return 'default';
  }

  canSelectOption(): boolean {
    return !this.hasAnsweredCurrentQuestion();
  }

  hasSelectedAnswer(): boolean {
    return this.hasAnsweredCurrentQuestion();
  }

  getOptionLetter(index: number): string {
    if (this.isTrueFalseQuestion()) {
      return index === 0 ? 'V' : 'F';
    }
    return String.fromCharCode(65 + index); // A, B, C, D, E
  }
}
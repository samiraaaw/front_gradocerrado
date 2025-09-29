import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

interface QuestionResult {
  questionNumber: number;
  isCorrect: boolean;
  userAnswer?: string;
  correctAnswer?: string;
  explanation?: string;
}

@Component({
  selector: 'app-resumen-test-civil',
  templateUrl: './resumen-test-civil.page.html',
  styleUrls: ['./resumen-test-civil.page.scss'],
  standalone: false
})
export class ResumenTestCivilPage implements OnInit {

  // Datos de los resultados
  testResults: any = null;
  questionsStatus: QuestionResult[] = [];
  
  // Datos calculados para mostrar
  correctAnswers = 0;
  incorrectAnswers = 0;
  totalQuestions = 0;
  percentage = 0;
  level = 'BÁSICO';
  celebrationMessage = '¡Sigue practicando!';

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.loadTestResults();
    this.generateQuestionsStatus();
  }

  // Cargar resultados del test desde localStorage
  loadTestResults() {
    try {
      const results = localStorage.getItem('current_test_results');
      if (results) {
        this.testResults = JSON.parse(results);
        
        // ✅ Usar datos reales del test
        this.correctAnswers = this.testResults.correctAnswers || 0;
        this.totalQuestions = this.testResults.totalQuestions || 0;
        this.incorrectAnswers = this.testResults.incorrectAnswers || (this.totalQuestions - this.correctAnswers);
        this.percentage = this.testResults.percentage || 0;
        this.level = this.testResults.level || 'BÁSICO';
        
        // Mensaje según el porcentaje
        if (this.percentage >= 80) {
          this.celebrationMessage = '¡Excelente progreso!';
        } else if (this.percentage >= 60) {
          this.celebrationMessage = '¡Buen trabajo!';
        } else {
          this.celebrationMessage = '¡Sigue practicando!';
        }
        
        console.log('Resultados cargados:', this.testResults);
        console.log('Datos para mostrar:', {
          correctas: this.correctAnswers,
          incorrectas: this.incorrectAnswers,
          total: this.totalQuestions,
          porcentaje: this.percentage
        });
      } else {
        // Si no hay resultados, usar datos de ejemplo
        console.log('No hay resultados guardados, usando datos de ejemplo');
        this.correctAnswers = 0;
        this.incorrectAnswers = 5;
        this.totalQuestions = 5;
        this.percentage = 0;
        this.level = 'BÁSICO';
        this.celebrationMessage = '¡Sigue practicando!';
      }
    } catch (error) {
      console.error('Error cargando resultados:', error);
      // Usar datos de ejemplo en caso de error
      this.correctAnswers = 0;
      this.incorrectAnswers = 5;
      this.totalQuestions = 5;
      this.percentage = 0;
    }
  }

  // Generar el estado de cada pregunta para los círculos
  generateQuestionsStatus() {
    this.questionsStatus = [];
    
    // ✅ Si tenemos resultados detallados del test, usarlos
    if (this.testResults && this.testResults.allQuestions) {
      this.questionsStatus = this.testResults.allQuestions.map((q: any) => ({
        questionNumber: q.questionNumber,
        isCorrect: q.isCorrect,
        userAnswer: q.userAnswer,
        correctAnswer: q.correctAnswer
      }));
    } else {
      // ✅ Generar estado basado en correctas/incorrectas reales
      for (let i = 1; i <= this.totalQuestions; i++) {
        this.questionsStatus.push({
          questionNumber: i,
          isCorrect: i <= this.correctAnswers // Primeras X son correctas
        });
      }
    }
    
    console.log('Estado de preguntas generado:', this.questionsStatus);
  }

  // Ver respuestas incorrectas
  reviewIncorrect() {
    console.log('Revisando respuestas incorrectas...');
    // TODO: Implementar vista detallada de respuestas incorrectas
    // Podría ser una nueva página o un modal
  }

  // Hacer nuevo test
  takeNewTest() {
    console.log('Iniciando nuevo test...');
    
    // Limpiar resultados anteriores
    localStorage.removeItem('current_test_results');
    
    // Navegar de vuelta a civil-escrito para empezar un nuevo test
    this.router.navigate(['/civil/civil-escrito']);
  }

  // Volver al inicio
  goBack() {
    console.log('Volviendo al inicio...');
    
    // Limpiar resultados
    localStorage.removeItem('current_test_results');
    
    // Navegar al inicio de civil
    this.router.navigate(['/civil/civil-escrito']);
  }
}
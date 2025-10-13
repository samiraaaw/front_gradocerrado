import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { BottomNavComponent } from '../../../../shared/components/bottom-nav/bottom-nav.component';

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
  standalone: true,
  imports: [IonicModule, CommonModule, BottomNavComponent]  // ✅ AGREGADO IonicModule
})
export class ResumenTestCivilPage implements OnInit {

  testResults: any = null;
  questionsStatus: QuestionResult[] = [];
  
  correctAnswers = 0;
  incorrectAnswers = 0;
  totalQuestions = 0;
  percentage = 0;
  
  levelTitle: string = 'NIVEL PRINCIPIANTE';
  levelSubtitle: string = '¡Sigue practicando!';
  
  timeUsed: string = '0:00 min';

  constructor(private router: Router) { }

  ngOnInit() {
    this.loadTestResults();
    this.generateQuestionsStatus();
    this.setLevelInfo();
  }

  loadTestResults() {
    try {
      const savedResults = localStorage.getItem('current_test_results');
      console.log('📊 Cargando resultados del test:', savedResults);
      
      if (savedResults) {
        this.testResults = JSON.parse(savedResults);
        
        this.correctAnswers = this.testResults.correctAnswers || 0;
        this.incorrectAnswers = this.testResults.incorrectAnswers || 0;
        this.totalQuestions = this.testResults.totalQuestions || 0;
        this.percentage = this.testResults.percentage || 0;
        this.timeUsed = this.testResults.timeUsedFormatted || '0:00 min';
      } else {
        console.warn('⚠️ No se encontraron resultados guardados');
        this.percentage = 0;
      }
    } catch (error) {
      console.error('❌ Error cargando resultados:', error);
      this.percentage = 0;
    }
  }

  generateQuestionsStatus() {
    this.questionsStatus = [];
    
    if (this.testResults && this.testResults.allQuestions) {
      this.questionsStatus = this.testResults.allQuestions.map((q: any) => ({
        questionNumber: q.questionNumber,
        isCorrect: q.isCorrect,
        userAnswer: q.userAnswer,
        correctAnswer: q.correctAnswer
      }));
    } else {
      for (let i = 1; i <= this.totalQuestions; i++) {
        this.questionsStatus.push({
          questionNumber: i,
          isCorrect: i <= this.correctAnswers
        });
      }
    }
    
    console.log('✅ Estado de preguntas generado:', this.questionsStatus);
  }

  setLevelInfo() {
    if (this.percentage >= 80) {
      this.levelTitle = 'NIVEL AVANZADO';
      this.levelSubtitle = '¡Excelente dominio!';
    } else if (this.percentage >= 60) {
      this.levelTitle = 'NIVEL INTERMEDIO';
      this.levelSubtitle = '¡Excelente progreso!';
    } else {
      this.levelTitle = 'NIVEL PRINCIPIANTE';
      this.levelSubtitle = '¡Sigue practicando!';
    }
  }

  reviewIncorrect() {
    console.log('Revisando respuestas incorrectas...');
  }

  takeNewTest() {
    console.log('Iniciando nuevo test...');
    localStorage.removeItem('current_test_results');
    this.router.navigate(['/civil/civil-escrito']);
  }

  goBack() {
    console.log('Volviendo al inicio...');
    localStorage.removeItem('current_test_results');
    this.router.navigate(['/civil/civil-escrito']);
  }
}
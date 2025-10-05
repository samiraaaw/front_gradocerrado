import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { BottomNavComponent } from '../../../../shared/components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-resumen-test-civil-oral',
  templateUrl: './resumen-test-civil-oral.page.html',
  styleUrls: ['./resumen-test-civil-oral.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, BottomNavComponent]
})
export class ResumenTestCivilOralPage implements OnInit {
  
  // Variables de resultados
  correctAnswers: number = 0;
  incorrectAnswers: number = 0;
  totalQuestions: number = 5;
  percentage: number = 0;
  timeUsed: string = '0:00 min';
  
  // Variables de nivel
  levelTitle: string = 'NIVEL PRINCIPIANTE';
  levelSubtitle: string = '¡Sigue practicando!';
  
  // Estado de preguntas
  questionsStatus: any[] = [];
  
  // Resultados completos
  testResults: any = null;

  constructor(private router: Router) { }

  ngOnInit() {
    this.loadTestResults();
    this.generateQuestionsStatus();
    this.setLevelInfo();
  }

  // Cargar resultados del test desde localStorage
  loadTestResults() {
    try {
      const savedResults = localStorage.getItem('current_oral_test_results');
      console.log('📊 Cargando resultados del test oral:', savedResults);
      
      if (savedResults) {
        this.testResults = JSON.parse(savedResults);
        
        this.correctAnswers = this.testResults.correctAnswers || 0;
        this.incorrectAnswers = this.testResults.incorrectAnswers || 0;
        this.totalQuestions = this.testResults.totalQuestions || 5;
        this.percentage = this.testResults.percentage || 0;
        this.timeUsed = this.testResults.timeUsedFormatted || '0:00 min';
      } else {
        console.warn('⚠️ No se encontraron resultados guardados');
        this.correctAnswers = 0;
        this.incorrectAnswers = 5;
        this.totalQuestions = 5;
        this.percentage = 0;
      }
    } catch (error) {
      console.error('❌ Error cargando resultados:', error);
      this.correctAnswers = 0;
      this.incorrectAnswers = 5;
      this.totalQuestions = 5;
      this.percentage = 0;
    }
  }

  // Generar el estado de cada pregunta para los círculos
  generateQuestionsStatus() {
    this.questionsStatus = [];
    
    if (this.testResults && this.testResults.questionDetails) {
      this.questionsStatus = this.testResults.questionDetails.map((q: any) => ({
        questionNumber: q.questionNumber,
        isCorrect: q.correct
      }));
    } else {
      // Generar estado basado en correctas/incorrectas
      for (let i = 1; i <= this.totalQuestions; i++) {
        this.questionsStatus.push({
          questionNumber: i,
          isCorrect: i <= this.correctAnswers
        });
      }
    }
    
    console.log('✅ Estado de preguntas generado:', this.questionsStatus);
  }

  // Determinar nivel según porcentaje
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

  // Hacer nuevo test
  takeNewTest() {
    console.log('🔄 Iniciando nuevo test oral...');
    localStorage.removeItem('current_oral_test_results');
    this.router.navigate(['/civil/civil-oral']);
  }

  // Volver al inicio
  goBack() {
    console.log('🏠 Volviendo al inicio...');
    localStorage.removeItem('current_oral_test_results');
    this.router.navigate(['/civil/civil-oral']);
  }
}
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

  // Datos del resumen
  correctAnswers: number = 4;
  incorrectAnswers: number = 1;
  totalQuestions: number = 5;
  percentage: number = 85;
  timeUsed: string = '8:45';
  
  // Estado de cada pregunta para los círculos
  questionsStatus = [
    { questionNumber: 1, isCorrect: true },
    { questionNumber: 2, isCorrect: true },
    { questionNumber: 3, isCorrect: true },
    { questionNumber: 4, isCorrect: false },
    { questionNumber: 5, isCorrect: true }
  ];

  constructor(private router: Router) { }

  ngOnInit() {
    this.loadTestResults();
  }

  // Cargar resultados del test
  loadTestResults() {
    console.log('Cargando resultados del test oral...');
  }

  // Ver respuestas incorrectas
  reviewIncorrect() {
    console.log('Revisando respuestas incorrectas...');
    // TODO: Implementar vista detallada de respuestas incorrectas
  }

  // Hacer nuevo test oral
  takeNewTest() {
    console.log('Iniciando nuevo test oral...');
    this.router.navigate(['/civil/civil-oral']);
  }

  // Volver al inicio
  goBack() {
    console.log('Volviendo al inicio...');
    this.router.navigate(['/civil']);
  }
}
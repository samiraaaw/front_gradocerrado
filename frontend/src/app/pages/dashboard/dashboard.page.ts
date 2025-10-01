import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, BottomNavComponent]
})
export class DashboardPage implements OnInit {

  // Variables para datos del usuario
  userName: string = 'Estudiante';
  userLevel: string = 'Intermedio';
  userStreak: number = 0; // 🔥 Racha del usuario (hojitas)

  // Variables para estadísticas generales
  totalSessions: number = 0;
  totalQuestions: number = 0;
  totalCorrectAnswers: number = 0;
  overallSuccessRate: number = 0;
  currentGoal: number = 200; // 🎯 Meta actual de preguntas

  // Variables para el gráfico principal
  chartData: any[] = [];
  
  // Variables para estadísticas por área legal
  areaStats: any[] = [];
  
  // Variables para sesiones recientes
  recentSessions: any[] = [];
  
  // Variables de control
  isLoading: boolean = true;
  selectedTimeFrame: string = 'week'; // week, month, all

  constructor(
    private router: Router,
    private apiService: ApiService
  ) { }

  ngOnInit() {
    this.loadDashboardData();
  }

  // Cargar todos los datos del dashboard
  async loadDashboardData() {
    this.isLoading = true;
    
    try {
      // Por ahora usamos datos de ejemplo mientras conectamos con la API
      this.loadMockData();
      
      // TODO: Implementar llamadas reales a la API
      // await this.loadUserStats();
      // await this.loadSessionStats();
      // await this.loadAreaStats();
      
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
      this.loadMockData(); // Fallback a datos de ejemplo
    } finally {
      this.isLoading = false;
    }
  }

  // Cargar datos de ejemplo (temporal)
  loadMockData() {
    // Datos del usuario
    this.userName = 'María González';
    this.userLevel = 'Intermedio';
    this.userStreak = 7; // 🔥 7 días de racha consecutiva

    // Estadísticas generales
    this.totalSessions = 12;
    this.totalQuestions = 156;
    this.totalCorrectAnswers = 118;
    this.overallSuccessRate = Math.round((this.totalCorrectAnswers / this.totalQuestions) * 100);
    
    // Calcular meta progresiva
    this.currentGoal = this.calculateProgressiveGoal(this.totalQuestions);

    // Datos para el gráfico principal (últimos 7 días)
    this.chartData = [
      { date: 'Lun', civil: 8, procesal: 5, total: 13 },
      { date: 'Mar', civil: 6, procesal: 7, total: 13 },
      { date: 'Mié', civil: 10, procesal: 3, total: 13 },
      { date: 'Jue', civil: 7, procesal: 8, total: 15 },
      { date: 'Vie', civil: 9, procesal: 6, total: 15 },
      { date: 'Sáb', civil: 5, procesal: 9, total: 14 },
      { date: 'Dom', civil: 11, procesal: 4, total: 15 }
    ];

    // Estadísticas por área legal
    this.areaStats = [
      {
        area: 'Derecho Civil',
        totalQuestions: 89,
        correctAnswers: 71,
        successRate: 80,
        color: '#3B82F6',
        sessions: 7
      },
      {
        area: 'Derecho Procesal',
        totalQuestions: 67,
        correctAnswers: 47,
        successRate: 70,
        color: '#F59E0B',
        sessions: 5
      }
    ];

    // Sesiones recientes
    this.recentSessions = [
      {
        id: 1,
        date: '2025-09-28',
        area: 'Civil',
        duration: '25 min',
        questions: 15,
        correct: 12,
        successRate: 80
      },
      {
        id: 2,
        date: '2025-09-27',
        area: 'Procesal',
        duration: '18 min',
        questions: 12,
        correct: 9,
        successRate: 75
      },
      {
        id: 3,
        date: '2025-09-26',
        area: 'Civil',
        duration: '30 min',
        questions: 20,
        correct: 16,
        successRate: 80
      }
    ];
  }

  // Cambiar marco temporal
  changeTimeFrame(timeFrame: string) {
    this.selectedTimeFrame = timeFrame;
    this.loadDashboardData();
  }

  // Navegar a una sesión específica
  goToSession(sessionId: number) {
    console.log('Navegar a sesión:', sessionId);
    // TODO: Implementar navegación a detalle de sesión
  }

  // Navegar a estadísticas detalladas de un área
  goToAreaDetails(area: string) {
    console.log('Ver detalles de:', area);
    // TODO: Implementar navegación a detalles por área
  }

  // Iniciar nueva sesión de estudio
  startNewSession() {
    this.router.navigate(['/home']);
  }

  // Obtener el color de la barra de progreso según el porcentaje
  getProgressColor(percentage: number): string {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'danger';
  }

  // Obtener el máximo valor para los gráficos
  getMaxValue(): number {
    return Math.max(...this.chartData.map(d => d.total)) + 2;
  }

  // Calcular altura de barra para el gráfico
  getBarHeight(value: number, type: 'civil' | 'procesal'): number {
    const maxValue = this.getMaxValue();
    return (value / maxValue) * 100;
  }

  // 🆕 Calcular offset para el gráfico donut de preguntas
  getDonutOffset(): number {
    const circumference = 219.8; // 2 * PI * 35
    const progress = this.totalQuestions / this.currentGoal;
    return circumference * (1 - progress);
  }

  // 🆕 Calcular offset para el velocímetro de precisión
  getGaugeOffset(): number {
    const maxDash = 110;
    const progress = this.overallSuccessRate / 100;
    return maxDash * (1 - progress);
  }

  // 🎯 Calcular meta progresiva basada en el número de preguntas
  calculateProgressiveGoal(questions: number): number {
    if (questions < 200) return 200;
    if (questions < 250) return 250;
    if (questions < 300) return 300;
    if (questions < 350) return 350;
    if (questions < 400) return 400;
    if (questions < 450) return 450;
    if (questions < 500) return 500;
    
    // Para números mayores, redondear al siguiente múltiplo de 50
    return Math.ceil(questions / 50) * 50;
  }
    goBack() {
    this.router.navigate(['/home']);
  }
}
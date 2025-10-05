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

  userName: string = 'Estudiante';
  userLevel: string = 'Intermedio';
  userStreak: number = 0;

  totalSessions: number = 0;
  totalQuestions: number = 0;
  totalCorrectAnswers: number = 0;
  overallSuccessRate: number = 0;
  currentGoal: number = 200;
  currentSessionGoal: number = 50;

  chartData: any[] = [];
  areaStats: any[] = [];
  recentSessions: any[] = [];
  
  isLoading: boolean = true;
  selectedTimeFrame: string = 'week';

  constructor(
    private router: Router,
    private apiService: ApiService
  ) { }

  ngOnInit() {
    this.loadDashboardData();
  }

  // MÉTODO PRINCIPAL - USA EL ID DEL USUARIO LOGUEADO
  async loadDashboardData() {
    this.isLoading = true;
    
    try {
      // Obtener usuario actual de localStorage
      const currentUser = this.apiService.getCurrentUser();
      
      if (!currentUser || !currentUser.id) {
        console.error('No hay usuario logueado');
        this.router.navigate(['/login']);
        return;
      }

      const studentId = currentUser.id;
      this.userName = currentUser.name || 'Estudiante';

      console.log('Cargando dashboard para estudiante:', studentId, this.userName);

      // CARGAR ESTADÍSTICAS GENERALES
      try {
        const statsResponse = await this.apiService.getDashboardStats(studentId).toPromise();
        if (statsResponse && statsResponse.success) {
          const stats = statsResponse.data;
          this.totalSessions = stats.totalTests || 0;
          this.totalQuestions = stats.totalQuestions || 0;
          this.totalCorrectAnswers = stats.correctAnswers || 0;
          this.overallSuccessRate = Math.round(stats.successRate || 0);
          this.userStreak = stats.streak || 0;
          
          console.log('Estadísticas cargadas:', stats);
        }
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
      }

      // CARGAR ESTADÍSTICAS POR ÁREA
      try {
        const areaResponse = await this.apiService.getAreaStats(studentId).toPromise();
        if (areaResponse && areaResponse.success) {
          this.areaStats = areaResponse.data.map((area: any) => ({
            name: area.area,
            questions: area.questions,
            correct: area.correct,
            successRate: Math.round(area.successRate)
          }));
          
          console.log('Áreas cargadas:', this.areaStats);
        }
      } catch (error) {
        console.error('Error cargando áreas:', error);
      }

      // CARGAR SESIONES RECIENTES
      try {
        const sessionsResponse = await this.apiService.getRecentSessions(studentId, 5).toPromise();
        if (sessionsResponse && sessionsResponse.success) {
          this.recentSessions = sessionsResponse.data.map((session: any) => ({
            id: session.id,
            date: new Date(session.date).toLocaleDateString('es-ES'),
            questions: session.questions,
            correct: session.correct,
            successRate: Math.round(session.successRate)
          }));
          
          console.log('Sesiones cargadas:', this.recentSessions);
        }
      } catch (error) {
        console.error('Error cargando sesiones:', error);
      }

      // Generar datos del gráfico (por ahora simulados, pero respetan si el usuario es nuevo)
      this.generateChartData();

    } catch (error) {
      console.error('Error general:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // GENERAR BADGES DE SESIONES DINÁMICAMENTE
  getSessionBadges(): number[] {
    const maxBadges = 5;
    return Array(maxBadges).fill(0).map((_, i) => i);
  }

  // NUEVO: Obtener mensaje motivacional basado en sesiones
  getMotivationalMessage(): string {
    if (this.totalSessions === 0) {
      return '¡Es un buen momento para empezar!';
    } else if (this.totalSessions < 10) {
      return '¡Sigue así!';
    } else if (this.totalSessions < 50) {
      return '¡Excelente progreso!';
    } else {
      return '¡Eres imparable!';
    }
  }

  generateChartData() {
    const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    
    // Si el usuario es nuevo (sin sesiones), mostrar todo en cero
    if (this.totalSessions === 0) {
      this.chartData = daysOfWeek.map(day => ({
        date: day,
        civil: 0,
        procesal: 0,
        total: 0
      }));
      return;
    }
    
    // Si tiene sesiones, generar datos simulados
    // TODO: Reemplazar con datos reales del backend cuando esté disponible el endpoint
    this.chartData = daysOfWeek.map(day => {
      const dailyQuestions = Math.floor(Math.random() * 15) + 5;
      const civilQuestions = Math.floor(dailyQuestions * 0.6);
      const procesalQuestions = dailyQuestions - civilQuestions;
      
      return {
        date: day,
        civil: civilQuestions,
        procesal: procesalQuestions,
        total: dailyQuestions
      };
    });
  }

  changeTimeFrame(timeFrame: string) {
    this.selectedTimeFrame = timeFrame;
    this.loadDashboardData();
  }

  goToSession(sessionId: number) {
    console.log('Navegar a sesión:', sessionId);
  }

  goToAreaDetails(area: string) {
    console.log('Ver detalles de:', area);
  }

  startNewSession() {
    this.router.navigate(['/home']);
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  getProgressColor(percentage: number): string {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'danger';
  }

  getMaxValue(): number {
    if (!this.chartData || this.chartData.length === 0) return 20;
    const maxTotal = Math.max(...this.chartData.map(d => d.total));
    return maxTotal === 0 ? 20 : maxTotal + 2;
  }

  // MÉTODOS PARA LOS GRÁFICOS
  getBarHeight(value: number, type: 'civil' | 'procesal'): number {
    const maxValue = this.getMaxValue();
    if (maxValue === 0) return 0;
    return (value / maxValue) * 100;
  }

  getDonutOffset(): number {
    const circumference = 219.8;
    const progress = Math.min(this.totalQuestions / this.currentGoal, 1);
    return circumference * (1 - progress);
  }

  getGaugeOffset(): number {
    const maxDash = 110;
    const progress = Math.min(this.overallSuccessRate / 100, 1);
    return maxDash * (1 - progress);
  }

  getGaugeOffsetLarge(): number {
    const maxDash = 125.6;
    const progress = Math.min(this.overallSuccessRate / 100, 1);
    return maxDash * (1 - progress);
  }

  calculateSessionGoal(sessions: number): number {
    if (sessions < 50) return 50;
    if (sessions < 100) return 100;
    if (sessions < 150) return 150;
    if (sessions < 200) return 200;
    if (sessions < 250) return 250;
    
    return Math.ceil(sessions / 50) * 50;
  }

  calculateProgressiveGoal(questions: number): number {
    if (questions < 200) return 200;
    if (questions < 250) return 250;
    if (questions < 300) return 300;
    if (questions < 350) return 350;
    if (questions < 400) return 400;
    if (questions < 450) return 450;
    if (questions < 500) return 500;
    
    return Math.ceil(questions / 50) * 50;
  }

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                     'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      
      return `${day} ${month} ${year}`;
    } catch (error) {
      return dateString;
    }
  }
}
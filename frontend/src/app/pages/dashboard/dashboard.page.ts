import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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

  @ViewChild('areaStatsSection', { read: ElementRef }) areaStatsSection!: ElementRef;

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
  // 🆕 DEBILIDADES
  topTemasDebiles: any[] = [];
  resumenDebilidades: any = null;
  
  isLoading: boolean = true;
  selectedTimeFrame: string = 'week';
  expandedArea: string | null = null;
  expandedTema: string | null = null;
  isGeneralExpanded: boolean = false;

  constructor(
    private router: Router,
    private apiService: ApiService
  ) { }

  ngOnInit() {
    this.loadDashboardData();
  }

  async loadDashboardData() {
    this.isLoading = true;
    
    try {
      const currentUser = this.apiService.getCurrentUser();
      
      if (!currentUser || !currentUser.id) {
        console.error('No hay usuario logueado');
        this.router.navigate(['/login']);
        return;
      }

      const studentId = currentUser.id;
      const fullName = currentUser.name || 'Estudiante';
      this.userName = fullName.split(' ')[0];
      
      console.log('Cargando dashboard para estudiante:', studentId);

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

      try {
        const areaResponse = await this.apiService.getHierarchicalStats(studentId).toPromise();        
        if (areaResponse && areaResponse.success) {
          console.log('Datos jerárquicos:', areaResponse.data);
          
          this.areaStats = [];
          
          areaResponse.data.forEach((item: any) => {
            if (item.type === 'general') {
              this.areaStats.push({
                area: item.area,
                sessions: item.sessions,
                totalQuestions: item.totalQuestions,
                correctAnswers: item.correctAnswers,
                successRate: Math.round(item.successRate || 0),
                isGeneral: true,
                colorBarra: 'verde',
                temas: []
              });
            } else if (item.type === 'area') {
              const temasConNuevoCalculo = item.temas.map((tema: any) => {
                const subtemasConPorcentaje = tema.subtemas.map((subtema: any) => ({
                  subtemaId: subtema.subtemaId,
                  subtemaNombre: subtema.subtemaNombre,
                  totalPreguntas: subtema.totalPreguntas,
                  preguntasCorrectas: subtema.preguntasCorrectas,
                  porcentajeAcierto: this.calculateSubtemaSuccessRate(subtema.preguntasCorrectas)
                }));

                const porcentajeTema = this.calculateTemaSuccessRate(subtemasConPorcentaje);

                return {
                  temaId: tema.temaId,
                  temaNombre: tema.temaNombre,
                  totalPreguntas: tema.totalPreguntas,
                  preguntasCorrectas: tema.preguntasCorrectas,
                  porcentajeAcierto: porcentajeTema,
                  subtemas: subtemasConPorcentaje
                };
              });

              const totalCorrectas = temasConNuevoCalculo.reduce((sum: number, tema: any) => 
                sum + tema.preguntasCorrectas, 0);
              const totalPreguntas = temasConNuevoCalculo.reduce((sum: number, tema: any) => 
                sum + tema.totalPreguntas, 0);
              const porcentajeArea = temasConNuevoCalculo.length > 0 
                ? Math.round(temasConNuevoCalculo.reduce((sum: number, tema: any) => 
                    sum + tema.porcentajeAcierto, 0) / temasConNuevoCalculo.length)
                : 0;
              
              this.areaStats.push({
                area: item.area,
                sessions: 0,
                totalQuestions: totalPreguntas,
                correctAnswers: totalCorrectas,
                successRate: porcentajeArea,
                isGeneral: false,
                colorBarra: 'naranja',
                temas: temasConNuevoCalculo
              });
            }
          });

          this.areaStats.push({
            area: 'Derecho Procesal',
            sessions: 0,
            totalQuestions: 0,
            correctAnswers: 0,
            successRate: 0,
            isGeneral: false,
            colorBarra: 'azul',
            temas: []
          });
          
          console.log('Estadísticas procesadas:', this.areaStats);
        }
      } catch (error) {
        console.error('Error cargando estadísticas por área:', error);
      }

      try {
        const sessionsResponse = await this.apiService.getRecentSessions(studentId, 5).toPromise();
        if (sessionsResponse && sessionsResponse.success) {
          this.recentSessions = sessionsResponse.data;
          console.log('Sesiones recientes:', this.recentSessions);
        }
      } catch (error) {
        console.error('Error cargando sesiones recientes:', error);
      }

      // 🆕 CARGAR DEBILIDADES
      try {
        const debilesResponse = await this.apiService.getTopTemasDebiles(studentId).toPromise();
        if (debilesResponse && debilesResponse.success) {
          this.topTemasDebiles = debilesResponse.data || [];
          console.log('Top temas débiles:', this.topTemasDebiles);
        }
      } catch (error) {
        console.error('Error cargando temas débiles:', error);
      }

      try {
        const resumenResponse = await this.apiService.getResumenDebilidades(studentId).toPromise();
        if (resumenResponse && resumenResponse.success) {
          this.resumenDebilidades = resumenResponse.data;
          console.log('Resumen debilidades:', this.resumenDebilidades);
        }
      } catch (error) {
        console.error('Error cargando resumen debilidades:', error);
      }

      await this.generateChartData();

      this.currentGoal = this.calculateProgressiveGoal(this.totalQuestions);
      this.currentSessionGoal = this.calculateSessionGoal(this.totalSessions);

    } catch (error) {
      console.error('Error general en loadDashboardData:', error);
    } finally {
      this.isLoading = false;
    }
  }

  calculateAreaSuccessRate(temas: any[]): number {
    if (!temas || temas.length === 0) return 0;
    
    const totalPorcentaje = temas.reduce((sum: number, tema: any) => {
      return sum + tema.porcentajeAcierto;
    }, 0);
    
    return Math.round(totalPorcentaje / temas.length);
  }

  calculateTemaSuccessRate(subtemas: any[]): number {
    if (!subtemas || subtemas.length === 0) return 0;
    
    const totalPorcentaje = subtemas.reduce((sum: number, subtema: any) => {
      return sum + subtema.porcentajeAcierto;
    }, 0);
    
    return Math.round(totalPorcentaje / subtemas.length);
  }

  calculateSubtemaSuccessRate(correctas: number): number {
    const MAX_CORRECTAS = 100;
    const porcentaje = Math.min((correctas / MAX_CORRECTAS) * 100, 100);
    return Math.round(porcentaje);
  }

  toggleGeneralExpansion() {
    this.isGeneralExpanded = !this.isGeneralExpanded;
  }

  toggleAreaExpansion(areaName: string) {
    if (this.expandedArea === areaName) {
      this.expandedArea = null;
    } else {
      this.expandedArea = areaName;
    }
  }

  isAreaExpanded(areaName: string): boolean {
    return this.expandedArea === areaName;
  }

  toggleTemaExpansion(temaNombre: string) {
    if (this.expandedTema === temaNombre) {
      this.expandedTema = null;
    } else {
      this.expandedTema = temaNombre;
    }
  }

  isTemaExpanded(temaNombre: string): boolean {
    return this.expandedTema === temaNombre;
  }

  getTemasForArea(areaName: string): any[] {
    const area = this.areaStats.find(a => a.area === areaName && !a.isGeneral);
    return area && area.temas ? area.temas : [];
  }

  getSubtemasForTema(tema: any): any[] {
    return tema && tema.subtemas ? tema.subtemas : [];
  }

  getGeneralArea(): any {
    return this.areaStats.find(a => a.isGeneral);
  }

  getNonGeneralAreas(): any[] {
    return this.areaStats.filter(a => !a.isGeneral);
  }

  scrollToArea(areaName: string) {
    const element = document.getElementById('area-' + areaName);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        this.toggleAreaExpansion(areaName);
      }, 500);
    }
  }

  async generateChartData() {
    try {
      const currentUser = this.apiService.getCurrentUser();
      if (!currentUser || !currentUser.id) return;

      const progressResponse = await this.apiService.getWeeklyProgress(currentUser.id).toPromise();
      if (progressResponse && progressResponse.success) {
        this.chartData = progressResponse.data;
      }
    } catch (error) {
      console.error('Error generando datos del gráfico:', error);
      this.chartData = [];
    }
  }

  changeTimeFrame(timeFrame: string) {
    this.selectedTimeFrame = timeFrame;
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  goToSession(sessionId: number) {
    console.log('Navegando a sesión:', sessionId);
  }

  startNewSession() {
    this.router.navigate(['/civil']);
  }

  navigateToHome() {
    this.router.navigate(['/home']);
  }

  getMaxValue(): number {
    if (this.chartData.length === 0) return 10;
    const maxCivil = Math.max(...this.chartData.map(d => d.civil || 0));
    const maxProcesal = Math.max(...this.chartData.map(d => d.procesal || 0));
    const maxTotal = Math.max(maxCivil, maxProcesal);
    return maxTotal === 0 ? 10 : maxTotal + 2;
  }

  getBarHeight(value: number, type: 'civil' | 'procesal'): number {
    const maxValue = this.getMaxValue();
    if (maxValue === 0) return 0;
    return (value / maxValue) * 100;
  }

  getDonutOffset(): number {
    const circumference = 219.8;
    if (this.totalQuestions === 0) {
      return circumference;
    }
    const progress = Math.min(this.totalQuestions / this.currentGoal, 1);
    return circumference * (1 - progress);
  }

  getGaugeOffset(): number {
    const maxDash = 157;
    const progress = Math.min(this.overallSuccessRate / 100, 1);
    return maxDash * (1 - progress);
  }

  getGaugeOffsetLarge(): number {
    const maxDash = 125.6;
    if (this.overallSuccessRate === 0) {
      return maxDash;
    }
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
}
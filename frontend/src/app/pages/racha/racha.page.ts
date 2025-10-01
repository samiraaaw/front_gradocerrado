import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-racha',
  templateUrl: './racha.page.html',
  styleUrls: ['./racha.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, BottomNavComponent]
})
export class RachaPage implements OnInit {

  // Datos de la racha actual
  currentStreak: number = 12; // Días consecutivos actuales
  longestStreak: number = 25; // Mejor racha histórica
  totalDays: number = 156; // Total de días estudiados
  
  // Calendario de racha (últimos 30 días)
  streakCalendar: any[] = [];
  
  // Logros desbloqueados
  achievements: any[] = [];
  
  // Siguiente meta
  nextMilestone: number = 15;

  constructor(private router: Router) { }

  ngOnInit() {
    this.loadStreakData();
  }

  // Cargar datos de la racha
  loadStreakData() {
    // Generar calendario de los últimos 30 días
    this.streakCalendar = this.generateStreakCalendar();
    
    // Cargar logros
    this.achievements = [
      { id: 1, name: '🔥 Primer Día', description: 'Iniciaste tu racha', unlocked: true },
      { id: 2, name: '💪 5 Días', description: 'Racha de 5 días', unlocked: true },
      { id: 3, name: '🌟 10 Días', description: 'Racha de 10 días', unlocked: true },
      { id: 4, name: '🏆 15 Días', description: 'Racha de 15 días', unlocked: false },
      { id: 5, name: '👑 20 Días', description: 'Racha de 20 días', unlocked: false },
      { id: 6, name: '🎯 1 Mes', description: 'Racha de 30 días', unlocked: false },
      { id: 7, name: '💎 50 Días', description: 'Racha de 50 días', unlocked: false },
      { id: 8, name: '🌈 100 Días', description: 'Racha de 100 días', unlocked: false }
    ];
    
    // Calcular siguiente meta
    this.calculateNextMilestone();
  }

  // Generar calendario de racha (últimos 30 días)
  generateStreakCalendar(): any[] {
    const calendar = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Simular si completó ese día (los últimos 12 días sí)
      const completed = i < this.currentStreak;
      
      calendar.push({
        date: date,
        day: date.getDate(),
        dayName: this.getDayName(date.getDay()),
        completed: completed,
        isToday: i === 0
      });
    }
    
    return calendar;
  }

  // Obtener nombre del día
  getDayName(dayIndex: number): string {
    const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    return days[dayIndex];
  }

  // Calcular siguiente meta
  calculateNextMilestone() {
    const milestones = [5, 10, 15, 20, 30, 50, 100, 200];
    this.nextMilestone = milestones.find(m => m > this.currentStreak) || 200;
  }

  // Calcular progreso hacia siguiente meta
  getProgressToNextMilestone(): number {
    const previousMilestone = this.getPreviousMilestone();
    const progress = ((this.currentStreak - previousMilestone) / (this.nextMilestone - previousMilestone)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }

  // Obtener meta anterior
  getPreviousMilestone(): number {
    const milestones = [0, 5, 10, 15, 20, 30, 50, 100];
    const previousMilestones = milestones.filter(m => m < this.currentStreak);
    return previousMilestones.length > 0 ? previousMilestones[previousMilestones.length - 1] : 0;
  }

  // Volver atrás
  goBack() {
    this.router.navigate(['/home']);
  }

  // Ir a estudiar
  goToStudy() {
    this.router.navigate(['/home']);
  }

  // Obtener mensaje motivacional
  getMotivationalMessage(): string {
    if (this.currentStreak >= 30) return '¡Eres imparable! 🔥';
    if (this.currentStreak >= 20) return '¡Increíble dedicación! 🌟';
    if (this.currentStreak >= 10) return '¡Vas muy bien! 💪';
    if (this.currentStreak >= 5) return '¡Buen comienzo! 🎯';
    return '¡Sigue así! 🚀';
  }
}
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, BottomNavComponent]
})
export class NotificationsPage implements OnInit {

  notifications: any[] = [];
  unreadCount: number = 0;

  constructor(private router: Router) { }

  ngOnInit() {
    this.loadNotifications();
  }

  // Cargar notificaciones
  loadNotifications() {
    this.notifications = [
      {
        id: 1,
        type: 'streak',
        icon: 'flame',
        iconColor: '#f59e0b',
        title: '¡Racha de 12 días!',
        message: 'Estás en una racha increíble. ¡No la pierdas!',
        time: 'Hace 2 horas',
        read: false,
        action: '/racha'
      },
      {
        id: 2,
        type: 'achievement',
        icon: 'trophy',
        iconColor: '#10b981',
        title: 'Logro desbloqueado',
        message: 'Has completado 10 sesiones de estudio',
        time: 'Hace 5 horas',
        read: false,
        action: '/racha'
      },
      {
        id: 3,
        type: 'reminder',
        icon: 'alarm',
        iconColor: '#3b82f6',
        title: 'Hora de estudiar',
        message: 'Tu sesión diaria de Derecho Civil te espera',
        time: 'Hace 1 día',
        read: true,
        action: '/civil'
      },
      {
        id: 4,
        type: 'goal',
        icon: 'checkmark-circle',
        iconColor: '#8b5cf6',
        title: 'Meta alcanzada',
        message: 'Has respondido 200 preguntas este mes',
        time: 'Hace 2 días',
        read: true,
        action: '/dashboard'
      },
      {
        id: 5,
        type: 'tip',
        icon: 'bulb',
        iconColor: '#f59e0b',
        title: 'Consejo del día',
        message: 'Estudiar en sesiones de 25 minutos mejora la retención',
        time: 'Hace 3 días',
        read: true,
        action: null
      }
    ];
    
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }

  // Marcar notificación como leída
  markAsRead(notification: any) {
    if (!notification.read) {
      notification.read = true;
      this.unreadCount--;
    }
    
    if (notification.action) {
      this.router.navigate([notification.action]);
    }
  }

  // Marcar todas como leídas
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.unreadCount = 0;
  }

  // Eliminar notificación
  deleteNotification(notification: any, event: Event) {
    event.stopPropagation();
    const index = this.notifications.indexOf(notification);
    if (index > -1) {
      this.notifications.splice(index, 1);
      if (!notification.read) {
        this.unreadCount--;
      }
    }
  }

  // Limpiar todas
  clearAll() {
    this.notifications = [];
    this.unreadCount = 0;
  }

  // Volver a home
  goBack() {
    this.router.navigate(['/home']);
  }

  // Ir a configuración
  goToSettings() {
    this.router.navigate(['/settings']);
  }
}
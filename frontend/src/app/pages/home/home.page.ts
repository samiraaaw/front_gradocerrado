import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component'; // AGREGADO

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, BottomNavComponent] // AGREGADO BottomNavComponent
})
export class HomePage implements OnInit {

  // Datos del usuario
  userName: string = 'Lionel';
  userCoins: number = 3;
  
  // Datos de progreso
  dailyProgress = {
    completed: 3,
    total: 5,
    percentage: 60
  };

  // Datos de resultados
  results = {
    civil: {
      score: 3,
      total: 10,
      percentage: 30
    },
    procesal: {
      score: 8,
      total: 10,
      percentage: 80
    }
  };

  constructor(private router: Router) { }

  ngOnInit() {
    this.loadUserData();
  }

  // Cargar datos del usuario
  loadUserData() {
    // Obtener datos del localStorage si existen
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      const user = JSON.parse(userData);
      this.userName = user.name || 'Lionel';
    }
  }

  // Navegar a Civil
  goToCivil() {
    this.router.navigate(['/civil']);
  }

  // Navegar a Procesal (por ahora redirige a civil)
  goToProcesal() {
    console.log('Navegando a Procesal...');
    // Cuando tengas la página de procesal, cambiar por:
    // this.router.navigate(['/procesal']);
    this.router.navigate(['/civil']);
  }

  // Métodos para la navegación inferior
  goToStats() {
    console.log('Ir a estadísticas');
    // this.router.navigate(['/stats']);
  }

  openAddMenu() {
    console.log('Abrir menú de agregar');
    // Aquí podrías abrir un modal o menú
  }

  goToNotifications() {
    console.log('Ir a notificaciones');
    // this.router.navigate(['/notifications']);
  }

  goToProfile() {
    console.log('Ir a perfil');
    // this.router.navigate(['/profile']);
  }
}
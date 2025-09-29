import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bottom-nav',
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class BottomNavComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {}

  // Verificar si la ruta actual está activa
  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  // ========================================
  // FUNCIONES DE NAVEGACIÓN ACTUALIZADAS
  // ========================================

  // Navegar a Home - FUNCIÓN PRINCIPAL
  goToHome() {
    console.log('Navegando a Home...');
    this.router.navigate(['/home']);
  }

  // Navegar a Estadísticas
  goToStats() {
    console.log('Ir a estadísticas - Por implementar');
    // Cuando tengas la página de stats:
    // this.router.navigate(['/stats']);
  }

  // Navegar a Racha
  goToRacha() {
    console.log('Navegando a Racha...');
    this.router.navigate(['/racha']);
  }

  // Abrir menú de agregar (función original)
  openAddMenu() {
    console.log('Abrir menú de agregar');
    // Aquí puedes abrir un modal o menú
  }

  // Navegar a Notificaciones
  goToNotifications() {
    console.log('Ir a notificaciones - Por implementar');
    // Cuando tengas la página de notifications:
    // this.router.navigate(['/notifications']);
  }

  // Navegar a Perfil
  goToProfile() {
    console.log('Ir a perfil - Por implementar');
    // Cuando tengas la página de profile:
    // this.router.navigate(['/profile']);
  }

}
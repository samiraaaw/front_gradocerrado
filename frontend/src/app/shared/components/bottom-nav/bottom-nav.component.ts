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

  // Navegar a Home
  goToHome() {
    console.log('Navegando a Home...');
    this.router.navigate(['/home']);
  }

  // Navegar a Dashboard (Estadísticas)
  goToStats() {
    console.log('Navegando a Dashboard...');
    this.router.navigate(['/dashboard']);
  }

  // Navegar a Racha
  goToRacha() {
    console.log('Navegando a Racha...');
    this.router.navigate(['/racha']);
  }

  // Abrir menú de agregar
  openAddMenu() {
    console.log('Abrir menú de agregar');
  }

  // Navegar a Notificaciones
  goToNotifications() {
    console.log('Navegando a Notificaciones...');
    this.router.navigate(['/notifications']);
  }

  // Navegar a Perfil
  goToProfile() {
    console.log('Navegando a Perfil...');
    this.router.navigate(['/profile']);
  }

}
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-felicidades',
  templateUrl: './felicidades.page.html',
  styleUrls: ['./felicidades.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class FelicidadesPage implements OnInit {

  // Array para generar las piezas de confeti
  confettiPieces = Array(20).fill(0);

  constructor(private router: Router) { }

  ngOnInit() {
    // Crear más confeti dinámicamente si es necesario
    this.generateConfetti();
  }

  // Generar confeti adicional
  generateConfetti() {
    // Ya está manejado por el array confettiPieces y CSS
  }

  // Volver atrás (al registro)
  goBack() {
    this.router.navigate(['/registro']);
  }

  // Ir a la página de inicio/home
  goToHome() {
    // Navegar a la página principal de la app
    // Por ahora navegar a civil, después cambiaremos a /home
    this.router.navigate(['/home']);
  }
}
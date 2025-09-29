import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component'; // AGREGADO

@Component({
  selector: 'app-civil',
  templateUrl: './civil.page.html',
  styleUrls: ['./civil.page.scss'],
  standalone: true, // CAMBIO: de false a true para usar imports
  imports: [IonicModule, CommonModule, BottomNavComponent] // AGREGADO
})
export class CivilPage implements OnInit {
  
  constructor(private router: Router) { }
  
  ngOnInit() { }

  goToEscrito() {
    this.router.navigate(['/civil/civil-escrito']);
  }

  goToConversacion() {
    this.router.navigate(['/civil/civil-oral']);
  }

  goToTest() {
    console.log('Ir a Test');
    // Aquí puedes agregar la navegación al test cuando esté listo
  }

  goToMaterialEstudio() {
    console.log('Ir a Material de Estudio');
    // Aquí puedes agregar la navegación cuando esté listo
  }

  goToPlanEstudio() {
    console.log('Ir a Plan de Estudio');
    // Aquí puedes agregar la navegación cuando esté listo
  }

  goToDestacados() {
    console.log('Ir a Destacados');
    // Aquí puedes agregar la navegación cuando esté listo
  }
}
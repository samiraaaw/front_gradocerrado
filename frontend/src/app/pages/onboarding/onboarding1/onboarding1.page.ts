import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-onboarding1',
  templateUrl: './onboarding1.page.html',
  styleUrls: ['./onboarding1.page.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class Onboarding1Page implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  }

  selectAction(action: string) {
    // Navegar directamente sin estado de selección
    if (action === 'continuar') {
      this.router.navigate(['/onboarding2']);
    } else if (action === 'salir') {
      this.router.navigate(['/welcome']);
    }
  }

}
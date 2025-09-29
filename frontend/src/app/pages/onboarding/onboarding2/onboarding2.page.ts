import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-onboarding2',
  templateUrl: './onboarding2.page.html',
  styleUrls: ['./onboarding2.page.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class Onboarding2Page implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  }

  selectAction(action: string) {
    // Navegar directamente sin estado de selección
    if (action === 'continuar') {
      this.router.navigate(['/onboarding3']);
    } else if (action === 'atras') {
      this.router.navigate(['/onboarding1']);
    }
  }

}
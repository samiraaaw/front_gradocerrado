import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-onboarding3',
  templateUrl: './onboarding3.page.html',
  styleUrls: ['./onboarding3.page.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class Onboarding3Page implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  }

  selectAction(action: string) {
  if (action === 'empezar') {
    this.router.navigate(['/welcome2']); // Cambiar a welcome2
  } else if (action === 'atras') {
    this.router.navigate(['/onboarding2']);
  }
}

}
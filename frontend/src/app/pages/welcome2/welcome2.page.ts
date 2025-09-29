import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-welcome2',
  templateUrl: './welcome2.page.html',
  styleUrls: ['./welcome2.page.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class Welcome2Page implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  }

  iniciarSesion() {
    // Por ahora ir a civil, después cambiar a /login
    this.router.navigate(['/login']);
  }

  registro() {
    this.router.navigate(['/registro']);
  }

}
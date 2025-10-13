import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(private router: Router) {
    this.checkSession();
  }

  checkSession() {
    const currentUser = localStorage.getItem('currentUser');
    
    if (currentUser) {
      // Si hay sesión, ir directo a home
      this.router.navigate(['/home']);
    } else {
      // Si no hay sesión, ir a welcome
      this.router.navigate(['/welcome']);
    }
  }
}
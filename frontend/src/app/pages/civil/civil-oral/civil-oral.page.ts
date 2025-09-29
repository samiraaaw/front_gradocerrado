import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-civil-oral',
  templateUrl: './civil-oral.page.html',
  styleUrls: ['./civil-oral.page.scss'],
  standalone: false,
})
export class CivilOralPage implements OnInit {

  // Variables para el mapache cantando
  showSpeech = false;
  showMusicNotes = false;
  currentMessage = '';

  // Mensajes específicos para modo oral
  oralMessages = [
    '¡Hora de practicar con tu voz!',
    '¿Listo para el desafío oral?',
    '¡Tu conocimiento suena genial!',
    '¡Practiquemos juntos!',
    '¡El modo voz es divertido!'
  ];

  constructor(private router: Router) { }

  ngOnInit() {
    // Activar música automáticamente al entrar
    setTimeout(() => {
      this.activateSinging();
    }, 1000);
  }

  // Función para iniciar práctica rápida en modo voz
  startVoicePractice() {
    console.log('Iniciando práctica rápida - modo voz');
    // Navegar a la página de test oral
    this.router.navigate(['/civil/civil-oral/test-oral-civil']);
  }

  // Función cuando el usuario toca el mapache
  mapacheSing() {
    this.activateSinging();
  }

  // Función para activar la animación de canto
  private activateSinging() {
    // Mostrar notas musicales
    this.showMusicNotes = true;
    
    // Mostrar mensaje aleatorio después de un momento
    setTimeout(() => {
      this.currentMessage = this.getRandomOralMessage();
      this.showSpeech = true;
    }, 500);

    // Ocultar todo después de 3 segundos
    setTimeout(() => {
      this.showSpeech = false;
      this.showMusicNotes = false;
    }, 3000);
  }

  // Obtener mensaje aleatorio para modo oral
  private getRandomOralMessage(): string {
    const randomIndex = Math.floor(Math.random() * this.oralMessages.length);
    return this.oralMessages[randomIndex];
  }

}
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-civil-escrito',
  templateUrl: './civil-escrito.page.html',
  styleUrls: ['./civil-escrito.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, BottomNavComponent]
})
export class CivilEscritoPage implements OnInit {
  
  // Propiedades para el mapache
  showSpeech: boolean = false;
  currentMessage: string = '';
  
  // Mensajes del mapache
  private mapacheMessages: string[] = [
    '¡Sigue practicando!',
    '¡Vas muy bien!',
    '¡Excelente progreso!',
    '¡Eres increíble!',
    '¡Ya casi lo tienes!',
    '¡No te rindas!'
  ];

  constructor(private router: Router, private loadingController: LoadingController, private apiService: ApiService) { }

  ngOnInit() {
    // Mostrar mensaje inicial del mapache después de 3 segundos
    setTimeout(() => {
      this.mapacheSpeak();
    }, 3000);
  }

  // ========================================
  // FUNCIÓN PRINCIPAL - INICIAR TEST CON SESIÓN
  // ========================================
  
  async startQuickPractice() {
    console.log('Iniciando test civil escrito...');
    
    // Mostrar loading SIN duración fija
    const loading = await this.loadingController.create({
      message: 'Preparando tu test...',
      spinner: 'crescent',
      cssClass: 'custom-loading'
      // Sin duration - se cerrará manualmente cuando esté listo
    });
    
    await loading.present();
    
    try {
      // 1. CREAR LA SESIÓN PRIMERO
      console.log('Creando sesión de estudio...');
      
      // Obtener el usuario actual logueado
      const currentUser = this.apiService.getCurrentUser();

      if (!currentUser || !currentUser.id) {
        await loading.dismiss();
        alert('Debes iniciar sesión para hacer un test');
        this.router.navigate(['/login']);
        return;
      }

      const sessionData = {
        studentId: currentUser.id,  // Usar el ID real del usuario
        difficulty: "intermedio",
        legalAreas: ["Derecho Civil"],
        numberOfQuestions: 5
      };
      console.log('Enviando datos de sesión:', sessionData);
      
      // Llamar al backend para crear sesión
      const sessionResponse = await this.apiService.startStudySession(sessionData).toPromise();
      console.log('Sesión creada exitosamente:', sessionResponse);
      
      // 2. GUARDAR LA SESIÓN
      this.apiService.setCurrentSession(sessionResponse);
      
      // 3. NAVEGAR AL TEST
      await this.router.navigate(['/civil/civil-escrito/test-escrito-civil']);
      
      // 4. ESPERAR A QUE LAS PREGUNTAS SE CARGUEN
      console.log('Esperando a que las preguntas se carguen...');
      
      // Polling para verificar que las preguntas están cargadas
      let attempts = 0;
      const maxAttempts = 30; // 15 segundos máximo (500ms * 30)
      
      const checkQuestionsLoaded = () => {
        return new Promise<void>((resolve, reject) => {
          const interval = setInterval(() => {
            attempts++;
            
            // Verificar si las preguntas ya están disponibles
            const currentSession = this.apiService.getCurrentSession();
            const hasQuestions = currentSession?.questions && currentSession.questions.length > 0;
            
            console.log(`Intento ${attempts}: Preguntas cargadas = ${hasQuestions}`);
            
            if (hasQuestions) {
              clearInterval(interval);
              console.log('Preguntas detectadas, cerrando loading');
              resolve();
            } else if (attempts >= maxAttempts) {
              clearInterval(interval);
              console.log('Timeout esperando preguntas');
              reject(new Error('Timeout cargando preguntas'));
            }
          }, 500); // Verificar cada 500ms
        });
      };
      
      // Esperar a que se carguen las preguntas
      await checkQuestionsLoaded();
      
      // Pequeña pausa adicional para asegurar renderizado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Test completamente cargado');
      
    } catch (error) {
      console.error('Error al crear sesión o cargar preguntas:', error);
      
      alert('Error al cargar el test. Verifica tu conexión e inténtalo nuevamente.');
      
    } finally {
      // Cerrar loading cuando todo esté listo
      await loading.dismiss();
      console.log('Loading cerrado');
    }
  }

  // ========================================
  // FUNCIÓN DEL MAPACHE
  // ========================================
  
  mapacheSpeak() {
    // Seleccionar mensaje aleatorio
    const randomIndex = Math.floor(Math.random() * this.mapacheMessages.length);
    this.currentMessage = this.mapacheMessages[randomIndex];
    
    // Mostrar burbuja de diálogo
    this.showSpeech = true;
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
      this.showSpeech = false;
    }, 3000);
    
    console.log('Mapache dice:', this.currentMessage);
  }

  // ========================================
  // FUNCIONES AUXILIARES
  // ========================================
  
  // Función para obtener el progreso actual (conectar con tu backend)
  getCurrentProgress(): number {
    return 65; // Valor fijo por ahora
  }

  // Función para obtener estadísticas (conectar con tu backend)
  getStats() {
    return {
      completedSessions: 13,
      totalSessions: 20,
      percentage: 65
    };
  }
}
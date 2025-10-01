import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, BottomNavComponent]
})
export class ProfilePage implements OnInit {

  // Datos del usuario desde la base de datos
  user = {
    id: 2,
    nombre: 'Usuario',
    email: 'usuario@example.com',
    nivel_actual: 'basico',
    fecha_registro: new Date(),
    avatar: 'assets/image/msombra.png',
    activo: true,
    verificado: false
  };

  // Estadísticas desde metricas_estudiante
  stats = {
    racha_dias_actual: 0,
    racha_dias_maxima: 0,
    total_dias_estudiados: 0,
    total_tests: 0,
    total_preguntas: 0,
    promedio_aciertos: 0
  };

  // Configuración
  settings = {
    darkMode: false,
    soundEffects: true,
    vibration: true,
    autoSave: true
  };

  constructor(
    private router: Router,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.loadUserData();
    this.loadSettings();
  }

  // Cargar datos del usuario (de localStorage por ahora)
  loadUserData() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      const parsed = JSON.parse(userData);
      this.user.nombre = parsed.name || 'Usuario';
      this.user.email = parsed.email || 'usuario@example.com';
    }
    
    // TODO: Conectar con API para obtener datos reales
    // this.apiService.getUserProfile(userId).subscribe(...)
  }

  // Cargar configuración
  loadSettings() {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      this.settings = JSON.parse(saved);
    }
  }

  // Formatear nivel
  getNivelFormatted(): string {
    const niveles: any = {
      'basico': 'Básico',
      'intermedio': 'Intermedio',
      'avanzado': 'Avanzado'
    };
    return niveles[this.user.nivel_actual] || 'Básico';
  }

  // Formatear fecha de registro
  getFechaRegistroFormatted(): string {
    const fecha = new Date(this.user.fecha_registro);
    return fecha.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }

  // Editar perfil
  async editProfile() {
    const alert = await this.alertController.create({
      header: 'Editar Perfil',
      message: 'Función en desarrollo. Próximamente podrás editar tu perfil.',
      buttons: ['OK']
    });
    await alert.present();
  }

  // Cambiar foto de perfil
  async changeAvatar() {
    const alert = await this.alertController.create({
      header: 'Cambiar Foto',
      message: 'Función en desarrollo. Próximamente podrás cambiar tu foto de perfil.',
      buttons: ['OK']
    });
    await alert.present();
  }

  // Ver certificados
  viewCertificates() {
    console.log('Ver certificados');
  }

  // Ver logros
  viewAchievements() {
    this.router.navigate(['/racha']);
  }

  // Ver historial
  viewHistory() {
    this.router.navigate(['/dashboard']);
  }

  // Ayuda y soporte
  async getHelp() {
    const alert = await this.alertController.create({
      header: 'Ayuda y Soporte',
      message: '¿Necesitas ayuda? Contáctanos en soporte@gradocerrado.com',
      buttons: ['OK']
    });
    await alert.present();
  }

  // Acerca de
  async aboutApp() {
    const alert = await this.alertController.create({
      header: 'Grado Cerrado',
      message: 'Versión 1.0.0\n\nTu aplicación de estudio inteligente para preparar tu examen de grado.',
      buttons: ['OK']
    });
    await alert.present();
  }

  // Cerrar sesión
  async logout() {
    const alert = await this.alertController.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro que deseas cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Cerrar Sesión',
          handler: () => {
            localStorage.removeItem('currentUser');
            this.router.navigate(['/welcome']);
          }
        }
      ]
    });
    await alert.present();
  }

  // Guardar configuración
  saveSettings() {
    localStorage.setItem('appSettings', JSON.stringify(this.settings));
  }

  // Volver
  goBack() {
    this.router.navigate(['/home']);
  }
}
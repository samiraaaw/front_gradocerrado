import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class CivilEscritoPage implements OnInit, OnDestroy {
  
  // Selección
  selectedQuantity: number = 5;
  scopeType: 'all' | 'tema' | 'subtema' = 'all';
  selectedTemaId: number | null = null;
  selectedSubtemaId: number | null = null;
  expandedTema: number | null = null;
  
  // Datos
  temas: any[] = [];
  
  // Carrusel
  carouselImages: string[] = [
    'assets/image/banner-5.png',
    'assets/image/banner-6.png',
    'assets/image/banner-8.png'
  ];
  currentImageIndex: number = 0;
  carouselInterval: any;

  constructor(
    private router: Router, 
    private loadingController: LoadingController, 
    private apiService: ApiService
  ) { }

  ngOnInit() {
    this.loadTemas();
    this.startCarousel();
  }

  ngOnDestroy() {
    this.stopCarousel();
  }

  ionViewWillEnter() {
    this.startCarousel();
  }

  ionViewWillLeave() {
    this.stopCarousel();
  }

  loadTemas() {
    this.temas = [
      { 
        id: 135, 
        nombre: 'Parte General', 
        cantidadPreguntas: 15,
        subtemas: [
          { id: 41, nombre: 'Bienes', cantidadPreguntas: 5 },
          { id: 40, nombre: 'Personas jurídicas', cantidadPreguntas: 5 },
          { id: 39, nombre: 'Personas naturales', cantidadPreguntas: 5 },
          { id: 37, nombre: 'Concepto y fuentes del Derecho Civil', cantidadPreguntas: 0 },
          { id: 42, nombre: 'Hechos y actos jurídicos', cantidadPreguntas: 0 },
          { id: 38, nombre: 'Interpretación y aplicación de la ley', cantidadPreguntas: 0 }
        ]
      },
      { 
        id: 136, 
        nombre: 'Derechos Reales', 
        cantidadPreguntas: 11,
        subtemas: [
          { id: 43, nombre: 'Concepto general de derechos reales', cantidadPreguntas: 6 },
          { id: 44, nombre: 'Posesión', cantidadPreguntas: 5 },
          { id: 46, nombre: 'Dominio y otros derechos reales', cantidadPreguntas: 0 },
          { id: 45, nombre: 'Modos de adquirir el dominio', cantidadPreguntas: 0 }
        ]
      },
      { 
        id: 137, 
        nombre: 'Obligaciones y Contratos', 
        cantidadPreguntas: 3,
        subtemas: [
          { id: 50, nombre: 'Contratos en general', cantidadPreguntas: 3 },
          { id: 51, nombre: 'Contratos en particular', cantidadPreguntas: 0 },
          { id: 48, nombre: 'Extinción de las obligaciones', cantidadPreguntas: 0 },
          { id: 47, nombre: 'Obligaciones', cantidadPreguntas: 0 },
          { id: 49, nombre: 'Transmisión de las obligaciones', cantidadPreguntas: 0 }
        ]
      },
      { id: 138, nombre: 'Derecho de Familia', cantidadPreguntas: 0, subtemas: [] },
      { id: 139, nombre: 'Derecho Sucesorio', cantidadPreguntas: 0, subtemas: [] },
      { id: 140, nombre: 'Prescripción', cantidadPreguntas: 0, subtemas: [] },
      { id: 141, nombre: 'Responsabilidad Civil', cantidadPreguntas: 0, subtemas: [] }
    ];
  }

  selectScope(type: 'all' | 'tema') {
    this.scopeType = type;
    if (type === 'all') {
      this.selectedTemaId = null;
      this.selectedSubtemaId = null;
      this.expandedTema = null;
    }
  }

  toggleTema(tema: any) {
    if (tema.cantidadPreguntas === 0) return;
    
    if (this.expandedTema === tema.id) {
      this.expandedTema = null;
      this.scopeType = 'all';
      this.selectedTemaId = null;
      this.selectedSubtemaId = null;
    } else {
      this.expandedTema = tema.id;
      this.scopeType = 'tema';
      this.selectedTemaId = tema.id;
      this.selectedSubtemaId = null;
    }
  }

  selectSubtema(subtema: any, tema: any) {
    if (subtema.cantidadPreguntas === 0) return;
    
    this.scopeType = 'subtema';
    this.selectedTemaId = tema.id;
    this.selectedSubtemaId = subtema.id;
  }

  isSubtemaSelected(subtema: any): boolean {
    return this.scopeType === 'subtema' && this.selectedSubtemaId === subtema.id;
  }

  isTemaExpanded(tema: any): boolean {
    return this.expandedTema === tema.id;
  }

  async startTest() {
    console.log('🚀 Iniciando test escrito con:');
    console.log('  Cantidad:', this.selectedQuantity);
    console.log('  Tipo:', this.scopeType);
    console.log('  Tema ID:', this.selectedTemaId);
    console.log('  Subtema ID:', this.selectedSubtemaId);
    
    const loading = await this.loadingController.create({
      message: 'Preparando tu test...',
      spinner: 'crescent',
      cssClass: 'custom-loading'
    });
    
    await loading.present();
    
    try {
      const currentUser = this.apiService.getCurrentUser();

      if (!currentUser || !currentUser.id) {
        await loading.dismiss();
        alert('Debes iniciar sesión para hacer un test');
        this.router.navigate(['/login']);
        return;
      }

      const sessionData: any = {
        studentId: currentUser.id,
        difficulty: "intermedio",
        legalAreas: ["Derecho Civil"],
        numberOfQuestions: this.selectedQuantity
      };

      if (this.scopeType === 'subtema' && this.selectedSubtemaId) {
        sessionData.SubtemaId = this.selectedSubtemaId;
        console.log('  ✅ Filtrando por SUBTEMA:', this.selectedSubtemaId);
      } else if (this.scopeType === 'tema' && this.selectedTemaId) {
        sessionData.TemaId = this.selectedTemaId;
        console.log('  ✅ Filtrando por TEMA:', this.selectedTemaId);
      } else {
        console.log('  ✅ Sin filtro (TODO Derecho Civil)');
      }
      
      console.log('📤 Enviando request:', sessionData);
      
      const sessionResponse = await this.apiService.startStudySession(sessionData).toPromise();
      console.log('📥 Respuesta del servidor:', sessionResponse);
      
      if (sessionResponse && sessionResponse.success) {
        console.log('✅ Preguntas recibidas:', sessionResponse.totalQuestions);
        this.apiService.setCurrentSession(sessionResponse);
        await this.router.navigate(['/civil/civil-escrito/test-escrito-civil']);
        await loading.dismiss();
      } else {
        await loading.dismiss();
        alert('No se pudo iniciar el test. Intenta nuevamente.');
      }
      
    } catch (error) {
      await loading.dismiss();
      console.error('❌ Error al iniciar test:', error);
      alert('Hubo un error al iniciar el test. Intenta nuevamente.');
    }
  }

  startCarousel() {
    this.carouselInterval = setInterval(() => {
      this.nextSlide();
    }, 4000);
  }

  stopCarousel() {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  nextSlide() {
    this.currentImageIndex = (this.currentImageIndex + 1) % this.carouselImages.length;
  }

  goToSlide(index: number) {
    this.currentImageIndex = index;
    this.stopCarousel();
    this.startCarousel();
  }

  getSummaryText(): string {
    if (this.scopeType === 'all') {
      return 'Practicarás con TODO el contenido de Derecho Civil';
    } else if (this.scopeType === 'tema' && this.selectedTemaId) {
      const tema = this.temas.find(t => t.id === this.selectedTemaId);
      return tema ? `Practicarás: ${tema.nombre}` : '';
    } else if (this.scopeType === 'subtema' && this.selectedSubtemaId) {
      for (const tema of this.temas) {
        const subtema = tema.subtemas?.find((s: any) => s.id === this.selectedSubtemaId);
        if (subtema) {
          return `Practicarás: ${subtema.nombre}`;
        }
      }
    }
    return '';
  }

  canStartTest(): boolean {
    // Siempre se puede iniciar el test si hay una cantidad seleccionada
    return this.selectedQuantity > 0;
  }

  startQuickPractice(): void {
    // Alias para startTest()
    this.startTest();
  }
}
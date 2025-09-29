import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

interface Question {
  id: string;
  text: string;
  correctAnswerId: string;
  options: Array<{
    id: string;
    text: string;
  }>;
  category: string;
}

@Component({
  selector: 'app-test-oral-civil',
  templateUrl: './test-oral-civil.page.html',
  styleUrls: ['./test-oral-civil.page.scss'],
  standalone: false
})
export class TestOralCivilPage implements OnInit, OnDestroy {

  // Variables de estado del test
  questions: Question[] = [];
  currentQuestionNumber: number = 1;
  totalQuestions: number = 5;
  userAnswers: { [questionId: string]: string } = {};
  
  // Variables de audio
  isPlaying: boolean = false;
  audioCompleted: boolean = false;
  audioProgress: string = '00:02';
  
  // Variables de grabación
  isRecording: boolean = false;
  hasRecording: boolean = false;
  recordingTime: string = '00:00';
  recordingTimer: any;
  recordingStartTime: number = 0;
  
  // Simulación de preguntas para demo
  private mockQuestions: Question[] = [
    {
      id: '1',
      text: '¿Cuál es la diferencia fundamental entre un contrato bilateral y un contrato unilateral según el Código Civil chileno?',
      correctAnswerId: 'A',
      options: [
        { id: 'A', text: 'Un contrato bilateral es aquel donde ambas partes se obligan recíprocamente, como la compraventa. El unilateral es donde sólo una parte se obliga, como el comodato.' },
        { id: 'B', text: 'No hay diferencia, ambos términos se refieren al mismo tipo de contrato.' },
        { id: 'C', text: 'Un contrato bilateral requiere firma de ambas partes, el unilateral sólo una firma.' },
        { id: 'D', text: 'Un contrato bilateral es válido, el unilateral no tiene valor legal.' }
      ],
      category: 'Derecho Civil'
    },
    {
      id: '2', 
      text: '¿Qué establece el artículo 1445 del Código Civil respecto a los requisitos para que una persona se obligue a otra por un acto o declaración de voluntad?',
      correctAnswerId: 'B',
      options: [
        { id: 'A', text: 'Sólo se requiere la manifestación de voluntad.' },
        { id: 'B', text: 'Se requiere: 1) ser legalmente capaz, 2) consentimiento libre y espontáneo, 3) objeto lícito, 4) causa lícita.' },
        { id: 'C', text: 'Únicamente se necesita que el objeto sea lícito.' },
        { id: 'D', text: 'Basta con la capacidad legal y el consentimiento.' }
      ],
      category: 'Derecho Civil'
    },
    {
      id: '3',
      text: '¿Cuáles son los elementos de la existencia del contrato según el Código Civil chileno?',
      correctAnswerId: 'C',
      options: [
        { id: 'A', text: 'Solo el consentimiento y el objeto.' },
        { id: 'B', text: 'Consentimiento, objeto y causa.' },
        { id: 'C', text: 'Consentimiento, objeto, causa y solemnidades cuando la ley las exige.' },
        { id: 'D', text: 'Únicamente las solemnidades legales.' }
      ],
      category: 'Derecho Civil'
    },
    {
      id: '4',
      text: '¿Qué diferencia existe entre nulidad absoluta y nulidad relativa en el derecho civil chileno?',
      correctAnswerId: 'A',
      options: [
        { id: 'A', text: 'La nulidad absoluta protege el interés general y puede alegarla cualquier persona. La relativa protege intereses particulares y solo pueden alegarla los interesados.' },
        { id: 'B', text: 'No existe diferencia, ambas son iguales.' },
        { id: 'C', text: 'La nulidad absoluta es definitiva, la relativa es temporal.' },
        { id: 'D', text: 'La nulidad relativa es más grave que la absoluta.' }
      ],
      category: 'Derecho Civil'
    },
    {
      id: '5',
      text: '¿Cuáles son los modos de adquirir el dominio reconocidos en el Código Civil chileno?',
      correctAnswerId: 'B',
      options: [
        { id: 'A', text: 'Solo la compraventa y la herencia.' },
        { id: 'B', text: 'Ocupación, accesión, tradición, sucesión por causa de muerte y prescripción.' },
        { id: 'C', text: 'Únicamente la tradición y la prescripción.' },
        { id: 'D', text: 'Solo los que establezca un contrato.' }
      ],
      category: 'Derecho Civil'
    }
  ];

  constructor(
    private router: Router,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.loadQuestions();
  }

  ngOnDestroy() {
    this.stopRecordingTimer();
  }

  // ========================================
  // GESTIÓN DE PREGUNTAS
  // ========================================
  
  loadQuestions() {
    // Por ahora usamos preguntas mock, más adelante se conectará con el backend
    this.questions = this.mockQuestions;
    this.totalQuestions = this.questions.length;
    console.log('Preguntas cargadas:', this.questions);
  }

  getCurrentQuestion(): Question | null {
    return this.questions[this.currentQuestionNumber - 1] || null;
  }

  getCurrentQuestionText(): string {
    const question = this.getCurrentQuestion();
    return question ? question.text : '';
  }

  getProgress(): number {
    return (this.currentQuestionNumber / this.totalQuestions) * 100;
  }

  // ========================================
  // CONTROL DE AUDIO
  // ========================================
  
  toggleAudio() {
    if (this.isPlaying) {
      this.pauseAudio();
    } else {
      this.playAudio();
    }
  }

  playAudio() {
    console.log('Reproduciendo pregunta:', this.getCurrentQuestionText());
    this.isPlaying = true;
    
    // Simular reproducción de audio
    // En una implementación real, aquí se reproduciría el audio de la pregunta
    setTimeout(() => {
      this.isPlaying = false;
      this.audioCompleted = true;
      this.audioProgress = 'Completado';
    }, 3000);
  }

  pauseAudio() {
    console.log('Pausando audio');
    this.isPlaying = false;
  }

  getAudioIcon(): string {
    if (this.isPlaying) return 'pause';
    if (this.audioCompleted) return 'checkmark';
    return 'play';
  }

  getAudioStatus(): string {
    if (this.isPlaying) return 'Reproduciendo...';
    if (this.audioCompleted) return 'Grabación completada';
    return 'Ir a Pregunta de Voz';
  }

  // ========================================
  // CONTROL DE GRABACIÓN
  // ========================================
  
  toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  startRecording() {
    console.log('Iniciando grabación de respuesta');
    this.isRecording = true;
    this.hasRecording = false;
    this.recordingStartTime = Date.now();
    this.startRecordingTimer();
    
    // En una implementación real, aquí se iniciaría la grabación de audio
  }

  stopRecording() {
    console.log('Deteniendo grabación');
    this.isRecording = false;
    this.hasRecording = true;
    this.stopRecordingTimer();
    
    // En una implementación real, aquí se detendría la grabación de audio
  }

  restartRecording() {
    console.log('Reiniciando grabación');
    this.hasRecording = false;
    this.recordingTime = '00:00';
    this.startRecording();
  }

  replayRecording() {
    console.log('Reproduciendo grabación');
    // En una implementación real, aquí se reproduciría la grabación realizada
  }

  startRecordingTimer() {
    this.recordingTimer = setInterval(() => {
      const elapsed = Date.now() - this.recordingStartTime;
      const seconds = Math.floor(elapsed / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      
      this.recordingTime = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }, 1000);
  }

  stopRecordingTimer() {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
  }

  getRecordingIcon(): string {
    if (this.isRecording) return 'stop';
    if (this.hasRecording) return 'checkmark';
    return 'mic';
  }

  getRecordingStatus(): string {
    if (this.isRecording) return 'Grabando... Habla ahora';
    if (this.hasRecording) return 'Grabación completada';
    return 'Grabando... Habla ahora';
  }

  // ========================================
  // ENVÍO DE RESPUESTA
  // ========================================
  
  submitVoiceAnswer() {
    if (!this.hasRecording) return;
    
    console.log('Enviando respuesta de voz para pregunta:', this.currentQuestionNumber);
    
    // Simular procesamiento de la respuesta de voz
    // En una implementación real, aquí se enviaría el audio al backend para procesamiento
    const questionId = this.getCurrentQuestion()?.id;
    if (questionId) {
      this.userAnswers[questionId] = 'voice_response_' + this.currentQuestionNumber;
    }
    
    // Resetear estado de grabación
    this.hasRecording = false;
    this.recordingTime = '00:00';
    
    // Avanzar a la siguiente pregunta automáticamente
    setTimeout(() => {
      this.nextQuestion();
    }, 500);
  }

  // ========================================
  // NAVEGACIÓN
  // ========================================
  
  canGoToNext(): boolean {
    return this.hasRecording || this.hasAnsweredCurrentQuestion();
  }

  hasAnsweredCurrentQuestion(): boolean {
    const questionId = this.getCurrentQuestion()?.id;
    return questionId ? !!this.userAnswers[questionId] : false;
  }

  isLastQuestion(): boolean {
    return this.currentQuestionNumber === this.totalQuestions;
  }

  nextQuestion() {
    if (!this.canGoToNext()) return;
    
    if (this.isLastQuestion()) {
      this.completeTest();
    } else {
      this.currentQuestionNumber++;
      this.resetQuestionState();
    }
  }

  previousQuestion() {
    if (this.currentQuestionNumber > 1) {
      this.currentQuestionNumber--;
      this.resetQuestionState();
    }
  }

  resetQuestionState() {
    // Resetear estados de audio y grabación
    this.isPlaying = false;
    this.audioCompleted = false;
    this.audioProgress = '00:02';
    this.isRecording = false;
    this.hasRecording = false;
    this.recordingTime = '00:00';
    this.stopRecordingTimer();
  }

  // ========================================
  // FINALIZACIÓN DEL TEST
  // ========================================
  
  async completeTest() {
    console.log('Completando test oral con respuestas:', this.userAnswers);
    
    // Mostrar confirmación
    const alert = await this.alertController.create({
      header: 'Test Completado',
      message: '¡Has completado todas las preguntas del modo oral!',
      buttons: [
        {
          text: 'Ver Resultados',
          handler: () => {
            this.saveResultsAndNavigateToSummary();
          }
        }
      ]
    });

    await alert.present();
  }

  saveResultsAndNavigateToSummary() {
    // Calcular resultados
    const results = this.calculateResults();
    
    // Guardar en localStorage para la página de resultados
    localStorage.setItem('current_oral_test_results', JSON.stringify(results));
    
    // Navegar a página de resultados
    this.router.navigate(['/civil/civil-oral/resumen-test-civil-oral']);
  }

  calculateResults() {
    const totalQuestions = this.questions.length;
    const answeredQuestions = Object.keys(this.userAnswers).length;
    
    // Para el modo oral, consideramos todas las respuestas grabadas como válidas
    // En una implementación real, aquí se procesarían las respuestas de voz
    const correctAnswers = answeredQuestions; // Simulamos que todas son correctas por ahora
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    
    const questionDetails = this.questions.map((question, index) => {
      const answered = !!this.userAnswers[question.id];
      return {
        questionNumber: index + 1,
        question: question.text,
        answered: answered,
        correct: answered, // Simulamos que las respuestas grabadas son correctas
        userAnswer: answered ? 'Respuesta de voz' : 'Sin respuesta',
        correctAnswer: question.options.find(opt => opt.id === question.correctAnswerId)?.text || ''
      };
    });

    return {
      totalQuestions,
      correctAnswers,
      incorrectAnswers: totalQuestions - correctAnswers,
      percentage,
      questionDetails,
      testType: 'oral',
      completedAt: new Date().toISOString()
    };
  }

}
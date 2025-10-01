import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AudioRecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  recordingDuration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingTimer: any;
  private startTime: number = 0;
  
  private recordingStateSubject = new BehaviorSubject<AudioRecordingState>({
    isRecording: false,
    isProcessing: false,
    recordingDuration: 0,
    audioBlob: null,
    audioUrl: null
  });

  public recordingState$ = this.recordingStateSubject.asObservable();

  constructor(private http: HttpClient) {}

  async initializeRecording(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices) {
        throw new Error('navigator.mediaDevices no esta disponible');
      }

      if (typeof navigator.mediaDevices.getUserMedia !== 'function') {
        throw new Error('getUserMedia no esta disponible');
      }

      if (typeof window.MediaRecorder === 'undefined') {
        throw new Error('MediaRecorder no esta disponible');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      let mimeType = 'audio/webm;codecs=opus';
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/webm';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/mp4';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = '';
            }
          }
        }
      } else {
        mimeType = '';
      }

      const options = mimeType ? { mimeType } : {};
      this.mediaRecorder = new MediaRecorder(stream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.processRecording();
      };

      console.log('Microfono inicializado correctamente con tipo:', mimeType || 'predeterminado');
      return true;

    } catch (error) {
      console.error('Error al acceder al microfono:', error);
      return false;
    }
  }

  startRecording(): void {
    if (!this.mediaRecorder) {
      console.error('MediaRecorder no inicializado');
      return;
    }

    this.audioChunks = [];
    this.startTime = Date.now();

    this.updateRecordingState({
      isRecording: true,
      isProcessing: false,
      recordingDuration: 0,
      audioBlob: null,
      audioUrl: null
    });

    this.mediaRecorder.start();

    this.recordingTimer = setInterval(() => {
      const duration = Math.floor((Date.now() - this.startTime) / 1000);
      this.updateRecordingState({ recordingDuration: duration });
    }, 1000);

    console.log('Grabacion iniciada');
  }

  stopRecording(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
      return;
    }

    this.mediaRecorder.stop();
    clearInterval(this.recordingTimer);

    this.updateRecordingState({
      isRecording: false,
      isProcessing: true
    });

    console.log('Grabacion detenida');
  }

  private processRecording(): void {
    if (this.audioChunks.length === 0) {
      console.error('No hay datos de audio para procesar');
      return;
    }

    const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
    
    const audioBlob = new Blob(this.audioChunks, { type: mimeType });
    const audioUrl = URL.createObjectURL(audioBlob);

    this.updateRecordingState({
      isProcessing: false,
      audioBlob: audioBlob,
      audioUrl: audioUrl
    });

    console.log('Audio procesado:', {
      size: audioBlob.size,
      type: audioBlob.type,
      duration: this.recordingStateSubject.value.recordingDuration
    });
  }

  // MÉTODO ACTUALIZADO - Enviar audio al nuevo endpoint
  async uploadAudio(audioBlob: Blob, questionId: string, sessionId: string): Promise<any> {
    const formData = new FormData();
    
    // Determinar extensión basada en el tipo MIME
    const fileExtension = audioBlob.type.includes('mp4') ? '.m4a' : 
                         audioBlob.type.includes('webm') ? '.webm' : '.audio';
    
    // Agregar el archivo de audio con un nombre descriptivo
    formData.append('audioFile', audioBlob, `recording_${questionId}${fileExtension}`);
    
    // Agregar metadatos adicionales si tu backend los necesita
    formData.append('questionId', questionId);
    formData.append('sessionId', sessionId);
    formData.append('timestamp', new Date().toISOString());

    try {
      // Endpoint actualizado
      const response = await this.http.post(
        'http://localhost:5183/api/Speech/speech-to-text', 
        formData
        // No enviamos headers, el navegador los configura automáticamente para FormData
      ).toPromise();

      console.log('Audio enviado al backend exitosamente:', response);
      return response;

    } catch (error: any) {
      console.error('Error enviando audio:', error);
      
      // Si hay error, lanzarlo para que se maneje en el componente
      throw {
        error: true,
        message: error.error?.message || 'Error al procesar el audio',
        details: error
      };
    }
  }

  playRecording(audioUrl: string): void {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audio.play().catch(error => {
      console.error('Error reproduciendo audio:', error);
    });
  }

  clearRecording(): void {
    if (this.recordingStateSubject.value.audioUrl) {
      URL.revokeObjectURL(this.recordingStateSubject.value.audioUrl);
    }

    this.updateRecordingState({
      isRecording: false,
      isProcessing: false,
      recordingDuration: 0,
      audioBlob: null,
      audioUrl: null
    });

    this.audioChunks = [];
  }

  stopMediaStreams(): void {
    if (this.mediaRecorder && this.mediaRecorder.stream) {
      this.mediaRecorder.stream.getTracks().forEach(track => {
        track.stop();
      });
    }
  }

  private updateRecordingState(partialState: Partial<AudioRecordingState>): void {
    const currentState = this.recordingStateSubject.value;
    const newState = { ...currentState, ...partialState };
    this.recordingStateSubject.next(newState);
  }

  getCurrentState(): AudioRecordingState {
    return this.recordingStateSubject.value;
  }

  isRecordingSupported(): boolean {
    try {
      return !!(navigator.mediaDevices && 
                typeof navigator.mediaDevices.getUserMedia === 'function' && 
                typeof window.MediaRecorder !== 'undefined' &&
                typeof MediaRecorder.isTypeSupported === 'function');
    } catch (error) {
      return false;
    }
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  getSupportedMimeTypes(): string[] {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/mpeg',
      'audio/wav'
    ];

    if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
      return [];
    }

    return types.filter(type => MediaRecorder.isTypeSupported(type));
  }
}
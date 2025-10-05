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

  async uploadAudio(
    audioBlob: Blob, 
    questionId: string, 
    sessionId: string,
    numeroOrden: number,
    tiempoRespuestaSegundos: number 
  ): Promise<any> {
    
    console.log('🎤 Preparando audio para enviar:', {
      originalType: audioBlob.type,
      originalSize: audioBlob.size
    });

    // CONVERTIR A WAV antes de enviar
    let audioToSend = audioBlob;
    
    try {
      // Si no es WAV, convertir
      if (!audioBlob.type.includes('wav')) {
        console.log('🔄 Convirtiendo audio a WAV...');
        audioToSend = await this.convertToWav(audioBlob);
        console.log('✅ Audio convertido a WAV:', audioToSend.size, 'bytes');
      }
    } catch (conversionError) {
      console.warn('⚠️ No se pudo convertir a WAV, enviando formato original:', conversionError);
      // Continuar con el audio original si falla la conversión
    }

    const formData = new FormData();
    
    // Siempre usar .wav como extensión si logramos convertir
    const fileExtension = audioToSend.type.includes('wav') ? '.wav' : '.webm';
    
    formData.append('audioFile', audioToSend, `recording_${questionId}${fileExtension}`);
    
    const testIdNumber = parseInt(sessionId, 10);
    const preguntaIdNumber = parseInt(questionId, 10);
    
    if (isNaN(testIdNumber) || isNaN(preguntaIdNumber)) {
      throw new Error('IDs inválidos: testId y preguntaGeneradaId deben ser numéricos');
    }
    
    formData.append('testId', testIdNumber.toString());
    formData.append('preguntaGeneradaId', preguntaIdNumber.toString());
    formData.append('numeroOrden', numeroOrden.toString());
    formData.append('tiempoRespuestaSegundos', tiempoRespuestaSegundos.toString());

    console.log('📤 Enviando al backend:', {
      testId: testIdNumber,
      preguntaGeneradaId: preguntaIdNumber,
      numeroOrden: numeroOrden,
      tiempoRespuestaSegundos: tiempoRespuestaSegundos,
      audioSize: audioToSend.size,
      audioType: audioToSend.type
    });

    try {
      const response = await this.http.post(
        'http://localhost:5183/api/Speech/speech-to-text', 
        formData
      ).toPromise();

      console.log('✅ Respuesta del backend:', response);
      return response;

    } catch (error: any) {
      console.error('❌ Error enviando audio:', error);
      console.error('Detalles completos:', error.error);
      
      throw {
        error: true,
        message: error.error?.message || 'Error al procesar el audio',
        details: error
      };
    }
  }

  // NUEVO MÉTODO: Convertir audio a WAV
  private async convertToWav(audioBlob: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const fileReader = new FileReader();

      fileReader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          // Convertir a WAV
          const wavBlob = this.audioBufferToWav(audioBuffer);
          resolve(wavBlob);
        } catch (error) {
          console.error('Error decodificando audio:', error);
          reject(error);
        }
      };

      fileReader.onerror = () => reject(new Error('Error leyendo el archivo'));
      fileReader.readAsArrayBuffer(audioBlob);
    });
  }

  // Convertir AudioBuffer a WAV Blob
  private audioBufferToWav(audioBuffer: AudioBuffer): Blob {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const samples = audioBuffer.getChannelData(0);
    const dataLength = samples.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    // WAV header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // Escribir los samples
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
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
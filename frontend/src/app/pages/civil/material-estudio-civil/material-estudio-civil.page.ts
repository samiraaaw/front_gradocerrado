import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';

type FileType = 'pdf' | 'apunte' | 'video' | 'enlace';
interface StudyItem { id: number; titulo: string; tipo: FileType; url: string; detalle?: string; }

@Component({
  selector: 'app-material-estudio-civil',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, BottomNavComponent],
  templateUrl: './material-estudio-civil.page.html',
  styleUrls: ['./material-estudio-civil.page.scss']
})
export class MaterialEstudioCivilPage {
  filtro: FileType | 'todos' = 'todos';
  query = '';

  // Mock: reemplaza URLs por Drive/YouTube/tu backend
  items: StudyItem[] = [
    { id: 1, titulo: 'Manual de Obligaciones (PDF)', tipo: 'pdf', url: 'https://tu-enlace/obligaciones.pdf' },
    { id: 2, titulo: 'Apuntes Clases 01-03', tipo: 'apunte', url: 'https://tu-enlace/apuntes-clase.zip' },
    { id: 3, titulo: 'Clase: Teoría de la Responsabilidad (Video)', tipo: 'video', url: 'https://youtu.be/xxxxxxxx' },
    { id: 4, titulo: 'Índice de Códigos (Enlace)', tipo: 'enlace', url: 'https://www.pjud.cl/' },
  ];

  get filtrados(): StudyItem[] {
    const q = this.query.trim().toLowerCase();
    return this.items
      .filter(i => this.filtro === 'todos' ? true : i.tipo === this.filtro)
      .filter(i => !q ? true : i.titulo.toLowerCase().includes(q));
  }

  setFiltro(f: FileType | 'todos') { this.filtro = f; }
  abrir(item: StudyItem) { window.open(item.url, '_blank'); }
}

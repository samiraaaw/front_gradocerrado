import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { CivilOralPageRoutingModule } from './civil-oral-routing.module';
import { CivilOralPage } from './civil-oral.page';

// Importar el componente BottomNav con la ruta correcta
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CivilOralPageRoutingModule,
    BottomNavComponent  // Agregamos el BottomNavComponent
  ],
  declarations: [CivilOralPage]
})
export class CivilOralPageModule {}
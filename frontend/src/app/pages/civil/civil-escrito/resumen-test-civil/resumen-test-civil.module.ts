import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ResumenTestCivilPageRoutingModule } from './resumen-test-civil-routing.module';
import { ResumenTestCivilPage } from './resumen-test-civil.page';
import { BottomNavComponent } from '../../../../shared/components/bottom-nav/bottom-nav.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ResumenTestCivilPageRoutingModule,
    BottomNavComponent  // Como es standalone, se importa así
  ],
  declarations: [ResumenTestCivilPage]
})
export class ResumenTestCivilPageModule {}
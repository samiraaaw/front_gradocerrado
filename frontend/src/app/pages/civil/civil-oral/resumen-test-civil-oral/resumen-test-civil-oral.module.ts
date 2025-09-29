import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ResumenTestCivilOralPageRoutingModule } from './resumen-test-civil-oral-routing.module';
import { ResumenTestCivilOralPage } from './resumen-test-civil-oral.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ResumenTestCivilOralPageRoutingModule,
    ResumenTestCivilOralPage  // IMPORTAR como standalone
  ]
  // NO declarations
})
export class ResumenTestCivilOralPageModule {}
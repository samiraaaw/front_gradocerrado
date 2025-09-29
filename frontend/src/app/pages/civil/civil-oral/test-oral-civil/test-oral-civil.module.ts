import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { TestOralCivilPageRoutingModule } from './test-oral-civil-routing.module';
import { TestOralCivilPage } from './test-oral-civil.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TestOralCivilPageRoutingModule
  ],
  declarations: [TestOralCivilPage]
})
export class TestOralCivilPageModule {}
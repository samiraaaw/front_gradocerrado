import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { Onboarding2PageRoutingModule } from './onboarding2-routing.module';

import { Onboarding2Page } from './onboarding2.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    Onboarding2PageRoutingModule,
    Onboarding2Page
  ]
})
export class Onboarding2PageModule {}
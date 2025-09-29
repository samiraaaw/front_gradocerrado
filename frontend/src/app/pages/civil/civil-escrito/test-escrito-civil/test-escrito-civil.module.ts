import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TestEscritoCivilPageRoutingModule } from './test-escrito-civil-routing.module';

import { TestEscritoCivilPage } from './test-escrito-civil.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TestEscritoCivilPageRoutingModule
  ],
  declarations: [TestEscritoCivilPage]
})
export class TestEscritoCivilPageModule {}
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FelicidadesPageRoutingModule } from './felicidades-routing.module';

import { FelicidadesPage } from './felicidades.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FelicidadesPageRoutingModule,
    FelicidadesPage  // CAMBIO: Importar en lugar de declarar
  ]
})
export class FelicidadesPageModule {}
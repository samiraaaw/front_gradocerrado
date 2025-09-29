import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FelicidadesPage } from './felicidades.page';

const routes: Routes = [
  {
    path: '',
    component: FelicidadesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FelicidadesPageRoutingModule {}

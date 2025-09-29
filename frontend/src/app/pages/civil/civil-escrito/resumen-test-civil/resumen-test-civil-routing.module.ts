import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ResumenTestCivilPage } from './resumen-test-civil.page';

const routes: Routes = [
  {
    path: '',
    component: ResumenTestCivilPage
  }
  // ELIMINADAS: las rutas que causaban errores
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ResumenTestCivilPageRoutingModule {}
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ResumenTestCivilOralPage } from './resumen-test-civil-oral.page';

const routes: Routes = [
  {
    path: '',
    component: ResumenTestCivilOralPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ResumenTestCivilOralPageRoutingModule {}
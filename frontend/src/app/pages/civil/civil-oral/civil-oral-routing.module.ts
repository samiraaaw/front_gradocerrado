import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CivilOralPage } from './civil-oral.page';

const routes: Routes = [
  {
    path: '',
    component: CivilOralPage
  },
  {
    path: 'test-oral-civil',
    loadChildren: () =>
      import('./test-oral-civil/test-oral-civil.module')
        .then(m => m.TestOralCivilPageModule)
  },
  {
    path: 'resumen-test-civil-oral',
    loadChildren: () =>
      import('./resumen-test-civil-oral/resumen-test-civil-oral.module')
        .then(m => m.ResumenTestCivilOralPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CivilOralPageRoutingModule {}
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CivilEscritoPage } from './civil-escrito.page';

const routes: Routes = [
  {
    path: '',
    component: CivilEscritoPage
  },
  {
    path: 'test-escrito-civil',
    loadChildren: () =>
      import('./test-escrito-civil/test-escrito-civil.module')
        .then(m => m.TestEscritoCivilPageModule)
  },
  {
    path: 'resumen-test-civil',
    loadChildren: () =>
      import('./resumen-test-civil/resumen-test-civil.module')
        .then(m => m.ResumenTestCivilPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CivilEscritoPageRoutingModule {}
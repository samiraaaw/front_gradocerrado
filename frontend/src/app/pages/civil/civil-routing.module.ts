import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CivilPage } from './civil.page';

const routes: Routes = [
  {
    path: '',
    component: CivilPage
  },
  {
    path: 'civil-escrito',
    loadChildren: () =>
      import('./civil-escrito/civil-escrito.module')
        .then(m => m.CivilEscritoPageModule)
  },
  {
    path: 'civil-oral',
    loadChildren: () =>
      import('./civil-oral/civil-oral.module')
        .then(m => m.CivilOralPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CivilPageRoutingModule {}
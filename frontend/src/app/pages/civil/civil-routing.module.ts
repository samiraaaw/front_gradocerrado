import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CivilPage } from './civil.page';

const routes: Routes = [
  { path: '', component: CivilPage },
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
  },
  // 👇 Standalone, sin módulos
  {
    path: 'material-estudio-civil',
    loadComponent: () =>
      import('./material-estudio-civil/material-estudio-civil.page')
        .then(m => m.MaterialEstudioCivilPage)
  },
  {
  path: 'plan-estudio-civil',
  loadComponent: () =>
    import('./plan-estudio-civil/plan-estudio-civil.page')
      .then(m => m.PlanEstudioCivilPage)  
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CivilPageRoutingModule {}

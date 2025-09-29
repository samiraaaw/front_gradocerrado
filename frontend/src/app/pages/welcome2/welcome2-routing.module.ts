import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { Welcome2Page } from './welcome2.page';

const routes: Routes = [
  {
    path: '',
    component: Welcome2Page
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class Welcome2PageRoutingModule {}
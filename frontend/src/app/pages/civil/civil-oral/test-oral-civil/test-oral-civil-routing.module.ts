import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TestOralCivilPage } from './test-oral-civil.page';

const routes: Routes = [
  {
    path: '',
    component: TestOralCivilPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TestOralCivilPageRoutingModule {}

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TestEscritoCivilPage } from './test-escrito-civil.page';

const routes: Routes = [
  {
    path: '',
    component: TestEscritoCivilPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TestEscritoCivilPageRoutingModule {}
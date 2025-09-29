// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: '/welcome', pathMatch: 'full' },

  // Bienvenida
  {
    path: 'welcome',
    loadChildren: () =>
      import('./pages/welcome/welcome.module').then(m => m.WelcomePageModule)
  },

  // Onboarding
  {
    path: 'onboarding1',
    loadChildren: () => import('./pages/onboarding/onboarding1/onboarding1.module').then( m => m.Onboarding1PageModule)
  },
  {
    path: 'onboarding2',
    loadChildren: () => import('./pages/onboarding/onboarding2/onboarding2.module').then( m => m.Onboarding2PageModule)
  },
  {
    path: 'onboarding3',
    loadChildren: () => import('./pages/onboarding/onboarding3/onboarding3.module').then( m => m.Onboarding3PageModule)
  },
  {
    path: 'welcome2',
    loadChildren: () => import('./pages/welcome2/welcome2.module').then( m => m.Welcome2PageModule)
  },

  // Páginas de autenticación
  {
    path: 'registro',
    loadChildren: () => import('./pages/registro/registro.module').then( m => m.RegistroPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'felicidades',
    loadChildren: () => import('./pages/felicidades/felicidades.module').then( m => m.FelicidadesPageModule)
  },
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then( m => m.HomePageModule)
  },

  // Contenedor CIVIL (lazy)
  {
    path: 'civil',
    loadChildren: () =>
      import('./pages/civil/civil.module').then(m => m.CivilPageModule)
  },

  // Fallback - SIEMPRE AL FINAL
  { path: '**', redirectTo: '/welcome' },
  {
  path: 'racha',
  loadComponent: () => import('./pages/racha/racha.page').then(m => m.RachaPage)
},
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
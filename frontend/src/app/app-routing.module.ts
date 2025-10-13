import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: '/welcome', pathMatch: 'full' },

  // ========================================
  // BIENVENIDA
  // ========================================
  {
    path: 'welcome',
    loadComponent: () => import('./pages/welcome/welcome.page').then(m => m.WelcomePage)
  },
  {
    path: 'welcome2',
    loadComponent: () => import('./pages/welcome2/welcome2.page').then(m => m.Welcome2Page)
  },

  // ========================================
  // ONBOARDING
  // ========================================
  {
    path: 'onboarding1',
    loadComponent: () => import('./pages/onboarding/onboarding1/onboarding1.page').then(m => m.Onboarding1Page)
  },
  {
    path: 'onboarding2',
    loadComponent: () => import('./pages/onboarding/onboarding2/onboarding2.page').then(m => m.Onboarding2Page)
  },
  {
    path: 'onboarding3',
    loadComponent: () => import('./pages/onboarding/onboarding3/onboarding3.page').then(m => m.Onboarding3Page)
  },

  // ========================================
  // AUTENTICACIÓN
  // ========================================
  {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro.page').then(m => m.RegistroPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'felicidades',
    loadComponent: () => import('./pages/felicidades/felicidades.page').then(m => m.FelicidadesPage)
  },

  // ========================================
  // HOME Y DASHBOARD
  // ========================================
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage)
  },

  // ========================================
  // NOTIFICACIONES, SETTINGS, RACHA, PERFIL
  // ========================================
  {
    path: 'notifications',
    loadComponent: () => import('./pages/notifications/notifications.page').then(m => m.NotificationsPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage)
  },
  {
    path: 'racha',
    loadComponent: () => import('./pages/racha/racha.page').then(m => m.RachaPage)
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage)
  },

  // ========================================
  // CIVIL - PÁGINA PRINCIPAL
  // ========================================
  {
    path: 'civil',
    loadComponent: () => import('./pages/civil/civil.page').then(m => m.CivilPage)
  },

  // ========================================
  // CIVIL - ESCRITO
  // ========================================
  {
    path: 'civil/civil-escrito',
    loadComponent: () => import('./pages/civil/civil-escrito/civil-escrito.page').then(m => m.CivilEscritoPage)
  },
  {
    path: 'civil/civil-escrito/test-escrito-civil',
    loadComponent: () => import('./pages/civil/civil-escrito/test-escrito-civil/test-escrito-civil.page').then(m => m.TestEscritoCivilPage)
  },
  {
    path: 'civil/civil-escrito/resumen-test-civil',
    loadComponent: () => import('./pages/civil/civil-escrito/resumen-test-civil/resumen-test-civil.page').then(m => m.ResumenTestCivilPage)
  },

  // ========================================
  // CIVIL - ORAL
  // ========================================
  {
    path: 'civil/civil-oral',
    loadComponent: () => import('./pages/civil/civil-oral/civil-oral.page').then(m => m.CivilOralPage)
  },
  {
    path: 'civil/civil-oral/test-oral-civil',
    loadComponent: () => import('./pages/civil/civil-oral/test-oral-civil/test-oral-civil.page').then(m => m.TestOralCivilPage)
  },
  {
    path: 'civil/civil-oral/resumen-test-civil-oral',
    loadComponent: () => import('./pages/civil/civil-oral/resumen-test-civil-oral/resumen-test-civil-oral.page').then(m => m.ResumenTestCivilOralPage)
  },

  // ========================================
  // CIVIL - RECURSOS
  // ========================================
  {
    path: 'civil/material-estudio-civil',
    loadComponent: () => import('./pages/civil/material-estudio-civil/material-estudio-civil.page').then(m => m.MaterialEstudioCivilPage)
  },
  {
    path: 'civil/plan-estudio-civil',
    loadComponent: () => import('./pages/civil/plan-estudio-civil/plan-estudio-civil.page').then(m => m.PlanEstudioCivilPage)
  },

  // ========================================
  // FALLBACK
  // ========================================
  { path: '**', redirectTo: '/welcome' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { 
      preloadingStrategy: PreloadAllModules 
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
// src/app/features/trades/trades.routes.ts
import { Routes } from '@angular/router';

export const tradesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./trade-list.component').then(m => m.TradeListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./trade-form.component').then(m => m.TradeFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./trade-detail.component').then(m => m.TradeDetailComponent)
  }
];

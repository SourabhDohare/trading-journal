// src/app/app.routes.ts
import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";

export const routes: Routes = [
  {
    path: "auth",
    loadChildren: () =>
      import("./features/auth/auth.routes").then((m) => m.authRoutes),
  },
  {
    path: "",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./shared/components/layout/layout.component").then(
        (m) => m.LayoutComponent,
      ),
    children: [
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
      {
        path: "dashboard",
        loadComponent: () =>
          import("./features/dashboard/dashboard.component").then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: "trades",
        loadChildren: () =>
          import("./features/trades/trades.routes").then((m) => m.tradesRoutes),
      },
      {
        path: "analytics",
        loadComponent: () =>
          import("./features/analytics/analytics.component").then(
            (m) => m.AnalyticsComponent,
          ),
      },
      {
        path: "journal",
        loadComponent: () =>
          import("./features/journal/journal.component").then(
            (m) => m.JournalComponent,
          ),
      },
      {
        path: "reports",
        loadComponent: () =>
          import("./features/reports/reports.component").then(
            (m) => m.ReportsComponent,
          ),
      },
      {
        path: "profile",
        loadComponent: () =>
          import("./features/profile/profile.component").then(
            (m) => m.ProfileComponent,
          ),
        canActivate: [AuthGuard],
      },
    ],
  },
  { path: "**", redirectTo: "" },
];

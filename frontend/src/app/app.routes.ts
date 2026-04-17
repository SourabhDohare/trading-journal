import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";

export const routes: Routes = [

  // ── Public marketing pages — no auth required ──────────────────────────────
  {
    path: "",
    pathMatch: "full",
    loadComponent: () =>
      import("./features/landing/landing.component").then(m => m.LandingComponent),
  },
  {
    path: "pricing",
    loadComponent: () =>
      import("./features/landing/pricing.component").then(m => m.PricingComponent),
  },
  {
    path: "contact",
    loadComponent: () =>
      import("./features/landing/contact.component").then(m => m.ContactComponent),
  },
  {
    path: "feedback",
    loadComponent: () =>
      import("./features/landing/feedback.component").then(m => m.FeedbackComponent),
  },
  {
    path: "privacy",
    loadComponent: () =>
      import("./features/landing/privacy.component").then(m => m.PrivacyComponent),
  },
  {
    path: "terms",
    loadComponent: () =>
      import("./features/landing/terms.component").then(m => m.TermsComponent),
  },

  // ── Auth pages ─────────────────────────────────────────────────────────────
  {
    path: "auth",
    loadChildren: () =>
      import("./features/auth/auth.routes").then(m => m.authRoutes),
  },

  // ── Protected app — layout wrapper with auth guard ─────────────────────────
  {
    path: "",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./shared/components/layout/layout.component").then(m => m.LayoutComponent),
    children: [
      {
        path: "dashboard",
        loadComponent: () =>
          import("./features/dashboard/dashboard.component").then(m => m.DashboardComponent),
      },
      {
        path: "trades",
        loadChildren: () =>
          import("./features/trades/trades.routes").then(m => m.tradesRoutes),
      },
      {
        path: "analytics",
        loadComponent: () =>
          import("./features/analytics/analytics.component").then(m => m.AnalyticsComponent),
      },
      {
        path: "journal",
        loadComponent: () =>
          import("./features/journal/journal.component").then(m => m.JournalComponent),
      },
      {
        path: "reports",
        loadComponent: () =>
          import("./features/reports/reports.component").then(m => m.ReportsComponent),
      },
      {
        path: "profile",
        canActivate: [authGuard],
        loadComponent: () =>
          import("./features/profile/profile.component").then(m => m.ProfileComponent),
      },
    ],
  },

  { path: "**", redirectTo: "" },
];
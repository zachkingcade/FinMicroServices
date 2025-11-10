import { Routes } from '@angular/router';
import { Ledger } from './pages/ledger/ledger';
import { ErrorPage } from './pages/error-page/error-page';

export const routes: Routes = [
    // redirect '' (empty path) to /landing
    { path: '', redirectTo: 'landing', pathMatch: 'full' },

    // your landing page route
    { path: 'landing', component: Ledger },

        // your landing page route
    { path: 'error', component: ErrorPage },

    // (optional) catch-all for 404s
    { path: '**', redirectTo: 'error' }
];

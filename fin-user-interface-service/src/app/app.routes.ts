import { Routes } from '@angular/router';
import { Ledger } from './pages/ledger/ledger';
import { ErrorPage } from './pages/error-page/error-page';
import { AccountTypes } from './pages/account-types/account-types';
import { Accounts } from './pages/accounts/accounts';
import { PendingTransactions } from './pages/pending-transactions/pending-transactions';

export const routes: Routes = [
    // redirect empty path to ledger
    { path: '', redirectTo: 'ledger', pathMatch: 'full' },

    { path: 'ledger', component: Ledger },

    { path: 'accounttypes', component: AccountTypes },

    { path: 'accounts', component: Accounts },

    { path: 'pendingtransacitons', component: PendingTransactions },

    { path: 'error', component: ErrorPage },

    // catch-all for 404s
    { path: '**', redirectTo: 'error' }
];

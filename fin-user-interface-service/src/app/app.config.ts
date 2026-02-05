import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

import { FeatherModule } from 'angular-feather';
import { BookOpen, Columns, Copy, Edit, File, Inbox, Package, PenTool, PieChart, Play, Plus, Repeat, Slash, Trash2, Filter } from 'angular-feather/icons';
import { provideHttpClient } from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';
import { provideAnimations } from '@angular/platform-browser/animations';

const icons = { BookOpen, Package, PenTool, Inbox, File, Trash2, Columns, Copy, Edit, Slash, Filter, Play, Repeat, PieChart, Plus };

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideRouter(routes),
    importProvidersFrom(FeatherModule.pick(icons)),
    provideHttpClient(),
    provideToastr(),
    provideAnimations()
  ]
};
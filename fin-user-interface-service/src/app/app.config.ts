import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

import { FeatherModule } from 'angular-feather';
import { Home, MessageSquare, Users, Folder, Archive, HelpCircle, Settings, BookOpen } from 'angular-feather/icons';
import { provideHttpClient } from '@angular/common/http';

const icons = { Home, MessageSquare, Users, Folder, Archive, HelpCircle, Settings, BookOpen };

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideRouter(routes),
    importProvidersFrom(FeatherModule.pick(icons)),
    provideHttpClient()
  ]
};
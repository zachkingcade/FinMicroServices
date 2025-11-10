import { Component, importProvidersFrom } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { Home, MessageSquare, Users, Folder, Archive, HelpCircle, Settings } from 'angular-feather/icons';
import { ErrorPage } from '../../pages/error-page/error-page';
import { RouterLink, RouterOutlet } from '@angular/router';

const icons = {
  Home,
  MessageSquare,
  Users,
  Folder,
  Archive,
  HelpCircle,
  Settings
};

@Component({
  selector: 'app-nav-bar',
  imports: [FeatherModule, RouterLink],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.scss',
})
export class NavBar {
  
}

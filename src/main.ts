import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
// Import the correct class name
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
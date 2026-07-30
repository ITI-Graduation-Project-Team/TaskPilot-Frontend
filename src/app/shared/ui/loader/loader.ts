import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './loader.html',
  styleUrl: './loader.scss',
})
export class LoaderComponent {}
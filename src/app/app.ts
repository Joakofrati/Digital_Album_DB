import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
// 1. IMPORTANTE: Importamos tu componente nuevo acá arriba
import { AlbumComponent } from './album/album';

@Component({
  selector: 'app-root',
  standalone: true,
  // 2. IMPORTANTE: Lo agregamos al array de imports
  imports: [CommonModule, RouterOutlet, AlbumComponent],
  templateUrl: './app.html',
  styleUrl: './app.css' // (o .scss dependiendo de qué elegiste)
})
export class AppComponent {
  title = 'album-digital';
}
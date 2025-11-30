import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css'
})
export class LandingPageComponent {
  
  constructor(private router: Router) {}

  onComenzar() {
    console.log('onComenzar ejecutado'); 
    this.router.navigate(['/login']);
  }

  onSolicitarDemo() {
    console.log('Solicitar demo');
    this.router.navigate(['/login']);
  }
}
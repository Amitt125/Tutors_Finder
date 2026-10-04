import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { MessageService } from './core/services/message.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar />
    <main>
      <router-outlet />
    </main>
  `,
  styles: [`main { min-height: calc(100vh - 64px); }`]
})
export class AppComponent implements OnInit {
  // Angular 19: inject() in class body
  private messageService = inject(MessageService);
  private authService    = inject(AuthService);

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.messageService.connect();
    }
  }
}

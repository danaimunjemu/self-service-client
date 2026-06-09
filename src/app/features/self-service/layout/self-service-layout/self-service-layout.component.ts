import { Component, HostListener } from '@angular/core';
import { RoutingService } from '../../../../core/services/routing.service';

@Component({
  selector: 'app-self-service-layout',
  templateUrl: './self-service-layout.component.html',
  styleUrl: './self-service-layout.component.scss',
})
export class SelfServiceLayoutComponent {
  constructor(private routingService: RoutingService) {}

  openAccount() {}

  isScrolled = false;

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    // @ts-ignore
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    this.isScrolled = scrollTop > 50; // Change to your desired scroll threshold
  }

  navigateTo(page: string) {
    this.routingService.navigateByUrl('self-service/' + page);
    this.handleLoansCancel();
  }


  isLoansVisible = false;

  showLoansModal(): void {
    this.isLoansVisible = true;
  }

  handleLoansCancel(): void {
    this.isLoansVisible = false;
  }
}

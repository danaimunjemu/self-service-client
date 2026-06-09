import { Component, OnDestroy, OnInit } from '@angular/core';
import { RoutingService } from '../../../../core/services/routing.service';
import { AccountOpeningService } from '../../services/account-opening.service';
import { SubscriptionsManager } from '../../../../core/helpers/SubscriptionsManager';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  constructor(private routingService: RoutingService, private accountOpeningService: AccountOpeningService, private notification: NzNotificationService) {}
  ngOnDestroy(): void {
    this.subs.dispose();
  }

  ngOnInit(): void {
   this.subs.add = this.accountOpeningService.queryTicketResponse$.subscribe((res: any) => {
this.onQueryTicketResponse(res);
   });
   this.subs.add = this.accountOpeningService.updateGuarantorResponse$.subscribe((res: any) => {
    this.onUpdateGuarantorResponse(res);
  });
  }

  onQueryTicketResponse(res: any) {
    console.log(res);
this.queryTicket = res.data;
this.showModal();
    this.mockTrackingIssue();
    this.isLoadingTrackIssue = false;
  }

  onUpdateGuarantorResponse(res: any) {
    if(res.success) {
      this.notification.create('success', 'Success', 'Information submitted successfully');
      this.navigateTo('home');
    } else {
      this.notification.create('error', 'Error', 'Failed to submit information');
    }
    this.guarantorConfirmationLoader = false;
  }

  queryTicket?: any;
  guarantorConfirmationLoader: boolean = false;

  subs = new SubscriptionsManager();

  searchOptions(event: any) {
    this.navigateTo(event);
  }

  navigateTo(page: string) {
    this.routingService.navigateByUrl('self-service/' + page);
  }

  selectedValue = null;

  openAccount() {}

  ticketId = '';
  isLoadingTrackIssue: boolean = false;

  trackIssue() {
    // let service = '';
    // if (this.ticketId.includes("CBS.ACC")) {
    //   service = "account-opening"
    // } else if (this.ticketId.includes("CBS.ACC")) {
    //   service = "account-opening"
    // }
    this.isLoadingTrackIssue = true;
    this.accountOpeningService.queryTicket(this.ticketId);
  }

  isVisible = false;
  isConfirmLoading = false;

  showModal(): void {
    this.isVisible = true;
  }

  mockTrackingIssue() {
    setTimeout(() => {
      this.isLoadingTrackIssue = false;
    }, 5000);
  }

  handleCancel(): void {
    this.isVisible = false;
    this.ticketId = "";
  }


  proceed(cont: boolean){
    this.routingService.navigateByUrl('self-service/loan-application?ticketId=' + this.ticketId + '&cont=' + cont);
  }

  resendOtpToGuarantor() {
    this.guarantorConfirmationLoader = true;
    this.accountOpeningService.updateGuarantor(this.queryTicket.record, 'guarantor-resend-otp');
  }


}

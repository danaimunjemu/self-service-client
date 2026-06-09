import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SelfServiceRoutingModule } from './self-service-routing.module';
import { AccountOpeningComponent } from './pages/account-opening/account-opening.component';
import { SelfServiceLayoutComponent } from './layout/self-service-layout/self-service-layout.component';
import { HomeComponent } from './pages/home/home.component';
import { AntDesignModules } from '../../core/modules/antdesign.module';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { FaqsComponent } from './pages/faqs/faqs.component';
import { ContactUsComponent } from './pages/contact-us/contact-us.component';
import { ProfilePhotoSnapComponent } from './components/profile-photo-snap/profile-photo-snap.component';

import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { LoanApplicationComponent } from './pages/loan-application/loan-application.component';
import { FcbStatusTagComponent } from './components/tags/fcb-status-tag/fcb-status-tag.component';
import { FcbScoreTagComponent } from './components/tags/fcb-score-tag/fcb-score-tag.component';
import { SelfServiceStatusTagComponent } from './components/tags/self-service-status-tag/self-service-status-tag.component';
import { AfcLinkLoginComponent } from './components/afc-link-login/afc-link-login.component';
import { GuarantorConfirmationComponent } from './pages/guarantor-confirmation/guarantor-confirmation.component';
import { InsuranceApplicationComponent } from './pages/insurance-application/insurance-application.component';
import { LoanApplicationNonAfcComponent } from './pages/loan-application-non-afc/loan-application-non-afc.component';

const config: SocketIoConfig = { url: 'ws://localhost:8000/ws', options: {} };

@NgModule({
  declarations: [
    AccountOpeningComponent,
    SelfServiceLayoutComponent,
    HomeComponent,
    FaqsComponent,
    ContactUsComponent,
    ProfilePhotoSnapComponent,
    LoanApplicationComponent,
    FcbStatusTagComponent,
    FcbScoreTagComponent,
    SelfServiceStatusTagComponent,
    AfcLinkLoginComponent,
    GuarantorConfirmationComponent,
    InsuranceApplicationComponent,
    LoanApplicationNonAfcComponent,
  ],
  imports: [
    CommonModule,
    SelfServiceRoutingModule,
    AntDesignModules,
    SharedModule,
    FormsModule,
    SocketIoModule.forRoot(config),
  ],
})
export class SelfServiceModule {}

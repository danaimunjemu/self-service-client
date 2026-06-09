import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SelfServiceLayoutComponent } from './layout/self-service-layout/self-service-layout.component';
import { HomeComponent } from './pages/home/home.component';
import { AccountOpeningComponent } from './pages/account-opening/account-opening.component';
import { FaqsComponent } from './pages/faqs/faqs.component';
import { ContactUsComponent } from './pages/contact-us/contact-us.component';
import { LoanApplicationComponent } from './pages/loan-application/loan-application.component';
import { GuarantorConfirmationComponent } from './pages/guarantor-confirmation/guarantor-confirmation.component';
import { InsuranceApplicationComponent } from './pages/insurance-application/insurance-application.component';
import {LoanApplicationNonAfcComponent} from "./pages/loan-application-non-afc/loan-application-non-afc.component";

const routes: Routes = [
  {
    path: '',
    component: SelfServiceLayoutComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomeComponent },
      { path: 'open-new-account', component: AccountOpeningComponent },
      { path: 'loan-application', component: LoanApplicationComponent },
      { path: 'loan-application-non-afc', component: LoanApplicationNonAfcComponent },
      // { path: 'guarantor-confirmation', component: GuarantorConfirmationComponent },
      { path: 'insurance-application', component: InsuranceApplicationComponent },
      { path: 'faqs', component: FaqsComponent },
      { path: 'contact-us', component: ContactUsComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SelfServiceRoutingModule {}

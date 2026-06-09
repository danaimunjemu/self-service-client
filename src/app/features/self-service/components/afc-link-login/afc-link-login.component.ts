import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { AccountOpeningService } from '../../services/account-opening.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AteAuthService } from '../../services/ate-auth.service';
import { SubscriptionsManager } from '../../../../core/helpers/SubscriptionsManager';

@Component({
  selector: 'afc-link-login',
  templateUrl: './afc-link-login.component.html',
  styleUrl: './afc-link-login.component.scss'
})
export class AfcLinkLoginComponent implements OnInit, OnDestroy {
  @Output() loginComplete = new EventEmitter<any>();

  constructor(
    private accountOpeningService: AccountOpeningService,
          private notification: NzNotificationService,
          private ateAuthService: AteAuthService,
  ){}

  otpIsVisible = false;


  loginForm = {
    username: '',
    password: '',
    grant_type: 'password',
    otp: '',
    otpRef: ''
  }

  ngOnDestroy(): void {
    this.subs.dispose();
  }

  ngOnInit(): void {
    this.subs.add = this.ateAuthService.accessTokenResponse$.subscribe((res: any) => {
      this.onGetAccessTokenResponse(res);
    });
    this.subs.add = this.ateAuthService.resendOTPResponse$.subscribe((res: any) => {
      this.onResendOTPResponse(res);
    });
  }

  onResendOTPResponse(res: any) {
    this.resendOtpLoader = false;
    this.loginStage = 1;
    this.otpIsVisible = true;
    if(res.success) {
      this.notification.create('success', 'Success', 'OTP resent successfully');
    } else {
      this.notification.create('error', 'Error', 'Error processing request');
    }
  }

  subs = new SubscriptionsManager();

  loginStage: number = 0;
  loanApplicationInputs = {
    pidNumber: '',
    mobileNumber: '',
    customerName: '',
    userId: '',
    userAccounts: [] as any[],
    civilServant: false,
    staff: false,
    ecNumber: "",
    type: "",
  }

  otpId?: any;

  onGetAccessTokenResponse(response: any) {
    console.log(this.loginStage)
    this.loginLoader = false;
    console.log(response);
    let res = response.data
    switch (this.loginStage){
      case 0:
        console.log("This is stage 0")
        if (res.otpReference) {
          this.notification.create('success', 'Success', 'Please enter the OTP sent to your mobile number');
          this.loginForm.otpRef = res.otpReference;
          this.loanApplicationInputs.userId = res.userId;
          this.otpId = res.id;
          this.loginStage = 1;
          this.otpIsVisible = true;
        } else if(res.error) {
          this.notification.create('error', res.error, res.error_description);
        }
        break;
      case 1:
        if (res.accessToken) {
          let processedUser = this.processUser(res)
          console.log("!!!! processed user", processedUser)
          if (processedUser.error) {
            this.loginComplete.emit({error: true, data: processedUser.message});
          } else {
            // for (let account of res.accounts) {
            //   this.loanApplicationInputs.userAccounts.push({'number': account.accountNumber, 'currency': account.currency})
            // }
            this.loanApplicationInputs.userAccounts = processedUser.accounts ?? [];
            this.loanApplicationInputs.pidNumber = res.user.nationalId
            this.loanApplicationInputs.type = res.type
            this.loanApplicationInputs.mobileNumber = res.user.msisdn
            this.loanApplicationInputs.customerName = res.user.firstName + " " + res.user.lastName
            this.loanApplicationInputs.civilServant = processedUser.civilServant ?? false
            this.loanApplicationInputs.staff = processedUser.staff ?? false
            this.loanApplicationInputs.ecNumber = processedUser.ecNumber
            this.loginComplete.emit({error: false, data: this.loanApplicationInputs});
          }



          this.loginStage=0;

          //TODO: emit event
        } else if(res.error) {
          // this.notification.create('error', res.error, res.error_description);
          this.notification.create('error', 'Error', 'Error processing request');
        }
        break;
      default:
        this.notification.create('error', res.error, res.error_description);
          break;
    }

  }

  processUser(res: any) {
    let userAccounts = [] as any[];
    console.log(res);
    if (res.accounts == null) {
      return {error: true, message: "Failed to process your request. Visit your nearest branch for assistance.", accounts: []}
    }
    if (res.staff && res.civilServant) {
      return {error: true, message: "Failed to process your request. Visit your nearest branch for assistance.", accounts: []}
    }
    if (res.staff) {
      return {error: true, message: "Staff members should use AFC link for applications", accounts: []}
    } else if (res.civilServant) {
      for (let account of res.caResults.accounts) {
        if (account.repaymentAccount != "" ) {
          userAccounts.push(
            {
              'number': account.account,
              'currency': account.currency,
              'repaymentAccount': account.repaymentAccount
            }
          )
        }
      }
      return {error: false, accounts: userAccounts, civilServant: true, staff: false, ecNumber: res.caResults.ecNumber,};
    } else if (!res.staff && !res.civilServant) {
      for (let account of res.accounts) {
        userAccounts.push(
          {
            'number': account.accountNumber,
            'currency': account.currency,
            'repaymentAccount': account.accountNumber
          }
          )
      }
      return {error: false, accounts: userAccounts, civilServant: false, staff: false, ecNumber: '', };
    }
    return {error: true, message: "Failed to process your request. Visit your nearest branch for assistance."}
  }


  loginLoader: boolean = false;

  normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters (like +, spaces, hyphens)
    const digits = phone.replace(/\D/g, '');

    // Remove leading zeros or country code variants, then add "263"
    if (digits.startsWith('263')) {
      return digits;
    } else if (digits.startsWith('0')) {
      return '263' + digits.substring(1);
    } else {
      return '263' + digits;
    }
  }


  authenticate() {
    this.loginForm.username = "263" + this.loginForm.username.slice(-9);
    this.loginLoader = true;
    let req = {
      mobile: this.loginForm.username,
      pin: this.loginForm.password,
      otp: this.loginForm.otp,
      otpRef: this.loginForm.otpRef
    }
    console.log(req)

    this.ateAuthService.getAccessToken(req)
  }

  resendOtpLoader: boolean = false;

  resendOTP() {
    this.resendOtpLoader = true;
    this.otpIsVisible = false;
    this.loginStage = 0;
    this.ateAuthService.resendOTP(this.otpId)
  }


}

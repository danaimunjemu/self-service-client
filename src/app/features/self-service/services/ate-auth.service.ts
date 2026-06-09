import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AteAuthService {

  constructor(
      private http: HttpClient,
    ) { }

    accessTokenResponse$ = new Subject();
    resendOTPResponse$ = new Subject();
    accEnquiryResponse$ = new Subject();

    getAccessToken(req: any) {
      // let params = new HttpParams();
      // Object.keys(req).forEach(key => {
      //   params = params.append(key, req[key]);
      // });
      this.http.post(SELF_SERVICE_URL + 'auth/login?ca=y', req).subscribe((res: any) => {
        this.accessTokenResponse$.next(res);
      })
    }

    accountEnquiry(req: any) {
      this.http.post(ACC_ENQ_URL + 'account-enquiry', req, ).subscribe((res: any) => {
        this.accEnquiryResponse$.next(res);
      })
    }

    resendOTP(req: any) {
      this.http.get(SELF_SERVICE_URL + 'auth/resend-otp/' + req).subscribe((res: any) => {
        this.resendOTPResponse$.next(res);
      })
    }


}

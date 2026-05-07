import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable, Subject} from "rxjs";
import {PosmanMerchantOnboarding} from "../pages/posman-merchant-onboarding/posman-merchant-onboarding";


@Injectable({
  providedIn: 'root'
})
export class PosmanMerchantOnboardingService {

  // private baseUrl = "http://localhost:8080/api/v1/pos";


  constructor(private http: HttpClient) { }

  getBranchesResponse$ = new Subject();

  createPosRequest(request: PosmanMerchantOnboarding, file: File): Observable<any> {
    const formData = new FormData();

    formData.append('firstName', request.firstName || '');
    formData.append('lastName', request.lastName || '');
    formData.append('emailId', request.emailId || '');
    formData.append('phone', request.phone || '');
    formData.append('accountNumber', request.accountNumber || '');
    formData.append('branch', request.branch || '');
    formData.append('shopLicense', request.shopLicense || '');
    formData.append('file', file);

    // This return statement MUST be reachable in every scenario
    return this.http.post(SELF_SERVICE_URL, formData);
  }

}

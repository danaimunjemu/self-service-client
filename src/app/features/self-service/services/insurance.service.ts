import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class InsuranceService {

  constructor(
    private http: HttpClient,
  ) { }

  generateQuotationResponse$ = new Subject();
  getRiskClassesResponse$ = new Subject();
  acceptQuotationResponse$ = new Subject();

  generateQuotation = (req: any) => {
    this.http.post(INSURANCE_SERVICE_URL + 'accounts/api/portal/generate-quotation', req).subscribe((res: any) => {
      this.generateQuotationResponse$.next(res);
    })
  };

  acceptQuotation(req: any) {
    this.http.post(INSURANCE_SERVICE_URL + 'accounts/api/portal/accept-quotation/' + req, {}).subscribe((res: any) => {
      this.acceptQuotationResponse$.next(res);
    })
  }

  getRiskClasses(){
    this.http.get(INSURANCE_SERVICE_URL + 'accounts/api/portal/riskClass').subscribe((res: any) => {
      this.getRiskClassesResponse$.next(res);
    })
  }

}

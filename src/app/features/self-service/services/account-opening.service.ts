import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccountOpeningService {

  constructor(
    private http: HttpClient,
  ) { }

  queryRegistrarResponse$ = new Subject();
  createNewRecordResponse$ = new Subject();
  updateRecordResponse$ = new Subject();
  queryTicketResponse$ = new Subject();
  updateGuarantorResponse$ = new Subject();
  getLoanByRefResponse$ = new Subject();
  guarantorAccountEnquiryResponse$ = new Subject();
  getBranchesResponse$ = new Subject();
  getMccResponse$ = new Subject();

  queryRegistrar(req: any) {
    this.http.post(SELF_SERVICE_URL + 'query/registrar/' + req, {}).subscribe((res: any) => {
      this.queryRegistrarResponse$.next(res);
    })
  }

  uploadFile(req: any): Observable<any> {
    return this.http.post(CDN_SERVICE_URL + 'cdn', req);
  }

  createNewRecord(req: any, service: any) {
      return this.http.post(SELF_SERVICE_URL + 'new?service=' + service, req).subscribe((res: any) => {
      this.createNewRecordResponse$.next(res);
    });
  }

  queryTicket(req: any) {
    this.http.post(SELF_SERVICE_URL + 'query/ticket/' + req, {}).subscribe((res: any) => {
      this.queryTicketResponse$.next(res);
    })
  }

  updateRecord(req: any) {
    return this.http.post(SELF_SERVICE_URL + 'update-record', req).subscribe((res: any) => {
      this.updateRecordResponse$.next(res);
    });
  }

  updateGuarantor(req: any, updateType: any) {
    return this.http.post(SELF_SERVICE_URL + 'external?service=loans&ep=' + updateType + '&lb=true', req).subscribe((res: any) => {
      this.updateGuarantorResponse$.next(res);
    });
  }

  getLoanByRef(req: any, updateType: any) {
    return this.http.post(SELF_SERVICE_URL + 'external?service=loans&ep=' + updateType + '&lb=true', req).subscribe((res: any) => {
      this.getLoanByRefResponse$.next(res);
    });
  }

  guarantorAccountEnquiry(req: any) {
    this.http.post(SELF_SERVICE_URL + 'query/account/' + req, {}).subscribe((res: any) => {
      this.guarantorAccountEnquiryResponse$.next(res);
    })
  }

  getBranches() {
    this.http.post(SELF_SERVICE_URL + 'external?service=juser&post=false&ep=branches&lb=true', {"success": false}).subscribe((res: any) => {
      this.getBranchesResponse$.next(res);
    })
  }

  getMcc() {
    this.http.post(SELF_SERVICE_URL + 'external?service=rposman&post=false&ep=getMCC&lb=false', {"success": false}).subscribe((res: any) => {
      this.getMccResponse$.next(res);
    })
  }

}

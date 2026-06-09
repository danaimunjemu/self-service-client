import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import { Injectable, ErrorHandler } from '@angular/core';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import { Router } from '@angular/router';
import {NzNotificationService} from "ng-zorro-antd/notification";
import {GlobalLoaderService} from "../services/loader/global-loader.service";

@Injectable({
  providedIn: 'root',
})
export class HandleErrorService implements ErrorHandler {
  serviceData: any;

  constructor(
    private router: Router,
    private http: HttpClient,
    private notificationService: NzNotificationService,
    private globalLoader: GlobalLoaderService
  ) {}

  private subject = new Subject<any>();
  isLoading = new BehaviorSubject<boolean>(false);


  sendClickEvent(value: any) {
    this.serviceData = value;
    this.subject.next(value);
  }

  setLoading(val: boolean) {
    this.globalLoader.stopAllLoaders();
    console.log('[HandleErrorService] setLoading ->', val, 'this:', this);
    this.isLoading.next(val);
  }

  logError(request: any) {
    this.http.post( OUTPOST_URL + 'incident', request).subscribe((response: any) => {
      console.log("error sent")
    });
  }

  private transformError(error: any): any {
    if (error.message && error.message.includes('NG0100')) {
      return `Custom Message: An ExpressionChangedAfterItHasBeenCheckedError occurred. ${error.message}`;
    }
    return error;
  }

  // Handling HTTP Errors using Toaster
  public handleHttpError(err: HttpErrorResponse) {
    console.log('HTTP Error: ', err);
    let errorHeader!: string;
    let errorMessage = err.error.message;
    let errorCode = err.error.statusCode;

    // @ts-ignore
    if (err.error instanceof ErrorEvent) {
      console.log("IN IF")
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      console.log("IN ELSE");
      console.log("ERROR STATUS: " ,err.status);
      switch (err.status) {
        case 400:
          errorHeader = `Bad Request. ${err.error?.statusCode || ''}`;
          break;
        case 401:
          console.log("This is a 401 error")
          errorHeader = `Unauthorized. ${err.error?.statusCode || ''}`;
          break;
        case 403:
          errorHeader = `Forbidden. ${err.error?.statusCode || ''}`;
          setTimeout(() => this.router.navigateByUrl('/'), 2000);
          break;
        case 404:
          errorHeader = `Not Found. ${err.error?.statusCode || ''}`;
          break;
        case 405:
          errorHeader = `Method Not Allowed. ${err.error?.statusCode || ''}`;
          break;
        case 406:
          errorHeader = `Not Acceptable. ${err.error?.statusCode || ''}`;
          break;
        case 407:
          errorHeader = `Proxy Authentication Required. ${err.error?.statusCode || ''}`;
          break;
        case 408:
          errorHeader = `Request Timeout. ${err.error?.statusCode || ''}`;
          break;
        case 409:
          errorHeader = `Conflict. ${err.error?.statusCode || ''}`;
          break;
        case 410:
          errorHeader = `Gone. ${err.error?.statusCode || ''}`;
          break;
        case 411:
          errorHeader = `Length Required. ${err.error?.statusCode || ''}`;
          break;
        case 412:
          errorHeader = `Precondition Failed. ${err.error?.statusCode || ''}`;
          break;
        case 413:
          errorHeader = `Content Too Large. ${err.error?.statusCode || ''}`;
          break;
        case 414:
          errorHeader = `URI Too Long. ${err.error?.statusCode || ''}`;
          break;
        case 415:
          errorHeader = `Unsupported Media Type. ${err.error?.statusCode || ''}`;
          break;
        case 416:
          errorHeader = `Range Not Satisfiable. ${err.error?.statusCode || ''}`;
          break;
        case 417:
          errorHeader = `Expectation Failed. ${err.error?.statusCode || ''}`;
          break;
        case 418:
          errorHeader = `I'm a teapot 🙃. ${err.error?.statusCode || ''}`;
          break;
        case 422:
          errorHeader = `Unprocessable Content. ${err.error?.statusCode || ''}`;
          break;
        case 500:
          errorHeader = `Internal Server Error. ${err.error?.statusCode || ''}`;
          break;
        case 501:
          errorHeader = `Not Implemented. ${err.error?.statusCode || ''}`;
          break;
        case 502:
          errorHeader = `Bad Gateway. ${err.error?.statusCode || ''}`;
          break;
        case 503:
          errorHeader = `Service Unavailable. ${err.error?.statusCode || ''}`;
          break;
        case 504:
          errorHeader = `Gateway Timeout. ${err.error?.statusCode || ''}`;
          break;
        default:
          errorHeader = `Error. ${err.error?.statusCode || ''}`;
      }
    }
    this.notificationService.create('error', errorHeader, errorMessage, {nzDuration: 5000});

    this.setLoading(false);
  }

  // Implement ErrorHandler interface method
  handleError(error: any): void {
    if (error instanceof HttpErrorResponse) {
      this.handleHttpError(error);
    } else {
      console.log("Other Error: ", error.message);
    }
  }

}

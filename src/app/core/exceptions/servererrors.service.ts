import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { HandleErrorService } from './handle-error.service';

export const serverErrorsInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const errorService = inject(HandleErrorService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      console.log("Error caught")
      console.log(Object.keys(err))
      console.log(Object.values(err))
      if (err.url !== 'http://localhost:4200/') {
        errorService.handleError(err);
        console.warn("Global error that occurred", err);
      }
      return throwError(() => err);
    })
  );
};

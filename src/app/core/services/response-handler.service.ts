import { Injectable } from '@angular/core';
import {LoaderService} from "./loader/loader.service";
import {NzNotificationService} from "ng-zorro-antd/notification";

export interface ResponseHandlerOptions<T> {
  loader?: LoaderService;
  assignTo?: (res: any) => void;
  notification?: { type: 'success' | 'error'; message: string };
  extra?: (res: any) => void;
}

@Injectable({
  providedIn: 'root'
})
export class ResponseHandlerService {

  constructor(private notificationService: NzNotificationService) {}

  handle<T>(options: ResponseHandlerOptions<T>) {
    return (res: T) => {
      console.log(res);

      if (options.assignTo) options.assignTo(res);

      if (options.loader) options.loader.hide();

      if (options.notification) {
        this.notificationService.create(
          options.notification.type,
          options.notification.message,
          '',
          { nzDuration: 5000 }
        );
      }

      if (options.extra) options.extra(res);
    };
  }

}

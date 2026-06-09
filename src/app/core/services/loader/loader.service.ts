import { Injectable } from '@angular/core';
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public readonly isLoading$ = this.loadingSubject.asObservable();

  get value() { return this.loadingSubject.value; } // local check in component

  show() { this.loadingSubject.next(true); }
  hide() { this.loadingSubject.next(false); }

}

import { Injectable } from '@angular/core';
import {LoaderService} from "./loader.service";
import {BehaviorSubject, combineLatest, map} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class GlobalLoaderService {

  private loaders: LoaderService[] = [];
  private globalLoadingSubject = new BehaviorSubject<boolean>(false);
  public readonly isGlobalLoading$ = this.globalLoadingSubject.asObservable();

  register(loader: LoaderService) {
    this.loaders.push(loader);
    this.update();
  }

  private update() {
    if (!this.loaders.length) {
      this.globalLoadingSubject.next(false);
      return;
    }

    combineLatest(this.loaders.map(l => l.isLoading$))
      .pipe(map(states => states.some(s => s)))
      .subscribe(isLoading => this.globalLoadingSubject.next(isLoading));
  }

  stopAllLoaders() {
    this.loaders.forEach(loader => loader.hide());
    this.update(); // refresh global state
  }

}

import { Component } from '@angular/core';
import {ConsoleToggleService} from "./core/helpers/console-toogle.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  constructor(
    private consoleToggleService: ConsoleToggleService
  ) {
    //this.consoleToggleService.disableConsoleInProduction();
  }
}

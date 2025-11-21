import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

/**
 * This service handles the combination of Wlog, console.log and the UI Toaster
 */
@Injectable({
  providedIn: 'root',
})
export class Campfire {
  //--------------------------------------------------------------------------------
  //Class Setup
  //--------------------------------------------------------------------------------
  constructor(
    private toast: ToastrService,
    private http: HttpClient
  ) { }

  sendToFileLogger(level:string, message: string) {
    this.http.post('/logs', {level: level, message: message}).subscribe({
      error: (err) => {
        console.error('BIG ERROR: Failed to send log to server', err);
      },
    });
  }

  debug(message: string, object?: any) {
    //Make message
    let finalMessage = message;
    if (object) {
      finalMessage += `: [${JSON.stringify(object)}]`;
    }

    //Show message
    console.log(finalMessage);
    this.sendToFileLogger("debug", finalMessage);
  }

  successAlert(message: string, object?: any) {
    //Make message
    let objectMessage = message;
    if (object) {
      objectMessage += `: [${JSON.stringify(object)}]`;
    }

    //Show message
    this.toast.success(message);
    console.log(`Success Alert: [${objectMessage}]`);
    this.sendToFileLogger("info", `Success Alert: [${objectMessage}]`);
  }

  infoAlert(message: string, object?: any) {
    //Make message
    let objectMessage = message;
    if (object) {
      objectMessage += `: [${JSON.stringify(object)}]`;
    }

    //Show message
    this.toast.info(message);
    console.log(`Info Alert: [${objectMessage}]`);
    this.sendToFileLogger("info", objectMessage);
  }

  errorAlert(message: string, errorMessage?: string, object?: any) {
    //Make message
    let finalMessage = message;
    if (object) {
      finalMessage += `: [${JSON.stringify(object)}]`;
    }

    if (errorMessage) {
      finalMessage += `: [${errorMessage}]`;
    }

    //Show message
    this.toast.error(message);
    console.log(`Error Alert: [${finalMessage}]`);
    this.sendToFileLogger("error", finalMessage);
  }

  quietError(message: string, errorMessage?: string, object?: any) {
    //Make message
    let finalMessage = message;
    if (object) {
      finalMessage += `: [${JSON.stringify(object)}]`;
    }

    if (errorMessage) {
      finalMessage += `: [${errorMessage}]`;
    }

    //Show message
    console.log(`Error Alert: [${finalMessage}]`);
    this.sendToFileLogger("error", finalMessage);
  }
}

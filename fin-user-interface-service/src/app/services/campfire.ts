import { Injectable } from '@angular/core';
import { Logger } from 'winston'
import { WLog } from '../WLog';
import { ToastrService } from 'ngx-toastr';

/**
 * This service handles the combination of Wlog, console.log and the UI Toaster
 */
@Injectable({
  providedIn: 'root',
})
export class Campfire {
  //--------------------------------------------------------------------------------
  //Member Varibles
  //--------------------------------------------------------------------------------
  private log: Logger;


  //--------------------------------------------------------------------------------
  //Class Setup
  //--------------------------------------------------------------------------------
  constructor(
    private toast: ToastrService
  ) {
    this.log = WLog.getLogger();
  }

  debug(message: string, object?: any) {
    //Make message
    let finalMessage = message;
    if (object) {
      finalMessage + `: [${JSON.stringify(object)}]`;
    }

    //Show message
    console.log(finalMessage);
    this.log.debug(finalMessage);
  }

  successAlert(message: string, object?: any) {
    //Make message
    let objectMessage = message;
    if (object) {
      objectMessage + `: [${JSON.stringify(object)}]`;
    }

    //Show message
    this.toast.success(message);
    console.log(`Success Alert: [${objectMessage}]`);
    this.log.info(`[${objectMessage}]`);
  }

  infoAlert(message: string, object?: any) {
    //Make message
    let objectMessage = message;
    if (object) {
      objectMessage + `: [${JSON.stringify(object)}]`;
    }

    //Show message
    this.toast.info(message);
    console.log(`Info Alert: [${objectMessage}]`);
    this.log.info(`[${objectMessage}]`);
  }

  errorAlert(message: string, errorMessage?: string, object?: any) {
    //Make message
    let finalMessage = message;
    if (object) {
      finalMessage + `: [${JSON.stringify(object)}]`;
    }

    if(errorMessage){
      finalMessage + `: [${errorMessage}]`;
    }

    //Show message
    this.toast.info(message);
    console.log(`Error Alert: [${finalMessage}]`);
    this.log.error(`[${finalMessage}]`);
  }

  quietError(message: string, errorMessage?: string, object?: any) {
    //Make message
    let finalMessage = message;
    if (object) {
      finalMessage + `: [${JSON.stringify(object)}]`;
    }

    if(errorMessage){
      finalMessage + `: [${errorMessage}]`;
    }

    //Show message
    console.log(`Error Alert: [${finalMessage}]`);
    this.log.error(`[${finalMessage}]`);
  }
}

import { connect, ChannelWrapper, AmqpConnectionManager } from 'amqp-connection-manager';
import { WLog } from '../WLog.js';
import { Logger } from 'winston';
import { AbstractQueueMessageHandler } from './AbstractQueueMessageHandler.js';
import { Message } from '../types/Message.js';
import { DatabaseHandler } from '../database/DatabaseHandler.js';
import { Account, AccountDTO } from '../types/Account.js';
import { AccountType, AccountTypeDTO } from '../types/AccountType.js';

export class QueueConsumerService {
  private static instance: QueueConsumerService | null = null;
  private queueHandler!: AbstractQueueMessageHandler;
  private log: Logger;
  private database!: DatabaseHandler;
  private static knownQueueNames = ["Accounts-Queue"];

  private constructor() {
    this.log = WLog.getLogger();
  }
/**
 * Gets instance of singleton class
 * @param ChosenQueueHandlerClass Dependency Injection of a class that implements AbstractQueueMessageHandler
 * @returns singleton instance 
 */
static async getInstance(ChosenQueueHandlerClass: typeof AbstractQueueMessageHandler): Promise<QueueConsumerService> {
    if (this.instance) {
      return this.instance;
    }

    let newInstance = new QueueConsumerService();
    newInstance.queueHandler = await ChosenQueueHandlerClass.getInstance(this.knownQueueNames);
    newInstance.database = new DatabaseHandler;

    return newInstance;
  }
/**
 * Setups the callbacks for queue "Account-Queue"
 */
async setupAccountQueue() {
    await this.queueHandler.subscribeToQueue("Accounts-Queue", (async (messageString: string) => {

      let messageObject: Message;
      try {
        messageObject = JSON.parse(messageString) as Message;
      } catch (err) {
        this.log.error(`Error Parsing message [${messageString}], is not of proper type Message. [${err}]`);
        throw new Error(`Error Parsing message [${messageString}], is not of proper type Message. [${err}]`);
      }
      this.log.info(`Message for command [${messageObject.commandKey}] parsed!`)

      if (messageObject.returnQueue == "Accounts-Queue") {
        this.log.error(`Error consumed message [${messageString}] has a return queue matching the queue being consumed from`);
        throw new Error(`Error consumed message [${messageString}] has a return queue matching the queue being consumed from`);
      }
      this.log.info(`Message for command [${messageObject.commandKey}] has acceptable return queue [${messageObject.returnQueue}]!`);

      this.log.info(`Processing Message for command [${messageObject.commandKey}]`);
      switch (messageObject.commandKey) {
        case "Add-Account-Type": {
          let newAccountType = JSON.parse(messageObject.data) as AccountTypeDTO
          this.database.addAccountType(newAccountType.type_description, newAccountType.type_class, newAccountType.notes);

          if (messageObject.returnQueue.toLowerCase() != "none") {
            let newMessage = this.constructMessage("Confirm-Add-Account-Type", "Success", "None");
            this.queueHandler.sendMessage(messageObject.returnQueue, newMessage);
          }
        }
          break;

        case "Add-Account": {
          let newAccount = JSON.parse(messageObject.data) as AccountDTO
          this.database.addAccount(newAccount.account_description, newAccount.account_type, newAccount.notes, newAccount.account_active);

          if (messageObject.returnQueue.toLowerCase() != "none") {
            let newMessage = this.constructMessage("Confirm-Add-Account", "Success", "None");
            this.queueHandler.sendMessage(messageObject.returnQueue, newMessage);
          }
        }
          break;

        case "Retrieve-All-Account-Types": {
          if (messageObject.returnQueue.toLowerCase() == "none") {
            throw Error(`Request Command Retrieve-All-Account-Types has an incorrect queue type [${messageObject.returnQueue}]`);
          }

          let results: AccountType[] = await this.database.getAllTypes();
          let newMessage = this.constructMessage("Read-All-Account-Types", JSON.stringify(results), "None");
          this.queueHandler.sendMessage(messageObject.returnQueue, newMessage);
        }
          break;

        case "Retrieve-All-Accounts": {
          if (messageObject.returnQueue.toLowerCase() == "none") {
            throw Error(`Request Command Retrieve-All-Accounts has an incorrect queue type [${messageObject.returnQueue}]`);
          }

          let results: Account[] = await this.database.getAllAccounts();
          let newMessage = this.constructMessage("Read-All-Accounts", JSON.stringify(results), "None");
          this.queueHandler.sendMessage(messageObject.returnQueue, newMessage);
        }
          break;

        case "Retrieve-Account-Type-By-Id": {
          if (messageObject.returnQueue.toLowerCase() == "none") {
            throw Error(`Request Command Retrieve-Account-Type-By-Id has an incorrect queue type [${messageObject.returnQueue}]`);
          }

          let result: AccountType = await this.database.getTypeById(Number(messageObject.data));
          let newMessage = this.constructMessage("Read-Account-Type-By-Id", JSON.stringify(result), "None");
          this.queueHandler.sendMessage(messageObject.returnQueue, newMessage);
        }
          break;

        case "Retrieve-Account-By-Id": {
          if (messageObject.returnQueue.toLowerCase() == "none") {
            throw Error(`Request Command Retrieve-Account-By-Id has an incorrect queue type [${messageObject.returnQueue}]`);
          }

          let result: Account = await this.database.getAccountById(Number(messageObject.data));
          let newMessage = this.constructMessage("Read-Account-By-Id", JSON.stringify(result), "None");
          this.queueHandler.sendMessage(messageObject.returnQueue, newMessage);
        }
          break;

        case "Retrieve-Account-Type-By-Description": {
          if (messageObject.returnQueue.toLowerCase() == "none") {
            throw Error(`Request Command Retrieve-Account-Type-By-Description has an incorrect queue type [${messageObject.returnQueue}]`);
          }

          let result: AccountType = await this.database.getTypeByDescription(messageObject.data);
          let newMessage = this.constructMessage("Read-Account-Type-By-Id", JSON.stringify(result), "None");
          this.queueHandler.sendMessage(messageObject.returnQueue, newMessage);
        }
          break;
        
        case "Close-Software": {
          this.log.info("Command Recieved to shutdown software!");
          this.log.info("This should rarely be used");
          //this gives time to acknoeledge the message so it dosen't immediately shutdown. 
          setTimeout(() => {
            this.closeConnection();
          },1000);
        }
        break;

        default: {
          throw Error(`Unknown command phrase [${messageObject.commandKey}] sent in queue message`)
        }
      }
    }))
  }

  /**
   * Constructs a proper message object
   * @param commandKey The commandkey for the message
   * @param data The misc data be transported, this will changed based on the given command
   * @param returnQueue The queue to send back to if any
   * @returns message
   */
  constructMessage(commandKey: string, data: string, returnQueue: string): Message {
    let result: Message = { commandKey: commandKey, data: data, returnQueue: returnQueue };
    return result;
  }
/**
 * Closes connection with the provided queue message handler
 */
closeConnection() {
    this.queueHandler.closeConnection();
  }
}

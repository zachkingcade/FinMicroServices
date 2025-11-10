import express from 'express'
import { WLog } from '../WLog.js'
import { Logger } from 'winston'
import { Account, AccountDTO } from '../types/Account.js'
import { DatabaseHandler } from '../database/DatabaseHandler.js'
import { Transaction } from '../types/Transaction.js'

export class ExpressHandler {
  private static instance: ExpressHandler | null = null
  private app = express()
  private log!: Logger
  private database!: DatabaseHandler

  static async getInstance(): Promise<ExpressHandler> {
    if (this.instance) {
      return this.instance
    }

    let newInstance = new ExpressHandler()
    newInstance.log = WLog.getLogger()
    newInstance.log.info("Creating new ExpressHandler instance!");

    newInstance.app.use(express.json())
    newInstance.database = await new DatabaseHandler()
    newInstance.database = new DatabaseHandler()
    await newInstance.database.startup()
    newInstance.setupPosts()
    newInstance.setupGets()

    const PORT = 3002

    await new Promise<void>((resolve, reject) => {
      newInstance.app.listen(PORT, () => {
        try {
          newInstance.log.info(`AccountService running on port [${PORT}]`)
          resolve()
        } catch (err) {
          newInstance.log.error(
            `Unable to establish listener on port [${PORT}]`
          )
          reject()
        }
      })
    })

    this.instance = newInstance
    return newInstance
  }

  setupPosts() {
    this.app.post('/transaction/add', async (req, res) => {
      try {
        let newTransaction: Transaction = req.body
        this.log.info(`Recieved command: /account/add/ with data ${newTransaction}`);
        await this.database.addTransaction(newTransaction.trans_date,newTransaction.trans_description, newTransaction.amount, newTransaction.credit_account,newTransaction.debit_account, newTransaction.notes);
        res.status(201).json({ status: 'Transaction Added', newTransaction })
      } catch (error) {
        this.log.error("Error http post: /transaction/add/, unable to add transaction");
        res.status(500).json({ status: 'Transaction Add Failed', error });
      }
    })
  }

  setupGets() {
    this.app.get('/transaction/getall', async (req, res) => {
      try {
        let results: Transaction[] = await this.database.getAllTransactions();
        res.json(results)
      } catch (error) {
        this.log.error("Error http get: /transaction/getall, unable to get all transactions");
        res.status(500).json({ status: "Error http get: /transaction/getall, unable to get all transactions", error });
      }
    })

    this.app.get('/transaction/getbyaccount/:accountCode', async (req, res) => {
      try {
        let accountCode = req.params.accountCode;
        this.log.info(`Recieved command: /transaction/getbyaccount/:accountCode [${accountCode}]`);
        let results: Transaction[] = await this.database.getAllTransactionsByAffectingAccount(Number(accountCode));
        res.json(results)
      } catch (error) {
        this.log.error(`Error http get: /transaction/getbyaccount, unable to get all transactions with account [${req.params.accountCode}]`);
        res.status(500).json({ status: `Error http get: /transaction/getbyaccount, unable to get all transactions with account [${req.params.accountCode}]`, error });
      }
    })

    this.app.get('/transaction/analysis/currentbalanceofaccount/:accountCode', async (req, res) => {
      try {
        let accountCode = Number(req.params.accountCode);
        this.log.info(`Recieved command: /transaction/analysis/currentbalanceofaccount/:accountCode [${accountCode}]`);
        
        if(!(await this.database.validateAccount(accountCode))){
          throw new Error(`Error in /transaction/analysis/currentbalanceofaccount/:accountCode [${accountCode}]. Invalid Account Code.`)
        }

        let transactionRecords: Transaction[] = await this.database.getAllTransactionsByAffectingAccount(accountCode);

        let result = 0;
        for(let transaction of transactionRecords){
          if(transaction.credit_account == accountCode){
            result -= transaction.amount;
          }
          if(transaction.debit_account == accountCode){
            result += transaction.amount;
          }
        }

        res.json(result);
      } catch (error) {
        this.log.error(`Error http get: /transaction/getbyaccount, unable to get all transactions with account [${req.params.accountCode}]`);
        res.status(500).json({ status: `Error http get: /transaction/getbyaccount, unable to get all transactions with account [${req.params.accountCode}]`, error });
      }
    })

  }
}

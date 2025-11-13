import express from 'express'
import { WLog } from '../WLog.js'
import { Logger } from 'winston'
import { Account, AccountDTO } from '../types/Account.js'
import { DatabaseHandler } from '../database/DatabaseHandler.js'
import { PendingTransaction, Transaction } from '../types/Transaction.js'
import { error } from 'console'

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
        await this.database.addTransaction(newTransaction.trans_date, newTransaction.trans_description, newTransaction.amount, newTransaction.credit_account, newTransaction.debit_account, newTransaction.notes);
        res.status(201).json({ status: 'Transaction Added', newTransaction })
      } catch (error) {
        this.log.error("Error http post: /transaction/add/, unable to add transaction");
        res.status(500).json({ status: 'Transaction Add Failed', error });
      }
    });

    this.app.post('/transaction/pending/add', async (req, res) => {
      try {
        let newPendingTransaction: PendingTransaction = req.body
        this.log.info(`Recieved command:/transaction/pending/add with data ${newPendingTransaction}`);
        await this.database.addPendingTransaction(newPendingTransaction.trans_date, newPendingTransaction.trans_description, newPendingTransaction.amount);
        res.status(201).json({ status: 'Pending Transaction Added', newPendingTransaction })
      } catch (error) {
        this.log.error("Error http post: /transaction/pending/add, unable to add Pending transaction");
        res.status(500).json({ status: 'Pending Transaction Add Failed', error });
      }
    })

    this.app.post('/transaction/remove', async (req, res) => {
      try {
        let oldTransaction: Transaction = req.body
        this.log.info(`Recieved command: /transaction/remove with data ${oldTransaction}`);
        await this.database.removeTransaction(oldTransaction.trans_code!)
        res.status(201).json({ status: 'Transaction removed', oldTransaction })
      } catch (error) {
        this.log.error("Error http post: /transaction/remove, unable to remove transaction");
        res.status(500).json({ status: 'Transaction remove Failed', error });
      }
    });

    this.app.post('/transaction/pending/remove', async (req, res) => {
      try {
        let oldPendingTransaction: PendingTransaction = req.body
        this.log.info(`Recieved command: /transaction/pending/remove with data ${oldPendingTransaction}`);
        await this.database.removePendingTransaction(oldPendingTransaction.trans_code!)
        res.status(201).json({ status: 'Pending Transaction removed', oldPendingTransaction })
      } catch (error) {
        this.log.error("Error http post: /transaction/pending/remove, unable to remove Pending transaction");
        res.status(500).json({ status: 'Pending Transaction remove Failed', error });
      }
    })

    this.app.post('/transaction/pending/addbycsv', express.text(), async (req, res) => {
      try {
        this.log.info(`Recieved CSV: [${req.body}]`);
        let pendingTransactionsCsvFile: string = req.body;
        this.log.info(`Recieved command: /transaction/pending/addbycsv ${pendingTransactionsCsvFile}`);
        let pendingTransactionArray = this.csvFileToPendingTransactionArray(pendingTransactionsCsvFile);
        for (let newPending of pendingTransactionArray) {
          await this.database.addPendingTransaction(newPending.trans_date, newPending.trans_description, newPending.amount);
        }
        res.status(201).json({ status: `Pending Transactions Added by csv. [${pendingTransactionArray.length}] new pending transactions.` });
      } catch (error) {
        this.log.error("Error http post: /transaction/pending/addbycsv, unable to add pending transactions");
        res.status(500).json({ status: 'Pending Transaction Add by csv Failed', error });
      }
    })

    this.app.post('/transaction/pending/convert', async (req, res) => {
      try {
        let pendingTransactionsToConvert: Transaction[] = req.body
        this.log.info(`Recieved command: /transaction/pending/convert with data [${pendingTransactionsToConvert}]`);
        let amountConverted = 0;
        for(let trans of pendingTransactionsToConvert){
          try{
            await this.convertPendingTransactionToTransaction(trans);
            amountConverted++;
          } catch(error){
            this.log.error(`Unable to convert Pending transaction [${trans}]`);
          }
        }
        res.status(201).json({ status: `Pending Transactions converted [${amountConverted}]`});
      } catch (error) {
        this.log.error("Error http post: /transaction/pending/convert, unable to convert Pending transaction");
        res.status(500).json({ status: 'Pending Transaction convert Failed', error });
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

    this.app.get('/transaction/pending/getall', async (req, res) => {
      try {
        let results: PendingTransaction[] = await this.database.getAllPendingTransactions();
        res.json(results)
      } catch (error) {
        this.log.error("Error http get: /transaction/pending/getall, unable to get all pending transactions");
        res.status(500).json({ status: "Error http get:/transaction/pending/getall, unable to get all pending transactions", error });
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

        if (!(await this.database.validateAccount(accountCode))) {
          throw new Error(`Error in /transaction/analysis/currentbalanceofaccount/:accountCode [${accountCode}]. Invalid Account Code.`)
        }

        let transactionRecords: Transaction[] = await this.database.getAllTransactionsByAffectingAccount(accountCode);

        let result = 0;
        for (let transaction of transactionRecords) {
          if (transaction.credit_account == accountCode) {
            result -= transaction.amount;
          }
          if (transaction.debit_account == accountCode) {
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

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //
  // Logic Methods
  //
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  //Note expected csv for: Date,Description,Original Description,Category,Amount,Status
  csvFileToPendingTransactionArray(fileString: string): PendingTransaction[] {
    let results: PendingTransaction[] = [];
    fileString = fileString.replace(/"/g, "");
    let rows = fileString
      .split(/\r?\n/) // Split by Windows or Unix newlines
      .filter(line => line.trim() !== '') // Filter out lines that are empty or contain only whitespace

    //removes first element, in this case the header of the .csv file
    rows.shift();
    for (let row of rows) {
      let columns = row.split(',');
      if (columns.length == 6) {
        let newPendingTransaction: PendingTransaction = {
          trans_date: columns[0]!,
          trans_description: columns[1]!,
          amount: Number(columns[4])!
        }
        results.push(newPendingTransaction);
      } else {
        this.log.error(`Error unable to make pending transaction from [${row}]. Not in expected format.`)
      }
    }

    return results;
  }

  async convertPendingTransactionToTransaction(previouslyPendingTransaction: Transaction) {
    let validAccounts: boolean = true;
    //first check if the new accounts are valid
    validAccounts = await this.database.validateAccount(previouslyPendingTransaction.credit_account);
    validAccounts = await this.database.validateAccount(previouslyPendingTransaction.debit_account);

    if (validAccounts) {
      this.database.addTransaction(
        previouslyPendingTransaction.trans_date,
        previouslyPendingTransaction.trans_description,
        previouslyPendingTransaction.amount,
        previouslyPendingTransaction.credit_account,
        previouslyPendingTransaction.debit_account,
        previouslyPendingTransaction.notes);
      this.database.removePendingTransaction(previouslyPendingTransaction.trans_code!);
    } else {
      throw new Error(`Unable to convert pending transaction to transaction. Invalid account found. [${previouslyPendingTransaction.credit_account}][${previouslyPendingTransaction.debit_account}]`);
    }
  }
}

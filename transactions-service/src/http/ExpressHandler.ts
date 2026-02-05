import express from 'express'
import { WLog } from '../WLog.js'
import { Logger } from 'winston'
import { Account, AccountDTO } from '../types/Account.js'
import { DatabaseHandler } from '../database/DatabaseHandler.js'
import { PendingTransaction, Playbook, PlaybookEntry, PlaybookWithEntryCount, Transaction, UpdateTransactionNotesDTO } from '../types/Transaction.js'
import { error } from 'console'
import { AccountService } from './AccountService.js'
import { TypeClass } from '../types/TypeClass.js'

export class ExpressHandler {

  //--------------------------------------------------------------------------------
  //Member Varibles
  //--------------------------------------------------------------------------------
  private static instance: ExpressHandler | null = null
  private app = express()
  private log!: Logger
  private database!: DatabaseHandler
  private accountService!: AccountService;

  //--------------------------------------------------------------------------------
  //Class Setup
  //--------------------------------------------------------------------------------

  /**
   * Gets the singleton instance if it exists and creates it if it does not
   * @returns singeton instance
   */
  static async getInstance(): Promise<ExpressHandler> {
    if (this.instance) {
      return this.instance
    }

    let newInstance = new ExpressHandler()
    newInstance.log = WLog.getLogger()
    newInstance.log.info("Creating new ExpressHandler instance!");

    newInstance.app.use(express.json())
    newInstance.database = await new DatabaseHandler();
    newInstance.accountService = new AccountService();
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
            `Unable to establish listener on port [${PORT}]: [${err}]`
          )
          reject()
        }
      })
    })

    this.instance = newInstance
    return newInstance
  }

  //--------------------------------------------------------------------------------
  // HTTP Posts
  //--------------------------------------------------------------------------------

  setupPosts() {
    this.app.post('/transaction/add', async (req, res) => {
      try {
        let newTransaction: Transaction = req.body
        this.log.info(`Recieved command: /account/add/ with data ${JSON.stringify(newTransaction)}`);
        await this.database.addTransaction(newTransaction.trans_date, newTransaction.trans_description, newTransaction.amount, newTransaction.credit_account, newTransaction.debit_account, newTransaction.notes);
        res.status(201).json({ status: 'Transaction Added', newTransaction })
      } catch (error) {
        this.log.error(`Error http post: /transaction/add/, unable to add transaction: ${error}`);
        res.status(500).json({ status: 'Transaction Add Failed', error });
      }
    });

    this.app.post('/transaction/pending/add', async (req, res) => {
      try {
        let newPendingTransaction: PendingTransaction = req.body
        this.log.info(`Recieved command:/transaction/pending/add with data ${JSON.stringify(newPendingTransaction)}`);
        await this.database.addPendingTransaction(newPendingTransaction.trans_date, newPendingTransaction.trans_description, newPendingTransaction.amount);
        res.status(201).json({ status: 'Pending Transaction Added', newPendingTransaction })
      } catch (error) {
        this.log.error(`Error http post: /transaction/pending/add, unable to add Pending transaction: ${error}`);
        res.status(500).json({ status: 'Pending Transaction Add Failed', error });
      }
    })

    this.app.post('/transaction/remove', async (req, res) => {
      try {
        let oldTransaction: Transaction = req.body
        this.log.info(`Recieved command: /transaction/remove with data ${JSON.stringify(oldTransaction)}`);
        await this.database.removeTransaction(oldTransaction.trans_code!)
        res.status(201).json({ status: 'Transaction removed', oldTransaction })
      } catch (error) {
        this.log.error(`Error http post: /transaction/remove, unable to remove transaction: ${error}`);
        res.status(500).json({ status: 'Transaction remove Failed', error });
      }
    });

    this.app.post('/transaction/pending/remove', async (req, res) => {
      try {
        let oldPendingTransaction: PendingTransaction = req.body
        this.log.info(`Recieved command: /transaction/pending/remove with data ${JSON.stringify(oldPendingTransaction)}`);
        await this.database.removePendingTransaction(oldPendingTransaction.trans_code!)
        res.status(201).json({ status: 'Pending Transaction removed', oldPendingTransaction })
      } catch (error) {
        this.log.error(`Error http post: /transaction/pending/remove, unable to remove Pending transaction: ${error}`);
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
        this.log.error(`Error http post: /transaction/pending/addbycsv, unable to add pending transactions: ${error}`);
        res.status(500).json({ status: 'Pending Transaction Add by csv Failed', error });
      }
    })

    this.app.post('/transaction/pending/convert', async (req, res) => {
      try {
        let pendingTransactionsToConvert: Transaction[] = req.body
        this.log.info(`Recieved command: /transaction/pending/convert with data [${JSON.stringify(pendingTransactionsToConvert)}]`);
        let amountConverted = 0;
        for (let trans of pendingTransactionsToConvert) {
          try {
            await this.convertPendingTransactionToTransaction(trans);
            amountConverted++;
          } catch (error) {
            this.log.error(`Unable to convert Pending transaction [${trans}]`);
          }
        }
        res.status(201).json({ status: `Pending Transactions converted [${amountConverted}]` });
      } catch (error) {
        this.log.error(`Error http post: /transaction/pending/convert, unable to convert Pending transaction: ${error}`);
        res.status(500).json({ status: 'Pending Transaction convert Failed', error });
      }
    })

    this.app.post('/transaction/updateNotes', async (req, res) => {
      try {
        let requestData: UpdateTransactionNotesDTO = req.body;
        this.log.info(`Recieved command: /transaction/updateNotes with data ${JSON.stringify(requestData)}`);
        await this.database.UpdateTransactionNotes(requestData.trans_code, requestData.notes);
        res.status(201).json({ status: 'Transaction Notes Updated', requestData })
      } catch (error) {
        this.log.error(`Error http post: /transaction/updateNotes, unable to redit transaction's notes: ${error}`);
        res.status(500).json({ status: 'Transactions notes edit Failed', error });
      }
    })

    this.app.post('/playbook/add', async (req, res) => {
      try {
        let body: { name: string } = req.body;
        this.log.info(`Recieved command: /playbook/add with data ${JSON.stringify(body)}`);
        await this.database.addPlaybook(body.name);
        res.status(201).json({ status: 'Playbook Added', name: body.name })
      } catch (error) {
        this.log.error(`Error http post: /playbook/add, unable to add playbook: ${error}`);
        res.status(500).json({ status: 'Playbook Add Failed', error });
      }
    })

    this.app.post('/playbook/updateName', async (req, res) => {
      try {
        let body: { playbook_id: number, name: string } = req.body;
        this.log.info(`Recieved command: /playbook/updateName with data ${JSON.stringify(body)}`);
        await this.database.updatePlaybookName(body.playbook_id, body.name);
        res.status(201).json({ status: 'Playbook Name Updated', body })
      } catch (error) {
        this.log.error(`Error http post: /playbook/updateName, unable to update playbook name: ${error}`);
        res.status(500).json({ status: 'Playbook Update Name Failed', error });
      }
    })

    this.app.post('/playbook/remove', async (req, res) => {
      try {
        let body: { playbook_id: number } = req.body;
        this.log.info(`Recieved command: /playbook/remove with data ${JSON.stringify(body)}`);
        await this.database.removePlaybook(body.playbook_id);
        res.status(201).json({ status: 'Playbook removed', body })
      } catch (error) {
        this.log.error(`Error http post: /playbook/remove, unable to remove playbook: ${error}`);
        res.status(500).json({ status: 'Playbook remove Failed', error });
      }
    })

    this.app.post('/playbook/entry/add', async (req, res) => {
      try {
        let entry: PlaybookEntry = req.body;
        this.log.info(`Recieved command: /playbook/entry/add with data ${JSON.stringify(entry)}`);
        await this.database.addPlaybookEntry(entry.playbook_id, entry.trans_description, entry.amount, entry.credit_account, entry.debit_account, entry.notes, entry.sort_order);
        res.status(201).json({ status: 'Playbook Entry Added', entry })
      } catch (error) {
        this.log.error(`Error http post: /playbook/entry/add, unable to add playbook entry: ${error}`);
        res.status(500).json({ status: 'Playbook Entry Add Failed', error });
      }
    })

    this.app.post('/playbook/entry/update', async (req, res) => {
      try {
        let entry: PlaybookEntry & { entry_id: number } = req.body;
        this.log.info(`Recieved command: /playbook/entry/update with data ${JSON.stringify(entry)}`);
        await this.database.updatePlaybookEntry(entry.entry_id, entry.trans_description, entry.amount, entry.credit_account, entry.debit_account, entry.notes);
        res.status(201).json({ status: 'Playbook Entry Updated', entry })
      } catch (error) {
        this.log.error(`Error http post: /playbook/entry/update, unable to update playbook entry: ${error}`);
        res.status(500).json({ status: 'Playbook Entry Update Failed', error });
      }
    })

    this.app.post('/playbook/entry/remove', async (req, res) => {
      try {
        let body: { entry_id: number } = req.body;
        this.log.info(`Recieved command: /playbook/entry/remove with data ${JSON.stringify(body)}`);
        await this.database.removePlaybookEntry(body.entry_id);
        res.status(201).json({ status: 'Playbook Entry removed', body })
      } catch (error) {
        this.log.error(`Error http post: /playbook/entry/remove, unable to remove playbook entry: ${error}`);
        res.status(500).json({ status: 'Playbook Entry remove Failed', error });
      }
    })

    this.app.post('/playbook/replay', async (req, res) => {
      try {
        let body: { playbook_id: number, trans_date: string } = req.body;
        this.log.info(`Recieved command: /playbook/replay with data ${JSON.stringify(body)}`);
        let count = await this.database.replayPlaybook(body.playbook_id, body.trans_date);
        res.status(201).json({ status: `Playbook replayed. [${count}] transactions created.`, count })
      } catch (error) {
        this.log.error(`Error http post: /playbook/replay, unable to replay playbook: ${error}`);
        res.status(500).json({ status: 'Playbook replay Failed', error });
      }
    })
  }

  //--------------------------------------------------------------------------------
  // HTTP GETs
  //--------------------------------------------------------------------------------

  setupGets() {
    this.app.get('/transaction/getall', async (req, res) => {
      try {
        let results: Transaction[] = await this.database.getAllTransactions();
        res.json(results)
      } catch (error) {
        this.log.error(`Error http get: /transaction/getall, unable to get all transactions: ${error}`);
        res.status(500).json({ status: "Error http get: /transaction/getall, unable to get all transactions", error });
      }
    })

    this.app.get('/transaction/pending/getall', async (req, res) => {
      try {
        let results: PendingTransaction[] = await this.database.getAllPendingTransactions();
        res.json(results)
      } catch (error) {
        this.log.error(`Error http get: /transaction/pending/getall, unable to get all pending transactions: ${error}`);
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
        this.log.error(`Error http get: /transaction/getbyaccount, unable to get all transactions with account [${req.params.accountCode}]: ${error}`);
        res.status(500).json({ status: `Error http get: /transaction/getbyaccount, unable to get all transactions with account [${req.params.accountCode}]`, error });
      }
    })

    this.app.get('/playbook/getall', async (req, res) => {
      try {
        let results: PlaybookWithEntryCount[] = await this.database.getAllPlaybooksWithEntryCount();
        res.json(results)
      } catch (error) {
        this.log.error(`Error http get: /playbook/getall, unable to get all playbooks: ${error}`);
        res.status(500).json({ status: "Error http get: /playbook/getall, unable to get all playbooks", error });
      }
    })

    this.app.get('/playbook/get/:id', async (req, res) => {
      try {
        let id = Number(req.params.id);
        this.log.info(`Recieved command: /playbook/get/:id [${id}]`);
        let playbook = await this.database.getPlaybookById(id);
        if (!playbook) {
          res.status(404).json({ status: 'Playbook not found', id });
          return;
        }
        let entries: PlaybookEntry[] = await this.database.getPlaybookEntries(id);
        res.json({ playbook, entries })
      } catch (error) {
        this.log.error(`Error http get: /playbook/get/:id, unable to get playbook: ${error}`);
        res.status(500).json({ status: "Error http get: /playbook/get/:id, unable to get playbook", error });
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
        let typeClass: TypeClass = await this.accountService.requestAccountDetails(accountCode);

        this.log.info(`transactions: ${JSON.stringify(transactionRecords)}`);

        let result = 0;
        for (let transaction of transactionRecords) {
          if (transaction.credit_account == accountCode) {
            if (typeClass.credit_effect == "+") {
              result += transaction.amount;
            } else {
              result -= transaction.amount;
            }
          }
          if (transaction.debit_account == accountCode) {
            if (typeClass.debit_effect == "+") {
              result += transaction.amount;
            } else {
              result -= transaction.amount;
            }
          }
        }

        //Round to solve decimal floating point issue, generally safe within the first two decimal places
        result = Math.round(result * 100) / 100;

        res.json(result);
      } catch (error) {
        this.log.error(`Error http get: /transaction/getbyaccount, unable to get all transactions with account [${req.params.accountCode}]`);
        res.status(500).json({ status: `Error http get: /transaction/getbyaccount, unable to get all transactions with account [${req.params.accountCode}]`, error });
      }
    })
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Logic Methods
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

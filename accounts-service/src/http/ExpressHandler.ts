import express from 'express'
import { WLog } from '../WLog.js'
import { Logger } from 'winston'
import { Account, AccountDTO } from '../types/Account.js'
import { DatabaseHandler } from '../database/DatabaseHandler.js'
import { AccountTypeDTO } from '../types/AccountType.js'
import { TypeClass } from '../types/TypeClass.js'

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

    const PORT = 3001

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
    this.app.post('/account/add', async (req, res) => {
      try {
        let newAccount: AccountDTO = req.body
        this.log.info(`Recieved command: /account/add/ with data ${newAccount}`);
        await this.database.addAccount(newAccount.account_description, newAccount.account_type, newAccount.notes, newAccount.account_active);
        res.status(201).json({ status: 'Account Added', newAccount })
      } catch (error) {
        this.log.error("Error http post: /account/add/, unable to add account");
        res.status(500).json({ status: 'Account Add Failed', error });
      }
    })

    this.app.post('/type/add', async (req, res) => {
      try {
        let newAccountType: AccountTypeDTO = req.body
        this.log.info(`Recieved command: /type/add/ with data ${newAccountType}`);
        await this.database.addAccountType(newAccountType.type_description, newAccountType.type_class, newAccountType.notes)
        res.status(201).json({ status: 'Account Type Added', newAccountType })
      } catch (error) {
        this.log.error("Error http post: /type/add/, unable to add account type");
        res.status(500).json({ status: 'Account Type Add Failed', error });
      }
    })
  }

  setupGets() {
    this.app.get('/account/getall', async (req, res) => {
      try {
        let results: AccountDTO[] = await this.database.getAllAccounts()
        res.json(results)
      } catch (error) {
        this.log.error("Error http get: /account/getall, unable to get all accounts");
        res.status(500).json({ status: "Error http get: /account/getall, unable to get all accounts", error });
      }
    })

    this.app.get('/type/getall', async (req, res) => {
      try {
        this.log.info(`Recieved command: /type/getall`);
        let results: AccountTypeDTO[] = await this.database.getAllTypes()
        res.json(results)
      } catch (error) {
        this.log.error("Error http get: /type/getall, unable to get all account types");
        res.status(500).json({ status: "Error http get: /type/getall, unable to get all account types", error });
      }
    })


    this.app.get('/type/class/getall', async (req, res) => {
      try {
        this.log.info(`Recieved command: /type/class/getall`);
        let results: TypeClass[] = await this.database.getAllTypeClasses();
        res.json(results)
      } catch (error) {
        this.log.error("Error http get: /type/class/getall, unable to get all account type classes");
        res.status(500).json({ status: "Error http get: /type/class/getall, unable to get all account type classes", error });
      }
    })

    this.app.get('/account/getbyid/:accountId', async (req, res) => {
      try {
        let accountId = req.params.accountId
        this.log.info(`Recieved command: /account/getbyid/:accountId with data ${accountId}`);
        let result: AccountDTO = await this.database.getAccountById(Number(accountId))
        res.json(result)
      } catch (error) {
        this.log.error(`Error http get: /account/getbyid/:accountId, unable to get account by id [${req.params.accountId}]`);
        res.status(500).json({ status: `Error http get: /account/getbyid/:accountId, unable to get account by id [${req.params.accountId}]`, error });
      }
    })

    this.app.get('/type/getbyid/:typeId', async (req, res) => {
      try {
        let accountId = req.params.typeId
        this.log.info(`Recieved command: /type/getbyid/:typeId with data ${accountId}`);
        let result: AccountTypeDTO = await this.database.getTypeById(Number(accountId))
        res.json(result)
      } catch (error) {
        this.log.error(`Error http get: /type/getbyid/:typeId, unable to get account type by id [${req.params.typeId}]`);
        res.status(500).json({ status: `Error http get: /type/getbyid/:typeId, unable to get account type by id [${req.params.typeId}]`, error });
      }
    })

    this.app.get('/type/getbydescription/:typeDescription', async (req, res) => {
      try {
        let description = req.params.typeDescription
        this.log.info(`Recieved command: /type/getbydescription/:typeDescription with data ${description}`);
        let result: AccountTypeDTO = await this.database.getTypeByDescription(description)
        res.json(result)
      } catch (error) {
        this.log.error(`Error http get: /type/getbydescription/:typeDescription, unable to get account type by description [${req.params.typeDescription}]`);
        res.status(500).json({ status: `Error http get: /type/getbydescription/:typeDescription, unable to get account type by description [${req.params.typeDescription}]`, error });
      }
    }
    )
  }
}

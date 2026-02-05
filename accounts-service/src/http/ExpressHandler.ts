import express from 'express'
import { WLog } from '../WLog.js'
import { Logger } from 'winston'
import { Account, AccountDTO } from '../types/Account.js'
import { DatabaseHandler } from '../database/DatabaseHandler.js'
import { AccountType, AccountTypeDTO } from '../types/AccountType.js'
import { TypeClass } from '../types/TypeClass.js'
import type { BudgetPlan, BudgetIncome, BudgetRow, BudgetRowAmount } from '../types/Budget.js'

export class ExpressHandler {

  //--------------------------------------------------------------------------------
  //Member Varibles
  //--------------------------------------------------------------------------------
  private static instance: ExpressHandler | null = null
  private app = express()
  private log!: Logger
  private database!: DatabaseHandler

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
    this.app.post('/account/add', async (req, res) => {
      try {
        let newAccount: AccountDTO = req.body;
        this.log.info(`Recieved command: /account/add/ with data ${newAccount.toString()}`);
        await this.database.addAccount(newAccount.account_description, newAccount.account_type, newAccount.notes, newAccount.account_active);
        res.status(201).json({ status: 'Account Added', newAccount })
      } catch (error) {
        this.log.error(`Error http post: /account/add/, unable to add account: [${error}]`);
        res.status(500).json({ status: 'Account Add Failed', error });
      }
    })

    this.app.post('/type/add', async (req, res) => {
      try {
        let newAccountType: AccountTypeDTO = req.body;
        this.log.info(`Recieved command: /type/add/ with data ${newAccountType.toString()}`);
        await this.database.addAccountType(newAccountType.type_description, newAccountType.type_class, newAccountType.notes)
        res.status(201).json({ status: 'Account Type Added', newAccountType })
      } catch (error) {
        this.log.error(`Error http post: /type/add/, unable to add account type: [${error}]`);
        res.status(500).json({ status: 'Account Type Add Failed', error });
      }
    })

    this.app.post('/account/update', async (req, res) => {
      try {
        let updatedAccount: Account = req.body;
        this.log.info(`Recieved command: /account/update/ with data ${updatedAccount.toString()}`);
        await this.database.UpdateAccount(updatedAccount);
        res.status(201).json({ status: 'Account Updated', updatedAccount })
      } catch (error) {
        this.log.error(`Error http post: /account/update/, unable to update account: [${error}]`);
        res.status(500).json({ status: 'Account Update Failed', error });
      }
    })

    this.app.post('/type/update', async (req, res) => {
      try {
        let updateAccountType: AccountType = req.body;
        this.log.info(`Recieved command: /type/update/ with data ${updateAccountType.toString()}`);
        await this.database.UpdateAccountType(updateAccountType);
        res.status(201).json({ status: 'Account Type Updated', updateAccountType });
      } catch (error) {
        this.log.error(`Error http post: /type/update/, unable to update account type: [${error}]`);
        res.status(500).json({ status: 'Account Type Update Failed', error });
      }
    })

    this.app.post('/budget/plan', async (req, res) => {
      try {
        const { name, planning_period } = req.body;
        this.log.info(`Recieved command: /budget/plan with data ${JSON.stringify(req.body)}`);
        const plan_id = await this.database.addBudgetPlan(name, planning_period);
        res.status(201).json({ status: 'Budget plan added', plan_id });
      } catch (error) {
        this.log.error(`Error http post: /budget/plan: [${error}]`);
        res.status(500).json({ status: 'Budget plan add failed', error });
      }
    })

    this.app.post('/budget/plan/update', async (req, res) => {
      try {
        const { plan_id, name, planning_period } = req.body;
        this.log.info(`Recieved command: /budget/plan/update with data ${JSON.stringify(req.body)}`);
        await this.database.updateBudgetPlan(plan_id, name, planning_period);
        res.status(201).json({ status: 'Budget plan updated' });
      } catch (error) {
        this.log.error(`Error http post: /budget/plan/update: [${error}]`);
        res.status(500).json({ status: 'Budget plan update failed', error });
      }
    })

    this.app.post('/budget/plan/delete', async (req, res) => {
      try {
        const { plan_id } = req.body;
        this.log.info(`Recieved command: /budget/plan/delete with data ${JSON.stringify(req.body)}`);
        await this.database.deleteBudgetPlan(plan_id);
        res.status(201).json({ status: 'Budget plan deleted' });
      } catch (error) {
        this.log.error(`Error http post: /budget/plan/delete: [${error}]`);
        res.status(500).json({ status: 'Budget plan delete failed', error });
      }
    })

    this.app.post('/budget/plan/duplicate', async (req, res) => {
      try {
        const { plan_id } = req.body;
        this.log.info(`Recieved command: /budget/plan/duplicate with data ${JSON.stringify(req.body)}`);
        const new_plan_id = await this.database.duplicateBudgetPlan(plan_id);
        res.status(201).json({ status: 'Budget plan duplicated', plan_id: new_plan_id });
      } catch (error) {
        this.log.error(`Error http post: /budget/plan/duplicate: [${error}]`);
        res.status(500).json({ status: 'Budget plan duplicate failed', error });
      }
    })

    this.app.post('/budget/income', async (req, res) => {
      try {
        const { plan_id, name, amount, interval_type, interval_count } = req.body;
        this.log.info(`Recieved command: /budget/income with data ${JSON.stringify(req.body)}`);
        const income_id = await this.database.addBudgetIncome(plan_id, name ?? null, amount, interval_type, interval_count);
        res.status(201).json({ status: 'Budget income added', income_id });
      } catch (error) {
        this.log.error(`Error http post: /budget/income: [${error}]`);
        res.status(500).json({ status: 'Budget income add failed', error });
      }
    })

    this.app.post('/budget/income/update', async (req, res) => {
      try {
        const { income_id, name, amount, interval_type, interval_count } = req.body;
        this.log.info(`Recieved command: /budget/income/update with data ${JSON.stringify(req.body)}`);
        await this.database.updateBudgetIncome(income_id, name ?? null, amount, interval_type, interval_count);
        res.status(201).json({ status: 'Budget income updated' });
      } catch (error) {
        this.log.error(`Error http post: /budget/income/update: [${error}]`);
        res.status(500).json({ status: 'Budget income update failed', error });
      }
    })

    this.app.post('/budget/income/delete', async (req, res) => {
      try {
        const { income_id } = req.body;
        this.log.info(`Recieved command: /budget/income/delete with data ${JSON.stringify(req.body)}`);
        await this.database.deleteBudgetIncome(income_id);
        res.status(201).json({ status: 'Budget income deleted' });
      } catch (error) {
        this.log.error(`Error http post: /budget/income/delete: [${error}]`);
        res.status(500).json({ status: 'Budget income delete failed', error });
      }
    })

    this.app.post('/budget/row', async (req, res) => {
      try {
        const { plan_id, account_code } = req.body;
        this.log.info(`Recieved command: /budget/row with data ${JSON.stringify(req.body)}`);
        const row_id = await this.database.addBudgetRow(plan_id, account_code);
        res.status(201).json({ status: 'Budget row added', row_id });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.log.error(`Error http post: /budget/row: [${error}]`);
        if (message === 'This account is already in the plan.') {
          res.status(400).json({ error: message });
        } else {
          res.status(500).json({ status: 'Budget row add failed', error: message });
        }
      }
    })

    this.app.post('/budget/row/delete', async (req, res) => {
      try {
        const { row_id } = req.body;
        this.log.info(`Recieved command: /budget/row/delete with data ${JSON.stringify(req.body)}`);
        await this.database.deleteBudgetRow(row_id);
        res.status(201).json({ status: 'Budget row deleted' });
      } catch (error) {
        this.log.error(`Error http post: /budget/row/delete: [${error}]`);
        res.status(500).json({ status: 'Budget row delete failed', error });
      }
    })

    this.app.post('/budget/row/amounts', async (req, res) => {
      try {
        const { row_id, amounts } = req.body as { row_id: number; amounts: { income_id: number; amount: number }[] };
        this.log.info(`Recieved command: /budget/row/amounts with row_id ${row_id}`);
        for (const { income_id, amount } of amounts) {
          await this.database.setBudgetRowAmount(row_id, income_id, amount);
        }
        res.status(201).json({ status: 'Budget row amounts updated' });
      } catch (error) {
        this.log.error(`Error http post: /budget/row/amounts: [${error}]`);
        res.status(500).json({ status: 'Budget row amounts update failed', error });
      }
    })
  }


  //--------------------------------------------------------------------------------
  // HTTP GETs
  //--------------------------------------------------------------------------------

  setupGets() {
    this.app.get('/account/getall', async (req, res) => {
      try {
        let results: AccountDTO[] = await this.database.getAllAccounts()
        res.json(results)
      } catch (error) {
        this.log.error(`Error http get: /account/getall, unable to get all accounts: [${error}]`);
        res.status(500).json({ status: "Error http get: /account/getall, unable to get all accounts", error });
      }
    })

    this.app.get('/type/getall', async (req, res) => {
      try {
        this.log.info(`Recieved command: /type/getall`);
        let results: AccountTypeDTO[] = await this.database.getAllTypes()
        res.json(results)
      } catch (error) {
        this.log.error(`Error http get: /type/getall, unable to get all account types: [${error}]`);
        res.status(500).json({ status: "Error http get: /type/getall, unable to get all account types", error });
      }
    })


    this.app.get('/type/class/getall', async (req, res) => {
      try {
        this.log.info(`Recieved command: /type/class/getall`);
        let results: TypeClass[] = await this.database.getAllTypeClasses();
        res.json(results)
      } catch (error) {
        this.log.error(`Error http get: /type/class/getall, unable to get all account type classes: [${error}]`);
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
        this.log.error(`Error http get: /account/getbyid/:accountId, unable to get account by id [${req.params.accountId}]: [${error}]`);
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
        this.log.error(`Error http get: /type/getbyid/:typeId, unable to get account type by id [${req.params.typeId}]: [${error}]`);
        res.status(500).json({ status: `Error http get: /type/getbyid/:typeId, unable to get account type by id [${req.params.typeId}]`, error });
      }
    })

    this.app.get('/type/class/getbyid/:classId', async (req, res) => {
      try {
        let classId = req.params.classId
        this.log.info(`Recieved command: /type/class/getbyid/:classId with data ${classId}`);
        let result: AccountTypeDTO = await this.database.getTypeClassById(Number(classId))
        res.json(result)
      } catch (error) {
        this.log.error(`Error http get: //type/class/getbyid/:classId, unable to get type class by id [${req.params.classId}]: [${error}]`);
        res.status(500).json({ status: `Error http get: /type/class/getbyid/:classId, unable to get type class by id [${req.params.classId}]`, error });
      }
    })

    this.app.get('/type/getbydescription/:typeDescription', async (req, res) => {
      try {
        let description = req.params.typeDescription
        this.log.info(`Recieved command: /type/getbydescription/:typeDescription with data ${description}`);
        let result: AccountTypeDTO = await this.database.getTypeByDescription(description)
        res.json(result)
      } catch (error) {
        this.log.error(`Error http get: /type/getbydescription/:typeDescription, unable to get account type by description [${req.params.typeDescription}]: [${error}]`);
        res.status(500).json({ status: `Error http get: /type/getbydescription/:typeDescription, unable to get account type by description [${req.params.typeDescription}]`, error });
      }
    }
    )

    this.app.get('/budget/plans', async (req, res) => {
      try {
        const results: BudgetPlan[] = await this.database.getAllBudgetPlans();
        res.json(results);
      } catch (error) {
        this.log.error(`Error http get: /budget/plans: [${error}]`);
        res.status(500).json({ status: 'Budget plans get failed', error });
      }
    })

    this.app.get('/budget/plan/:id', async (req, res) => {
      try {
        const plan_id = Number(req.params.id);
        this.log.info(`Recieved command: /budget/plan/:id with id ${plan_id}`);
        const plan = await this.database.getBudgetPlanById(plan_id);
        if (!plan) {
          res.status(404).json({ status: 'Budget plan not found', plan_id });
          return;
        }
        const incomes: BudgetIncome[] = await this.database.getBudgetIncomesByPlanId(plan_id);
        const rows: BudgetRow[] = await this.database.getBudgetRowsByPlanId(plan_id);
        const rowAmounts: BudgetRowAmount[] = await this.database.getBudgetRowAmountsByPlanId(plan_id);
        res.json({ plan, incomes, rows, rowAmounts });
      } catch (error) {
        this.log.error(`Error http get: /budget/plan/:id: [${error}]`);
        res.status(500).json({ status: 'Budget plan get failed', error });
      }
    })
  }
}

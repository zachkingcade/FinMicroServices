import express from 'express';
import { WLog } from '../WLog.js';
import { Logger } from 'winston';
import { Account } from '../types/Account.js';
import { DatabaseHandler } from '../database/DatabaseHandler.js';
import { AccountType } from '../types/AccountType.js';

export class ExpressHandler {
    private static instance: ExpressHandler | null = null;
    private app = express();
    private log!: Logger;
    private database!: DatabaseHandler;

    static async getInstance(): Promise<ExpressHandler> {
        if (this.instance) {
            return this.instance;
        }

        let newInstance = new ExpressHandler();
        newInstance.log = WLog.getLogger();

        newInstance.app.use(express.json());
        newInstance.database = await new DatabaseHandler;
        newInstance.database = new DatabaseHandler;
        await newInstance.database.startup();
        newInstance.setupPosts();
        newInstance.setupGets();

        const PORT = 3001;

        await new Promise<void>((resolve, reject) => {
            newInstance.app.listen(PORT, () => {
                try {
                    newInstance.log.info(`AccountService running on port [${PORT}]`);
                    resolve();
                } catch (err) {
                    newInstance.log.error(`Unable to establish listener on port [${PORT}]`)
                    reject();
                }
            });
        });

        this.instance = newInstance;
        return newInstance;

    }

    setupPosts() {
        this.app.post('/account/add/', (req, res) => {
            let newAccount: Account = req.body;
            this.database.addAccount(newAccount.account_description, newAccount.account_type, newAccount.notes, newAccount.account_active);
            res.status(201).json({ status: "Account Added", newAccount });
        });

        this.app.post('/type/add/', (req, res) => {
            let newAccountType: AccountType = req.body;
            this.database.addAccountType(newAccountType.type_description, newAccountType.notes);
            res.status(201).json({ status: "Account Type Added", newAccountType });
        });
    }

    setupGets() {
        this.app.get('/account/getall', async (req, res) => {
            let results: Account[] = await this.database.getAllAccounts();
            res.json(results);
        });

        this.app.get('/type/getall', async (req, res) => {
            let results: AccountType[] = await this.database.getAllTypes();
            res.json(results);
        });

        this.app.get('/account/getbyid/:accountId', async (req, res) => {
            let accountId = req.params.accountId;
            let result: Account = await this.database.getAccountById(Number(accountId));
            res.json(result);
        });

        this.app.get('/type/getbyid/:typeId', async (req, res) => {
            let accountId = req.params.typeId;
            let result: AccountType = await this.database.getTypeById(Number(accountId));
            res.json(result);
        });

        this.app.get('/type/getbydescription/:typeDescription', async (req, res) => {
            let description = req.params.typeDescription;
            let result: AccountType = await this.database.getTypeByDescription(description);
            res.json(result);
        });
    }
}
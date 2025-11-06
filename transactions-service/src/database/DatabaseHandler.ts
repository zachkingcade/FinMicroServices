import sqlite3 from 'sqlite3'
import type { Logger } from 'winston';
import { WLog } from '../WLog.js';

export class DatabaseHandler {

    //--------------------------------------------------------------------------------
    //Member Varibles
    //--------------------------------------------------------------------------------

    //member varibles
    connectedStatus: boolean = false;
    db!: sqlite3.Database;
    log: Logger;

    //stored queries

    //--------------------------------------------------------------------------------
    //Class Setup
    //--------------------------------------------------------------------------------

    constructor() {
        this.log = WLog.getLogger();
    }
    /**
     * Startups database handler. Connects to the database and creates tables if their not already there.
     * @returns a promise that returns nothing. It resolves when the operation is done but returns no data. 
     */
    async startup(): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            this.db = new sqlite3.Database('./TransactionsServiceDatabase.db', async err => {
                if (err) {
                    this.log.error('Error opening database:', err.message)
                    reject(err);
                } else {
                    this.log.info('Connected to the SQLite database.')
                    await this.createTablesIfNotExist();
                    resolve()
                }
            });
        })
        this.connectedStatus = true;
        this.log.info('SQLite database startup complete!')
    }

    checkConnectedStatus(): boolean {
        return this.connectedStatus;
    }

    //Creates the tables needed for basic operation if they have not already been created
    async createTablesIfNotExist(): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            this.db.run(
                `CREATE TABLE IF NOT EXISTS ledger_transactions (
            trans_code INTEGER PRIMARY KEY AUTOINCREMENT,
            trans_date DATE NOT NULL,
            trans_description TEXT NOT NULL,
            credit_account INTEGER NOT NULL,
            debit_account INTEGER NOT NULL,
            notes TEXT NULL 
            )`,
                err => {
                    if (err) {
                        this.log.error('Error creating ledger_transactions:', err.message);
                        reject(err);
                    } else {
                        this.log.info('ledger_transactions table created or already exists.')
                        resolve();
                    }
                }
            );
        })
    }

    //--------------------------------------------------------------------------------
    //Adding New Records
    //--------------------------------------------------------------------------------

    async addAccountType(trans_date: string, trans_description: string, credit_account: number, debit_account: number, notes?: string): Promise<void> {
        // Construct insert statement
        let newInsertStatement: string = "";
        newInsertStatement += "INSERT INTO ledger_transactions ";
        newInsertStatement += `(trans_date,trans_description,credit_account,debit_account${notes ? ",notes) " : ") "}`;
        newInsertStatement += `VALUES ("${trans_date}","${trans_description}",${credit_account},${debit_account}${notes ? `,"${notes}"` : ""});`;

        try {
            await this.validateAccount(credit_account);
            await this.validateAccount(debit_account);
        } catch (error) {
            throw new Error(`Unable to add transaction with data: trans_date [${trans_date}], trans_description[${trans_description}], credit_account [${credit_account}], debit_account [${debit_account}],notes [${notes}]. Invalid account found: ${error}`)
        }

        await new Promise<void>((resolve, reject) => {
            this.db.run(
                newInsertStatement,
                err => {
                    if (err) {
                        this.log.error(`Error inserting transaction with data: trans_date [${trans_date}], trans_description[${trans_description}], credit_account [${credit_account}], debit_account [${debit_account}],notes [${notes}]`, err.message);
                        reject(err);
                    } else {
                        this.log.info(`Transaction [${trans_description}][${credit_account}][${debit_account}] added successfully!`);
                        resolve();
                    }
                }
            )
        })

    }

    //--------------------------------------------------------------------------------
    //Validation
    //--------------------------------------------------------------------------------

    async validateAccount(account_code: number): Promise<boolean> {
        try {
            let response: Response = await fetch(`http://localhost:3001/account/getbyid/${account_code}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: [${response.status}]`);
            }

            let data = await response.json();
            this.log.info(`Validating account [${account_code}] returned data [${data}]`);

            return !(Object.keys(data).length === 0);
        } catch (error) {
            throw new Error(`Unable to validate account with account_code [${account_code}]. error: ${error}`);
        }
    }

    //--------------------------------------------------------------------------------
    //Retrieving Records
    //--------------------------------------------------------------------------------

}

import sqlite3 from 'sqlite3'
import type { Logger } from 'winston';
import { WLog } from './WLog.js';
import type { AccountType } from './types/AccountType.js';
import type { Account } from './types/Account.js';

export class DatabaseHandler {

    //--------------------------------------------------------------------------------
    //Member Varibles
    //--------------------------------------------------------------------------------

    //member varibles
    connectedStatus: boolean = false;
    db!: sqlite3.Database;
    log: Logger;

    //stored queries
    selectAccountALL: string = "SELECT * FROM chart_of_accounts;";
    selectAccountById: string = "SELECT * FROM chart_of_accounts where account_code = ?;";
    selectTypeALL: string = "SELECT * FROM account_types;";
    selectTypeById: string = "SELECT * FROM account_types where type_code = ?;";
    selectTypeByDescription: string = "SELECT * FROM account_types where type_description = ?;";

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
            this.db = new sqlite3.Database('./AccountsServiceDatabase.db', async err => {
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
                `CREATE TABLE IF NOT EXISTS chart_of_accounts (
            account_code INTEGER PRIMARY KEY AUTOINCREMENT,
            account_type INTEGER NOT NULL,
            account_description TEXT NOT NULL,
            account_selectable TEXT UNIQUE NOT NULL,
            account_active CHAR(1) NOT NULL,
            notes TEXT NULL 
            )`,
                err => {
                    if (err) {
                        this.log.error('Error creating chart_of_accounts:', err.message);
                        reject(err);
                    } else {
                        this.log.info('Chart_of_accounts table created or already exists.')
                        resolve();
                    }
                }
            );
        })


        await new Promise<void>((resolve, reject) => {
            this.db.run(
                `CREATE TABLE IF NOT EXISTS account_types (
            type_code INTEGER PRIMARY KEY AUTOINCREMENT,
            type_description TEXT UNIQUE NOT NULL,
            notes TEXT NULL
            )`,
                err => {
                    if (err) {
                        this.log.error('Error creating account_types:', err.message);
                        reject(err);
                    } else {
                        this.log.info('account_types table created or already exists.');
                        resolve();
                    }
                }
            );
        })
    }

    //--------------------------------------------------------------------------------
    //Adding New Records
    //--------------------------------------------------------------------------------

    /**
     * Adds an account to the database
     * @param accountDescription describes the account being added
     * @param accountType declares what type of account this will be, needs to be a valid account type from the account_types table
     * @param [notes] misc notes that need to be noted in the table about the account
     * @param [accountActive] Declares if the account is active or not. This defaults to 'Y'.
     * @returns a promise that returns nothing. It resolves when the operation is done but returns no data
     */
    async addAccount(accountDescription: string, accountType: string | number, notes?: string, accountActive?: 'Y' | 'N'): Promise<void> {
        //sanatizing input
        if (accountActive == null) {
            accountActive = "Y";
        } else if (accountActive != "Y" && accountActive != "N") {
            this.log.error(`Error adding account [${accountDescription}] due to accountActive provided being [${accountActive}]. Provided Value must be "Y" or "N".`)
            return;
        }

        accountType = await this.ValidateAccountType(accountType);
        this.log.debug(`Account Type for new account [${accountDescription}] validation returned as [${accountType}]`)

        if (accountType == -1) {
            this.log.error(`Error adding account [${accountDescription}] due to account type [${accountType}] being neither a valid type description or type code.`)
            return;
        }

        // Get account type description
        let typeDescription = (await this.getTypeById(accountType)).type_description;

        // Construct insert statement
        let newInsertStatement: string = "";
        let accountSelectable = `${accountDescription} [${typeDescription}]`;
        newInsertStatement += "INSERT INTO chart_of_accounts ";
        newInsertStatement += `(account_type,account_description,account_selectable,account_active${notes ? ",notes) " : ") "}`;
        newInsertStatement += `VALUES (${accountType},"${accountDescription}","${accountSelectable}","${accountActive}"${notes ? `,"${notes}"` : ""});`;
        this.log.debug(`New account insert statement: [${newInsertStatement}]`);

        await new Promise<void>((resolve, reject) => {
            this.db.run(
                newInsertStatement,
                err => {
                    if (err) {
                        this.log.error(`Error inserting Account with data: accountDescription [${accountDescription}], accountType [${accountType}], notes [${notes}]`, err.message);
                        reject(err);
                    } else {
                        this.log.info(`Account [${accountSelectable}] added successfully!`);
                        resolve();
                    }
                }
            )
        })

    }
    /**
     * Adds account type to the database
     * @param typeDescription describes the new type of accounts
     * @param [notes] Misc notes that need to be noted in the database about the account type
     * @returns a promise that returns nothing. It resolves when the operation is done but returns no data
     */
    async addAccountType(typeDescription: string, notes?: string): Promise<void> {
        // Construct insert statement
        let newInsertStatement: string = "";
        newInsertStatement += "INSERT INTO account_types ";
        newInsertStatement += `(type_description${notes ? ",notes) " : ") "}`;
        newInsertStatement += `VALUES ("${typeDescription}"${notes ? `,"${notes}"` : ""});`;

        await new Promise<void>((resolve, reject) => {
            this.db.run(
                newInsertStatement,
                err => {
                    if (err) {
                        this.log.error(`Error inserting Account Type with data:typeDescription [${typeDescription}],notes [${notes}]`, err.message);
                        reject(err);
                    } else {
                        this.log.info(`Account Type [${typeDescription}] added successfully!`);
                        resolve();
                    }
                }
            )
        })

    }

    //--------------------------------------------------------------------------------
    //Validation
    //--------------------------------------------------------------------------------

    /**
     * Validates account type by either type_code or type_description depending on which is provided
     * @param accountType either a number (type_code) or string (type_description)
     * @returns The type's type_code
     */
    async ValidateAccountType(accountType: string | number): Promise<number> {
        if (typeof accountType === "string") {
            let row = (await this.getTypeByDescription(accountType));
            return row ? row.type_code : -1;
        } else if (typeof accountType === "number") {
            let row = (await this.getTypeById(accountType));
            return row ? row.type_code : -1;
        } else {
            return -1;
        }
    }

    //--------------------------------------------------------------------------------
    //Retrieving Records
    //--------------------------------------------------------------------------------
    /**
     * Gets all accounts
     * @returns all accounts 
     */
    async getAllAccounts(): Promise<Account[]> {
        let results: any = [];
        await new Promise<void>((resolve, reject) => {
            this.db.all(this.selectAccountALL, [], (err, rows) => {
                if (err) {
                    this.log.error("Error retrieving all account records from the database ", err.message);
                    reject(err);
                } else {
                    results = rows;
                    resolve();
                }
            });
        })

        return results;
    }

    /**
     * Gets all types
     * @returns all types 
     */
    async getAllTypes(): Promise<AccountType[]> {
        let results: any = [];
        await new Promise<void>((resolve, reject) => {
            this.db.all(this.selectTypeALL, [], (err, rows) => {
                if (err) {
                    this.log.error("Error retrieving all account type records from the database ", err.message);
                    reject(err);
                } else {
                    results = rows;
                    resolve();
                }
            });
        })
        return results;
    }

    /**
     * Gets account by id
     * @param id the desired account's account_code
     * @returns account by id 
     */
    async getAccountById(id: number): Promise<Account> {
        let result: any;
        await new Promise<void>((resolve, reject) => {
            this.db.get(this.selectAccountById, [id], (err, row) => {
                if (err) {
                    this.log.error(`Error retrieving account by Id [${id}] from the database `, err.message);
                    reject(err);
                } else {
                    result = row;
                    resolve();
                }
            })
        })
        return result;
    }

    /**
     * Gets type by id
     * @param id account type's type_code
     * @returns type by id 
     */
    async getTypeById(id: number): Promise<AccountType> {
        let result: any;
        await new Promise<void>((resolve, reject) => {
            this.db.get(this.selectTypeById, [id], (err, row) => {
                if (err) {
                    this.log.error(`Error retrieving type by Id [${id}] from the database `, err.message);
                    reject(err);
                } else {
                    console.log(row);
                    result = row;
                    resolve();
                }
            })
        })
        return result;
    }

    /**
     * Gets type by description
     * @param description account type's type_description
     * @returns type by description 
     */
    async getTypeByDescription(description: string): Promise<AccountType> {
        let result: any;
        await new Promise<void>((resolve, reject) => {
            this.db.get(this.selectTypeByDescription, [description], (err, row) => {
                if (err) {
                    this.log.error(`Error retrieving type by description [${description}] from the database `, err.message);
                    reject(err);
                } else {
                    console.log(row);
                    result = row;
                    resolve();
                }
            })
        })
        return result;
    }

}

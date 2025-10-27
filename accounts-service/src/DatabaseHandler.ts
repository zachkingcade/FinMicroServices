import sqlite3 from 'sqlite3'
import type { Logger } from 'winston';
import { WLog } from './WLog.js';

export class DatabaseHandler {

    //member varibles
    connectedStatus: boolean = false;
    db!: sqlite3.Database;
    log: Logger;

    //stored queries
    selectAccountALL: string = "SELECT * FROM chart_of_accounts;";
    selectAccountById: string = "SELECT * FROM chart_of_accounts where account_code = ?;";
    selectTypeALL: string = "SELECT * FROM account_types;";
    selectTypeById: string = "SELECT * FROM account_types where type_code = ?;";

    constructor() {
        this.log = WLog.getLogger();
    }

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
            type_code INTEGER PRIMARY KEY,
            type_description TEXT NOT NULL,
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

    async addAccount(accountDescription: string, accountType: string, notes?: string): Promise<void> {
        // Construct insert statement
        let newInsertStatement: string = "";
        let accountSelectable = `${accountDescription} [${accountType}]`;
        newInsertStatement += "INSERT INTO chart_of_accounts ";
        newInsertStatement += `(account_type,account_description,account_selectable${notes ? ",notes) " : ") "}`;
        newInsertStatement += `VALUES (${accountType},"${accountDescription}","${accountSelectable}"${notes ? `,"${notes}"` : ""});`;

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

    async addAccountType(typeCode: string, typeDescription: string, notes?: string): Promise<void> {
        // Construct insert statement
        let newInsertStatement: string = "";
        newInsertStatement += "INSERT INTO account_types ";
        newInsertStatement += `(type_code,type_description${notes ? ",notes) " : ") "}`;
        newInsertStatement += `VALUES (${typeCode},"${typeDescription}"${notes ? `,"${notes}"` : ""});`;

        await new Promise<void>((resolve, reject) => {
            this.db.run(
                newInsertStatement,
                err => {
                    if (err) {
                        this.log.error(`Error inserting Account Type with data: typeCode [${typeCode}],typeDescription [${typeDescription}],notes [${notes}]`, err.message);
                        reject(err);
                    } else {
                        this.log.info(`Account Type [${typeCode}] [${typeDescription}] added successfully!`);
                        resolve();
                    }
                }
            )
        })

    }

    async getAllAccounts(): Promise<any> {
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

    async getAllTypes(): Promise<any> {
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
}

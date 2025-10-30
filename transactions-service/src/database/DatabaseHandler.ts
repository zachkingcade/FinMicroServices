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

    //--------------------------------------------------------------------------------
    //Validation
    //--------------------------------------------------------------------------------

    //--------------------------------------------------------------------------------
    //Retrieving Records
    //--------------------------------------------------------------------------------

}

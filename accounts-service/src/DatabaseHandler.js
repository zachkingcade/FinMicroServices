import sqlite3 from 'sqlite3'

export class DatabaseHandler {

    //member varibles
    connectedStatus = false;
    db = null;

    //stored queries
    selectAccountALL = "SELECT * FROM chart_of_accounts;";
    selectAccountById = "SELECT * FROM chart_of_accounts where account_code = ?;";
    selectTypeALL = "SELECT * FROM account_types;";
    selectTypeById = "SELECT * FROM account_types where type_code = ?;";

    constructor() {

    }

    async startup() {
        await new Promise((resolve, reject) => {
            this.db = new sqlite3.Database('./mydatabase.db', async err => {
                if (err) {
                    console.error('Error opening database:', err.message)
                    reject(err);
                } else {
                    console.log('Connected to the SQLite database.')
                    await this.createTablesIfNotExist();
                    resolve()
                }
            });
        })
        this.connectedStatus = true;
        console.log('SQLite database startup complete!')
    }

    checkConnectedStatus() {
        return this.connectedStatus;
    }

    //Creates the tables needed for basic operation if they have not already been created
    async createTablesIfNotExist() {
        await new Promise((resolve, reject) => {
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
                        console.error('Error creating chart_of_accounts:', err.message);
                        reject(err);
                    } else {
                        console.log('Chart_of_accounts table created or already exists.')
                        resolve();
                    }
                }
            );
        })


        await new Promise((resolve, reject) => {
            this.db.run(
                `CREATE TABLE IF NOT EXISTS account_types (
            type_code INTEGER PRIMARY KEY,
            type_description TEXT NOT NULL,
            notes TEXT NULL
            )`,
                err => {
                    if (err) {
                        console.error('Error creating account_types:', err.message);
                        reject(err);
                    } else {
                        console.log('account_types table created or already exists.');
                        resolve();
                    }
                }
            );
        })
    }

    async addAccount(accountDescription, accountType, notes) {
        // Construct insert statement
        let newInsertStatement = "";
        let accountSelectable = `${accountDescription} [${accountType}]`;
        newInsertStatement += "INSERT INTO chart_of_accounts ";
        newInsertStatement += `(account_type,account_description,account_selectable${notes ? ",notes) " : ") "}`;
        newInsertStatement += `VALUES (${accountType},"${accountDescription}","${accountSelectable}"${notes ? `,"${notes}"` : ""});`;
        console.log(newInsertStatement);

        await new Promise((resolve, reject) => {
            this.db.run(
                newInsertStatement,
                err => {
                    if (err) {
                        console.error(`Error inserting Account with data: accountDescription [${accountDescription}], accountType [${accountType}], notes [${notes}]`, err.message);
                        reject(err);
                    } else {
                        console.log(`Account [${accountSelectable}] added successfully!`);
                        resolve();
                    }
                }
            )
        })

    }

    async addAccountType(typeCode, typeDescription, notes) {
        // Construct insert statement
        let newInsertStatement = "";
        newInsertStatement += "INSERT INTO account_types ";
        newInsertStatement += `(type_code,type_description${notes ? ",notes) " : ") "}`;
        newInsertStatement += `VALUES (${typeCode},"${typeDescription}"${notes ? `,"${notes}"` : ""});`;

        await new Promise((resolve, reject) => {
            this.db.run(
                newInsertStatement,
                err => {
                    if (err) {
                        console.error(`Error inserting Account Type with data: typeCode [${typeCode}],typeDescription [${typeDescription}],notes [${notes}]`, err.message);
                        reject(err);
                    } else {
                        console.log(`Account Type [${typeCode}] [${typeDescription}] added successfully!`);
                        resolve();
                    }
                }
            )
        })

    }

    async getAllAccounts() {
        let results = [];
        await new Promise((resolve, reject) => {
            this.db.all(this.selectAccountALL, [], (err, rows) => {
                if (err) {
                    console.error("Error retrieving all account records from the database ", err.message);
                    reject(err);
                } else {
                    results = rows;
                    resolve();
                }
            });
        })

        return results;
    }

    async getAllTypes() {
        let results = [];
        await new Promise((resolve, reject) => {
            this.db.all(this.selectTypeALL, [], (err, rows) => {
                if (err) {
                    console.error("Error retrieving all account type records from the database ", err.message);
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

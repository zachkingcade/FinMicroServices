import sqlite3 from 'sqlite3'
import type { Logger } from 'winston';
import { WLog } from '../WLog.js';
import { Transaction, Playbook, PlaybookEntry, PlaybookWithEntryCount } from '../types/Transaction.js';

export class DatabaseHandler {

    //--------------------------------------------------------------------------------
    //Member Varibles
    //--------------------------------------------------------------------------------

    //member varibles
    connectedStatus: boolean = false;
    db!: sqlite3.Database;
    log: Logger;

    //stored queries
    selectTransactionsAll: string = "SELECT * FROM ledger_transactions order by trans_date;";
    selectPendingTransactionsAll: string = "SELECT * FROM pending_transactions order by trans_date;";
    selectTransactionsByAffectingAccounts: string = "SELECT * FROM ledger_transactions where credit_account = ? or debit_account = ?;";
    selectPlaybooksAll: string = "SELECT * FROM playbooks order by playbook_id;";
    selectPlaybooksWithEntryCount: string = "SELECT p.playbook_id, p.name, (SELECT COUNT(*) FROM playbook_entries e WHERE e.playbook_id = p.playbook_id) as entry_count FROM playbooks p order by p.playbook_id;";
    selectPlaybookById: string = "SELECT * FROM playbooks where playbook_id = ?;";
    selectPlaybookEntriesByPlaybookId: string = "SELECT * FROM playbook_entries where playbook_id = ? order by sort_order, entry_id;";

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
                    this.log.error(`Error opening database: [${err.message}]`);
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

    /**
     * Checks connected status
     * @returns connected status 
     */
    checkConnectedStatus(): boolean {
        return this.connectedStatus;
    }

    //Creates the tables needed for basic operation if they have not already been created
    async createTablesIfNotExist(): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            this.db.run(
                `CREATE TABLE IF NOT EXISTS ledger_transactions (
            trans_code INTEGER PRIMARY KEY AUTOINCREMENT,
            trans_date TEXT NOT NULL,
            trans_description TEXT NOT NULL,
            amount DECIMAL(10, 2),
            credit_account INTEGER NOT NULL,
            debit_account INTEGER NOT NULL,
            notes TEXT NULL 
            )`,
                err => {
                    if (err) {
                        this.log.error(`Error creating ledger_transactions: [${err.message}]`);
                        reject(err);
                    } else {
                        this.log.info('ledger_transactions table created or already exists.')
                        resolve();
                    }
                }
            );
        })
        await new Promise<void>((resolve, reject) => {
            this.db.run(
                `CREATE TABLE IF NOT EXISTS pending_transactions (
            trans_code INTEGER PRIMARY KEY AUTOINCREMENT,
            trans_date TEXT NOT NULL,
            trans_description TEXT NOT NULL,
            amount DECIMAL(10, 2)
            )`,
                err => {
                    if (err) {
                        this.log.error(`Error creating pending_transactions: [${err.message}]`);
                        reject(err);
                    } else {
                        this.log.info('pending_transactions table created or already exists.')
                        resolve();
                    }
                }
            );
        })
        await new Promise<void>((resolve, reject) => {
            this.db.run(
                `CREATE TABLE IF NOT EXISTS playbooks (
            playbook_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
            )`,
                err => {
                    if (err) {
                        this.log.error(`Error creating playbooks: [${err.message}]`);
                        reject(err);
                    } else {
                        this.log.info('playbooks table created or already exists.')
                        resolve();
                    }
                }
            );
        })
        await new Promise<void>((resolve, reject) => {
            this.db.run(
                `CREATE TABLE IF NOT EXISTS playbook_entries (
            entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
            playbook_id INTEGER NOT NULL,
            trans_description TEXT NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            credit_account INTEGER NOT NULL,
            debit_account INTEGER NOT NULL,
            notes TEXT NULL,
            sort_order INTEGER NULL,
            FOREIGN KEY (playbook_id) REFERENCES playbooks(playbook_id)
            )`,
                err => {
                    if (err) {
                        this.log.error(`Error creating playbook_entries: [${err.message}]`);
                        reject(err);
                    } else {
                        this.log.info('playbook_entries table created or already exists.')
                        resolve();
                    }
                }
            );
        })
    }

    //--------------------------------------------------------------------------------
    //Adding New Records
    //--------------------------------------------------------------------------------

    //Note trans_date is expected in YYYY-MM-DD format
    //TODO check for negative amounts
    async addTransaction(trans_date: string, trans_description: string, amount: number, credit_account: number, debit_account: number, notes?: string): Promise<void> {
        // Construct insert statement
        let newInsertStatement: string = "";
        newInsertStatement += "INSERT INTO ledger_transactions ";
        newInsertStatement += `(trans_date,trans_description,amount,credit_account,debit_account${notes ? ",notes) " : ") "}`;
        newInsertStatement += `VALUES ("${trans_date}","${trans_description}","${Math.abs(amount)}",${credit_account},${debit_account}${notes ? `,"${notes}"` : ""});`;

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
                        this.log.error(`Error inserting transaction with data: trans_date [${trans_date}], trans_description[${trans_description}], credit_account [${credit_account}], debit_account [${debit_account}],notes [${notes}]: ${err.message}`);
                        reject(err);
                    } else {
                        this.log.info(`Transaction [${trans_description}][${credit_account}][${debit_account}] added successfully!`);
                        resolve();
                    }
                }
            )
        })
    }

    //Note trans_date is expected in YYYY-MM-DD format
    //TODO check for negative amounts
    async addPendingTransaction(trans_date: string, trans_description: string, amount: number): Promise<void> {
        // Construct insert statement
        let newInsertStatement: string = "";
        newInsertStatement += "INSERT INTO pending_transactions ";
        newInsertStatement += `(trans_date,trans_description,amount)`;
        newInsertStatement += `VALUES ("${trans_date}","${trans_description}","${Math.abs(amount)}");`;

        await new Promise<void>((resolve, reject) => {
            this.db.run(
                newInsertStatement,
                err => {
                    if (err) {
                        this.log.error(`Error inserting pending transaction with data: trans_date [${trans_date}], trans_description[${trans_description}], Error ${err.message}`);
                        reject(err);
                    } else {
                        this.log.info(`Pending Transaction [${trans_description}] added successfully!`);
                        resolve();
                    }
                }
            )
        })
    }

    async addPlaybook(name: string): Promise<void> {
        let newInsertStatement: string = "";
        newInsertStatement += "INSERT INTO playbooks ";
        newInsertStatement += "(name) ";
        newInsertStatement += `VALUES ("${name}");`;

        await new Promise<void>((resolve, reject) => {
            this.db.run(
                newInsertStatement,
                err => {
                    if (err) {
                        this.log.error(`Error inserting playbook with name [${name}]: ${err.message}`);
                        reject(err);
                    } else {
                        this.log.info(`Playbook [${name}] added successfully!`);
                        resolve();
                    }
                }
            )
        })
    }

    async addPlaybookEntry(playbook_id: number, trans_description: string, amount: number, credit_account: number, debit_account: number, notes?: string, sort_order?: number): Promise<void> {
        try {
            await this.validateAccount(credit_account);
            await this.validateAccount(debit_account);
        } catch (error) {
            throw new Error(`Unable to add playbook entry: Invalid account found: ${error}`)
        }

        let newInsertStatement: string = "";
        newInsertStatement += "INSERT INTO playbook_entries ";
        newInsertStatement += "(playbook_id,trans_description,amount,credit_account,debit_account";
        if (notes !== undefined) newInsertStatement += ",notes";
        if (sort_order !== undefined) newInsertStatement += ",sort_order";
        newInsertStatement += ") ";
        newInsertStatement += `VALUES (${playbook_id},"${trans_description}","${Math.abs(amount)}",${credit_account},${debit_account}`;
        if (notes !== undefined) newInsertStatement += `,"${notes}"`;
        if (sort_order !== undefined) newInsertStatement += `,${sort_order}`;
        newInsertStatement += ");";

        await new Promise<void>((resolve, reject) => {
            this.db.run(
                newInsertStatement,
                err => {
                    if (err) {
                        this.log.error(`Error inserting playbook entry: ${err.message}`);
                        reject(err);
                    } else {
                        this.log.info(`Playbook entry [${trans_description}] added successfully!`);
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

    /**
     * Gets all transactions from the database
     * @returns all transactions
     */
    async getAllTransactions(): Promise<Transaction[]> {
        let results: any = [];
        await new Promise<void>((resolve, reject) => {
            this.db.all(this.selectTransactionsAll, [], (err, rows) => {
                if (err) {
                    this.log.error(`Error retrieving all transaction records from the database ${err.message}`);
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
     * Gets all pending transactions from the database
     * @returns all pending transactions
     */
    async getAllPendingTransactions(): Promise<Transaction[]> {
        let results: any = [];
        await new Promise<void>((resolve, reject) => {
            this.db.all(this.selectPendingTransactionsAll, [], (err, rows) => {
                if (err) {
                    this.log.error(`Error retrieving all pending transaction records from the database ${err.message}`);
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
     * Gets all transactions from the database where the credit or debit matches the provided account_code
     * @returns all transactions where the credit or debit matches the provided account_code
     */
    async getAllTransactionsByAffectingAccount(account_code: number): Promise<Transaction[]> {
        let results: any = [];
        await new Promise<void>((resolve, reject) => {
            this.db.all(this.selectTransactionsByAffectingAccounts, [account_code, account_code], (err, rows) => {
                if (err) {
                    this.log.error(`Error retrieving all transaction records from the database that have account ${account_code}: ${err.message}`);
                    reject(err);
                } else {
                    results = rows;
                    resolve();
                }
            });
        })
        return results;
    }

    async getAllPlaybooks(): Promise<Playbook[]> {
        let results: any = [];
        await new Promise<void>((resolve, reject) => {
            this.db.all(this.selectPlaybooksAll, [], (err, rows) => {
                if (err) {
                    this.log.error(`Error retrieving all playbooks: ${err.message}`);
                    reject(err);
                } else {
                    results = rows;
                    resolve();
                }
            });
        })
        return results;
    }

    async getAllPlaybooksWithEntryCount(): Promise<PlaybookWithEntryCount[]> {
        let results: any = [];
        await new Promise<void>((resolve, reject) => {
            this.db.all(this.selectPlaybooksWithEntryCount, [], (err, rows) => {
                if (err) {
                    this.log.error(`Error retrieving playbooks with entry count: ${err.message}`);
                    reject(err);
                } else {
                    results = rows;
                    resolve();
                }
            });
        })
        return results;
    }

    async getPlaybookById(playbook_id: number): Promise<Playbook | null> {
        let results: any = [];
        await new Promise<void>((resolve, reject) => {
            this.db.all(this.selectPlaybookById, [playbook_id], (err, rows) => {
                if (err) {
                    this.log.error(`Error retrieving playbook [${playbook_id}]: ${err.message}`);
                    reject(err);
                } else {
                    results = rows;
                    resolve();
                }
            });
        })
        return results.length > 0 ? results[0] : null;
    }

    async getPlaybookEntries(playbook_id: number): Promise<PlaybookEntry[]> {
        let results: any = [];
        await new Promise<void>((resolve, reject) => {
            this.db.all(this.selectPlaybookEntriesByPlaybookId, [playbook_id], (err, rows) => {
                if (err) {
                    this.log.error(`Error retrieving playbook entries for playbook [${playbook_id}]: ${err.message}`);
                    reject(err);
                } else {
                    results = rows;
                    resolve();
                }
            });
        })
        return results;
    }

    //--------------------------------------------------------------------------------
    //Removing Records
    //--------------------------------------------------------------------------------

    //Note trans_date is expected in YYYY-MM-DD format
    //TODO check for negative amounts
    async removeTransaction(trans_code: number): Promise<void> {
        // Construct insert statement
        let newInsertStatement: string = "";
        newInsertStatement += "Delete from ledger_transactions ";
        newInsertStatement += `where trans_code = ${trans_code}`;

        await new Promise<void>((resolve, reject) => {
            this.db.run(
                newInsertStatement,
                err => {
                    if (err) {
                        this.log.error(`Error deleteing transaction with data: trans_code [${trans_code}]. Error: ${err.message}`);
                        reject(err);
                    } else {
                        this.log.info(`Transaction [${trans_code}] deleted successfully!`);
                        resolve();
                    }
                }
            )
        })
    }

    //Note trans_date is expected in YYYY-MM-DD format
    //TODO check for negative amounts
    async removePendingTransaction(trans_code: number): Promise<void> {
        // Construct insert statement
        let newInsertStatement: string = "";
        newInsertStatement += "Delete from pending_transactions ";
        newInsertStatement += `where trans_code = ${trans_code}`;

        await new Promise<void>((resolve, reject) => {
            this.db.run(
                newInsertStatement,
                err => {
                    if (err) {
                        this.log.error(`Error deleteing pending transaction with data: trans_code [${trans_code}]. Error: ${err.message}`);
                        reject(err);
                    } else {
                        this.log.info(`Pending transaction [${trans_code}] deleted successfully!`);
                        resolve();
                    }
                }
            )
        })
    }

    async removePlaybookEntry(entry_id: number): Promise<void> {
        let newDeleteStatement: string = "";
        newDeleteStatement += "Delete from playbook_entries ";
        newDeleteStatement += `where entry_id = ${entry_id}`;

        await new Promise<void>((resolve, reject) => {
            this.db.run(
                newDeleteStatement,
                err => {
                    if (err) {
                        this.log.error(`Error deleting playbook entry [${entry_id}]: ${err.message}`);
                        reject(err);
                    } else {
                        this.log.info(`Playbook entry [${entry_id}] deleted successfully!`);
                        resolve();
                    }
                }
            )
        })
    }

    async removePlaybook(playbook_id: number): Promise<void> {
        let newDeleteStatement: string = "";
        newDeleteStatement += "Delete from playbook_entries ";
        newDeleteStatement += `where playbook_id = ${playbook_id}`;
        await new Promise<void>((resolve, reject) => {
            this.db.run(
                newDeleteStatement,
                err => {
                    if (err) {
                        this.log.error(`Error deleting playbook entries for playbook [${playbook_id}]: ${err.message}`);
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            )
        })
        newDeleteStatement = "";
        newDeleteStatement += "Delete from playbooks ";
        newDeleteStatement += `where playbook_id = ${playbook_id}`;
        await new Promise<void>((resolve, reject) => {
            this.db.run(
                newDeleteStatement,
                err => {
                    if (err) {
                        this.log.error(`Error deleting playbook [${playbook_id}]: ${err.message}`);
                        reject(err);
                    } else {
                        this.log.info(`Playbook [${playbook_id}] deleted successfully!`);
                        resolve();
                    }
                }
            )
        })
    }

    //--------------------------------------------------------------------------------
    //Updating Records
    //--------------------------------------------------------------------------------

    /**
     * Updates Transaction Notes in the database
     * @param newNotes The notes to apply to this transaction
     * @returns a promise that returns nothing. It resolves when the operation is done but returns no data
     */
    async UpdateTransactionNotes(trans_code: number, newNotes: string): Promise<void> {
        // Construct update statement
        let newUpdateStatement: string = "";
        newUpdateStatement += "UPDATE ledger_transactions ";
        newUpdateStatement += `SET notes = '${newNotes || ""}'`;
        newUpdateStatement += ` WHERE trans_code = ${trans_code}`;

        this.log.info(`Database Command: [${newUpdateStatement}]`);

        await new Promise<void>((resolve, reject) => {
            this.db.run(
                newUpdateStatement,
                err => {
                    if (err) {
                        this.log.error(`Error updating Transaction with trans_code [${trans_code}],notes [${newNotes}]: [${err.message}]`);
                        reject(err);
                    } else {
                        this.log.info(`Transaction [${trans_code}] updated successfully!`);
                        resolve();
                    }
                }
            )
        })
    }

    async updatePlaybookName(playbook_id: number, name: string): Promise<void> {
        let newUpdateStatement: string = "";
        newUpdateStatement += "UPDATE playbooks ";
        newUpdateStatement += `SET name = '${name}'`;
        newUpdateStatement += ` WHERE playbook_id = ${playbook_id}`;

        await new Promise<void>((resolve, reject) => {
            this.db.run(
                newUpdateStatement,
                err => {
                    if (err) {
                        this.log.error(`Error updating playbook name [${playbook_id}]: ${err.message}`);
                        reject(err);
                    } else {
                        this.log.info(`Playbook [${playbook_id}] name updated successfully!`);
                        resolve();
                    }
                }
            )
        })
    }

    async updatePlaybookEntry(entry_id: number, trans_description: string, amount: number, credit_account: number, debit_account: number, notes?: string): Promise<void> {
        try {
            await this.validateAccount(credit_account);
            await this.validateAccount(debit_account);
        } catch (error) {
            throw new Error(`Unable to update playbook entry: Invalid account found: ${error}`)
        }

        let newUpdateStatement: string = "";
        newUpdateStatement += "UPDATE playbook_entries ";
        newUpdateStatement += `SET trans_description = '${trans_description}', amount = ${Math.abs(amount)}, credit_account = ${credit_account}, debit_account = ${debit_account}, notes = '${notes || ""}'`;
        newUpdateStatement += ` WHERE entry_id = ${entry_id}`;

        await new Promise<void>((resolve, reject) => {
            this.db.run(
                newUpdateStatement,
                err => {
                    if (err) {
                        this.log.error(`Error updating playbook entry [${entry_id}]: ${err.message}`);
                        reject(err);
                    } else {
                        this.log.info(`Playbook entry [${entry_id}] updated successfully!`);
                        resolve();
                    }
                }
            )
        })
    }

    async replayPlaybook(playbook_id: number, trans_date: string): Promise<number> {
        const entries = await this.getPlaybookEntries(playbook_id);
        let count = 0;
        for (const entry of entries) {
            await this.addTransaction(trans_date, entry.trans_description, entry.amount, entry.credit_account, entry.debit_account, entry.notes);
            count++;
        }
        return count;
    }
}

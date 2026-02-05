import sqlite3 from 'sqlite3'
import type { Logger } from 'winston';
import { WLog } from '../WLog.js';
import type { AccountType } from '../types/AccountType.js';
import type { Account } from '../types/Account.js';
import { TypeClass } from '../types/TypeClass.js';
import type { BudgetPlan, BudgetIncome, BudgetRow, BudgetRowAmount } from '../types/Budget.js';

export class DatabaseHandler {

    //--------------------------------------------------------------------------------
    //Member Varibles
    //--------------------------------------------------------------------------------
    connectedStatus: boolean = false;
    db!: sqlite3.Database;
    log: Logger;

    //stored queries
    selectAccountALL: string = "SELECT * FROM chart_of_accounts order by account_type;";
    selectAccountById: string = "SELECT * FROM chart_of_accounts where account_code = ?;";
    selectAccountsByType: string = "SELECT * FROM chart_of_accounts where account_type = ?;";

    selectTypeALL: string = "SELECT * FROM account_types order by type_class;";
    selectTypeById: string = "SELECT * FROM account_types where type_code = ?;";
    selectTypeByDescription: string = "SELECT * FROM account_types where type_description = ?;";

    selectTypeClassAll: string = "SELECT * FROM type_classes;";
    selectTypeClassById: string = "SELECT * FROM type_classes where class_code = ?;";

    selectBudgetPlansAll: string = "SELECT * FROM budget_plans order by plan_id;";
    selectBudgetPlanById: string = "SELECT * FROM budget_plans where plan_id = ?;";
    selectBudgetIncomesByPlanId: string = "SELECT * FROM budget_incomes where plan_id = ? order by income_id;";
    selectBudgetRowsByPlanId: string = "SELECT * FROM budget_rows where plan_id = ? order by row_id;";
    selectBudgetRowAmountsByRowId: string = "SELECT * FROM budget_row_amounts where row_id = ?;";
    selectBudgetRowAmountsByPlanId: string = "SELECT a.* FROM budget_row_amounts a JOIN budget_rows r ON a.row_id = r.row_id WHERE r.plan_id = ?;";

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
                    this.log.error(`Error opening database: ${err.message}`)
                    reject(err);
                } else {
                    this.log.info('Connected to the SQLite database.')
                    await this.createTablesIfNotExist();
                    resolve()
                }
            });
        })
        this.log.info('SQLite database startup complete!')
    }

    /**
     * Checks connected status
     * @returns connected status
     */
    checkConnectedStatus(): boolean {
        return this.connectedStatus;
    }

    /**
     * Creates tables if they do not already exist
     * @returns a promise that will return nothing
     */
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
                        this.log.error(`Error creating chart_of_accounts: [${err.message}]`);
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
            type_class INTEGER NOT NULL,
            type_active CHAR(1) NOT NULL,
            notes TEXT NULL
            )`,
                err => {
                    if (err) {
                        this.log.error(`Error creating account_types: [${err.message}]`);
                        reject(err);
                    } else {
                        this.log.info('account_types table created or already exists.');
                        resolve();
                    }
                }
            );
        })

        await new Promise<void>((resolve, reject) => {
            this.db.run(
                `CREATE TABLE IF NOT EXISTS type_classes (
            class_code INTEGER PRIMARY KEY AUTOINCREMENT,
            class_description TEXT UNIQUE NOT NULL,
            credit_effect CHAR(1) NOT NULL,
            debit_effect CHAR(1) NOT NULL
            )`,
                err => {
                    if (err) {
                        this.log.error(`Error creating type_classes: [${err.message}]`);
                        reject(err);
                    } else {
                        this.log.info('type_classes table created or already exists.');
                        resolve();
                    }
                }
            );
        })

        await new Promise<void>((resolve, reject) => {
            this.db.run(
                `CREATE TABLE IF NOT EXISTS budget_plans (
            plan_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            planning_period TEXT NOT NULL
            )`,
                err => {
                    if (err) {
                        this.log.error(`Error creating budget_plans: [${err.message}]`);
                        reject(err);
                    } else {
                        this.log.info('budget_plans table created or already exists.');
                        resolve();
                    }
                }
            );
        })

        await new Promise<void>((resolve, reject) => {
            this.db.run(
                `CREATE TABLE IF NOT EXISTS budget_incomes (
            income_id INTEGER PRIMARY KEY AUTOINCREMENT,
            plan_id INTEGER NOT NULL,
            name TEXT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            interval_type TEXT NOT NULL,
            interval_count INTEGER NOT NULL,
            FOREIGN KEY (plan_id) REFERENCES budget_plans(plan_id)
            )`,
                err => {
                    if (err) {
                        this.log.error(`Error creating budget_incomes: [${err.message}]`);
                        reject(err);
                    } else {
                        this.log.info('budget_incomes table created or already exists.');
                        resolve();
                    }
                }
            );
        })

        await new Promise<void>((resolve, reject) => {
            this.db.run(
                `CREATE TABLE IF NOT EXISTS budget_rows (
            row_id INTEGER PRIMARY KEY AUTOINCREMENT,
            plan_id INTEGER NOT NULL,
            account_code INTEGER NOT NULL,
            FOREIGN KEY (plan_id) REFERENCES budget_plans(plan_id),
            FOREIGN KEY (account_code) REFERENCES chart_of_accounts(account_code),
            UNIQUE(plan_id, account_code)
            )`,
                err => {
                    if (err) {
                        this.log.error(`Error creating budget_rows: [${err.message}]`);
                        reject(err);
                    } else {
                        this.log.info('budget_rows table created or already exists.');
                        resolve();
                    }
                }
            );
        })

        await new Promise<void>((resolve, reject) => {
            this.db.run(
                `CREATE TABLE IF NOT EXISTS budget_row_amounts (
            row_id INTEGER NOT NULL,
            income_id INTEGER NOT NULL,
            amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
            PRIMARY KEY (row_id, income_id),
            FOREIGN KEY (row_id) REFERENCES budget_rows(row_id),
            FOREIGN KEY (income_id) REFERENCES budget_incomes(income_id)
            )`,
                err => {
                    if (err) {
                        this.log.error(`Error creating budget_row_amounts: [${err.message}]`);
                        reject(err);
                    } else {
                        this.log.info('budget_row_amounts table created or already exists.');
                        resolve();
                    }
                }
            );
        })

        await new Promise<void>(async (resolve, reject) => {
            //check if data as been seeded
            try {
                let results = await this.getAllTypeClasses();

                if (results.length) {
                    resolve();
                } else {
                    await this.addTypeClass("Asset", "+", "-");
                    await this.addTypeClass("Liability", "-", "+");
                    await this.addTypeClass("Equity", "-", "+");
                    resolve();
                }
            } catch (error) {
                reject(`Error encountered checking type class for seeded data: [${error}]`);
            }
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
            throw Error(`Error adding account [${accountDescription}] due to accountActive provided being [${accountActive}]. Provided Value must be "Y" or "N".`)
        }

        accountType = await this.ValidateAccountType(accountType);
        this.log.debug(`Account Type for new account [${accountDescription}] validation returned as [${accountType}]`)

        if (accountType == -1) {
            this.log.error(`Error adding account [${accountDescription}] due to account type [${accountType}] being neither a valid type description or type code.`)
            throw Error(`Error adding account [${accountDescription}] due to account type [${accountType}] being neither a valid type description or type code.`)
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
                        this.log.error(`Error inserting Account with data: accountDescription [${accountDescription}], accountType [${accountType}], notes [${notes}]: [${err.message}]`);
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
    async addAccountType(typeDescription: string, typeClass: number, notes?: string): Promise<void> {
        // Construct insert statement
        let newInsertStatement: string = "";
        newInsertStatement += "INSERT INTO account_types ";
        newInsertStatement += `(type_description,type_class,type_active,${notes ? ",notes) " : ") "}`;
        newInsertStatement += `VALUES ("${typeDescription}","${typeClass}","Y"${notes ? `,"${notes}"` : ""});`;

        await new Promise<void>((resolve, reject) => {
            this.db.run(
                newInsertStatement,
                err => {
                    if (err) {
                        this.log.error(`Error inserting Account Type with data:typeDescription [${typeDescription}],notes [${notes}]: [${err.message}]`);
                        reject(err);
                    } else {
                        this.log.info(`Account Type [${typeDescription}] added successfully!`);
                        resolve();
                    }
                }
            )
        })

    }

    /**
     * Adds account class to the database. This method is private and meant to only be used for seeding data.
     * @param typeDescription describes the new type account class
     * @returns a promise that returns nothing. It resolves when the operation is done but returns no data
     */
    private async addTypeClass(classDescription: string, creditEffect: "+" | "-", debitEffect: "+" | "-"): Promise<void> {
        // Construct insert statement
        let newInsertStatement: string = "";
        newInsertStatement += "INSERT INTO type_classes ";
        newInsertStatement += `(class_description,credit_effect,debit_effect)`;
        newInsertStatement += `VALUES ("${classDescription}","${creditEffect}","${debitEffect}");`;

        await new Promise<void>((resolve, reject) => {
            this.db.run(
                newInsertStatement,
                err => {
                    if (err) {
                        this.log.error(`Error inserting Type class with data:classDescription [${classDescription}]: [${err.message}]`);
                        reject(err);
                    } else {
                        this.log.info(`Type Class [${classDescription}] added successfully!`);
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
                    this.log.error(`Error retrieving all account records from the database: [${err.message}]`);
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
                    this.log.error(`Error retrieving all account type records from the database: [${err.message}]`);
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
     * Gets all type classes
     * @returns all type classes
     */
    async getAllTypeClasses(): Promise<TypeClass[]> {
        let results: any = [];
        await new Promise<void>((resolve, reject) => {
            this.db.all(this.selectTypeClassAll, [], (err, rows) => {
                if (err) {
                    this.log.error(`Error retrieving all account type records from the database: [${err.message}]`);
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
                    this.log.error(`Error retrieving account by Id [${id}] from the database: [${err.message}]`);
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
     * Gets accounts by type
     * @param id the desired type to search by
     * @returns accounts of provided type
     */
    async getAccountsByType(id: number): Promise<Account[]> {
        let result: any;
        await new Promise<void>((resolve, reject) => {
            this.db.all(this.selectAccountsByType, [id], (err, row) => {
                if (err) {
                    this.log.error(`Error retrieving accounts by type [${id}] from the database: [${err.message}]`);
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
                    this.log.error(`Error retrieving type by Id [${id}] from the database: [${err.message}]`);
                    reject(err);
                } else {
                    this.log.info(`Got account type by id [${id}]: [${row}]`);
                    result = row;
                    resolve();
                }
            })
        })
        return result;
    }

    /**
     * Gets type class by id
     * @param id type class's class_code
     * @returns type class by id 
     */
    async getTypeClassById(id: number): Promise<AccountType> {
        let result: any;
        await new Promise<void>((resolve, reject) => {
            this.db.get(this.selectTypeClassById, [id], (err, row) => {
                if (err) {
                    this.log.error(`Error retrieving type class by Id [${id}] from the database: [${err.message}]`);
                    reject(err);
                } else {
                    this.log.info(`Got type class by id [${id}]: [${row}]`);
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
                    this.log.error(`Error retrieving type by description [${description}] from the database: [${err.message}] `);
                    reject(err);
                } else {
                    this.log.info(`Got account type by description [${description}]: [${row}]`);
                    result = row;
                    resolve();
                }
            })
        })
        return result;
    }

    //--------------------------------------------------------------------------------
    //Updating Records
    //--------------------------------------------------------------------------------

    /**
     * Updates account in the database
     * @param newObject A version of the previous object that has had everything that the caller might want to change, changed
     * @returns a promise that returns nothing. It resolves when the operation is done but returns no data
     */
    async UpdateAccount(newObject: Account): Promise<void> {
        // Construct update statement
        let newUpdateStatement: string = "";
        newUpdateStatement += "UPDATE chart_of_accounts ";
        newUpdateStatement += `SET account_description = '${newObject.account_description}'`;
        newUpdateStatement += `, account_active = '${newObject.account_active}'`;
        newUpdateStatement += `, notes = '${newObject.notes || ""}'`;
        newUpdateStatement += ` WHERE account_code = ${newObject.account_code}`;

        this.log.info(`Database Command: [${newUpdateStatement}]`);

        await new Promise<void>((resolve, reject) => {
            this.db.run(
                newUpdateStatement,
                err => {
                    if (err) {
                        this.log.error(`Error updating Account with data: typeDescription [${newObject.account_description}],notes [${newObject.notes}]: [${err.message}]`);
                        reject(err);
                    } else {
                        this.log.info(`Account [${newObject.account_description}] updated successfully!`);
                        resolve();
                    }
                }
            )
        })
    }

        /**
     * Updates account's selectable column in the database. Note only meant for internal use
     * @param newObject A version of the previous object that has had the account selectable changed
     * @returns a promise that returns nothing. It resolves when the operation is done but returns no data
     */
    private async _UpdateAccountSelectable(newObject: Account): Promise<void> {
        // Construct update statement
        let newUpdateStatement: string = "";
        newUpdateStatement += "UPDATE chart_of_accounts ";
        newUpdateStatement += `SET account_selectable = '${newObject.account_selectable}'`
        newUpdateStatement += ` WHERE account_code = ${newObject.account_code}`

        this.log.info(`Database Command: [${newUpdateStatement}]`);

        await new Promise<void>((resolve, reject) => {
            this.db.run(
                newUpdateStatement,
                err => {
                    if (err) {
                        this.log.error(`Error updating Account selectable with data: new selectable [${newObject.account_selectable}]: [${err.message}]`);
                        reject(err);
                    } else {
                        this.log.info(`Account [${newObject.account_description}]'s selectable updated successfully!`);
                        resolve();
                    }
                }
            )
        })
    }

    /**
     * Updates account type in the database
     * @param newObject A version of the previous object that has had everything that the caller might want to change, changed
     * @returns a promise that returns nothing. It resolves when the operation is done but returns no data
     */
    async UpdateAccountType(newObject: AccountType): Promise<void> {
        //are we updating active status
        let oldObject: AccountType = await this.getTypeById(newObject.type_code);
        let updatingActive = oldObject.type_active != newObject.type_active;
        let updatingDescription = oldObject.type_description != newObject.type_description;

        // Construct update statement
        let newUpdateStatement: string = "";
        newUpdateStatement += "UPDATE account_types ";
        newUpdateStatement += `SET type_description = '${newObject.type_description}'`
        newUpdateStatement += `, type_active = '${newObject.type_active}'`
        newUpdateStatement += `, notes = '${newObject.notes || ""}'`;
        newUpdateStatement += ` WHERE type_code = ${newObject.type_code}`

        await new Promise<void>((resolve, reject) => {
            this.db.run(
                newUpdateStatement,
                err => {
                    if (err) {
                        this.log.error(`Error updating Account Type with data: typeDescription [${newObject.type_description}],notes [${newObject.notes}]: [${err.message}]`);
                        reject(err);
                    } else {
                        this.log.info(`Account Type [${newObject.type_description}] updated successfully!`);
                        resolve();
                    }
                }
            )
        })

        if (updatingActive) {
            let accountsToUpdate: Account[] = await this.getAccountsByType(oldObject.type_code);

            for (let account of accountsToUpdate) {
                account.account_active = newObject.type_active;
                await this.UpdateAccount(account);
            }
        }

        if(updatingDescription) {
            let accountsToUpdate: Account[] = await this.getAccountsByType(oldObject.type_code);

            for (let account of accountsToUpdate) {
                let noTypeString = account.account_selectable.split('[')[0];
                account.account_selectable = noTypeString + `[${newObject.type_description}]`;
                await this._UpdateAccountSelectable(account);
            }
        }
    }

    //--------------------------------------------------------------------------------
    // Budget - Validation
    //--------------------------------------------------------------------------------

    async validateAccountIsAsset(account_code: number): Promise<boolean> {
        const account = await this.getAccountById(account_code);
        const accountType = await this.getTypeById(account.account_type);
        const typeClassRow = await new Promise<TypeClass | undefined>((resolve, reject) => {
            this.db.get(this.selectTypeClassById, [accountType.type_class], (err, row) => err ? reject(err) : resolve(row as TypeClass));
        });
        return typeClassRow?.class_description === 'Asset';
    }

    //--------------------------------------------------------------------------------
    // Budget - Plans
    //--------------------------------------------------------------------------------

    async addBudgetPlan(name: string, planning_period: string): Promise<number> {
        const stmt = "INSERT INTO budget_plans (name, planning_period) VALUES (\"" + name + "\", \"" + planning_period + "\");";
        return new Promise<number>((resolve, reject) => {
            this.db.run(stmt, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    async getAllBudgetPlans(): Promise<BudgetPlan[]> {
        const results: any = [];
        await new Promise<void>((resolve, reject) => {
            this.db.all(this.selectBudgetPlansAll, [], (err, rows) => {
                if (err) reject(err);
                else { results.push(...(rows || [])); resolve(); }
            });
        });
        return results;
    }

    async getBudgetPlanById(plan_id: number): Promise<BudgetPlan | null> {
        const row: any = await new Promise((resolve, reject) => {
            this.db.get(this.selectBudgetPlanById, [plan_id], (err, r) => err ? reject(err) : resolve(r));
        });
        return row || null;
    }

    async updateBudgetPlan(plan_id: number, name: string, planning_period: string): Promise<void> {
        const stmt = "UPDATE budget_plans SET name = \"" + name + "\", planning_period = \"" + planning_period + "\" WHERE plan_id = " + plan_id;
        await new Promise<void>((resolve, reject) => {
            this.db.run(stmt, err => err ? reject(err) : resolve());
        });
    }

    async deleteBudgetPlan(plan_id: number): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            this.db.run("DELETE FROM budget_row_amounts WHERE row_id IN (SELECT row_id FROM budget_rows WHERE plan_id = " + plan_id + ")", err => err ? reject(err) : resolve());
        });
        await new Promise<void>((resolve, reject) => {
            this.db.run("DELETE FROM budget_rows WHERE plan_id = " + plan_id, err => err ? reject(err) : resolve());
        });
        await new Promise<void>((resolve, reject) => {
            this.db.run("DELETE FROM budget_incomes WHERE plan_id = " + plan_id, err => err ? reject(err) : resolve());
        });
        await new Promise<void>((resolve, reject) => {
            this.db.run("DELETE FROM budget_plans WHERE plan_id = " + plan_id, err => err ? reject(err) : resolve());
        });
    }

    async duplicateBudgetPlan(plan_id: number): Promise<number> {
        const plan = await this.getBudgetPlanById(plan_id);
        if (!plan) throw new Error("Budget plan not found.");
        const newName = (plan.name || "") + " - copy";
        const newPlanId = await this.addBudgetPlan(newName, plan.planning_period);
        const incomes = await this.getBudgetIncomesByPlanId(plan_id);
        const incomeIdMap = new Map<number, number>();
        for (const inc of incomes) {
            const newIncomeId = await this.addBudgetIncome(newPlanId, inc.name ?? null, inc.amount, inc.interval_type, inc.interval_count);
            if (inc.income_id != null) incomeIdMap.set(inc.income_id, newIncomeId);
        }
        const rows = await this.getBudgetRowsByPlanId(plan_id);
        const rowIdMap = new Map<number, number>();
        for (const row of rows) {
            const newRowId = await this.addBudgetRow(newPlanId, row.account_code);
            if (row.row_id != null) rowIdMap.set(row.row_id, newRowId);
        }
        const rowAmounts = await this.getBudgetRowAmountsByPlanId(plan_id);
        for (const ra of rowAmounts) {
            const newRowId = rowIdMap.get(ra.row_id);
            const newIncomeId = incomeIdMap.get(ra.income_id);
            if (newRowId != null && newIncomeId != null) {
                await this.setBudgetRowAmount(newRowId, newIncomeId, ra.amount);
            }
        }
        return newPlanId;
    }

    //--------------------------------------------------------------------------------
    // Budget - Incomes
    //--------------------------------------------------------------------------------

    async addBudgetIncome(plan_id: number, name: string | null, amount: number, interval_type: string, interval_count: number): Promise<number> {
        const nameVal = name != null ? "\"" + name + "\"" : "NULL";
        const stmt = "INSERT INTO budget_incomes (plan_id, name, amount, interval_type, interval_count) VALUES (" + plan_id + ", " + nameVal + ", " + amount + ", \"" + interval_type + "\", " + interval_count + ");";
        const incomeId = await new Promise<number>((resolve, reject) => {
            this.db.run(stmt, function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
        const rows = await this.getBudgetRowsByPlanId(plan_id);
        for (const row of rows) {
            await new Promise<void>((resolve, reject) => {
                this.db.run("INSERT INTO budget_row_amounts (row_id, income_id, amount) VALUES (" + row.row_id + ", " + incomeId + ", 0)", err => err ? reject(err) : resolve());
            });
        }
        return incomeId;
    }

    async getBudgetIncomesByPlanId(plan_id: number): Promise<BudgetIncome[]> {
        const results: any = [];
        await new Promise<void>((resolve, reject) => {
            this.db.all(this.selectBudgetIncomesByPlanId, [plan_id], (err, rows) => {
                if (err) reject(err);
                else { results.push(...(rows || [])); resolve(); }
            });
        });
        return results;
    }

    async updateBudgetIncome(income_id: number, name: string | null, amount: number, interval_type: string, interval_count: number): Promise<void> {
        const nameVal = name != null ? "\"" + name + "\"" : "NULL";
        const stmt = "UPDATE budget_incomes SET name = " + nameVal + ", amount = " + amount + ", interval_type = \"" + interval_type + "\", interval_count = " + interval_count + " WHERE income_id = " + income_id;
        await new Promise<void>((resolve, reject) => {
            this.db.run(stmt, err => err ? reject(err) : resolve());
        });
    }

    async deleteBudgetIncome(income_id: number): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            this.db.run("DELETE FROM budget_row_amounts WHERE income_id = " + income_id, err => err ? reject(err) : resolve());
        });
        await new Promise<void>((resolve, reject) => {
            this.db.run("DELETE FROM budget_incomes WHERE income_id = " + income_id, err => err ? reject(err) : resolve());
        });
    }

    //--------------------------------------------------------------------------------
    // Budget - Rows
    //--------------------------------------------------------------------------------

    async addBudgetRow(plan_id: number, account_code: number): Promise<number> {
        const isAsset = await this.validateAccountIsAsset(account_code);
        if (!isAsset) {
            throw new Error("Account must be of type Asset to be used in a budget row.");
        }
        const existingRows = await this.getBudgetRowsByPlanId(plan_id);
        if (existingRows.some((r) => r.account_code === account_code)) {
            throw new Error("This account is already in the plan.");
        }
        const stmt = "INSERT INTO budget_rows (plan_id, account_code) VALUES (" + plan_id + ", " + account_code + ");";
        const rowId = await new Promise<number>((resolve, reject) => {
            this.db.run(stmt, function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
        const incomes = await this.getBudgetIncomesByPlanId(plan_id);
        for (const inc of incomes) {
            await new Promise<void>((resolve, reject) => {
                this.db.run("INSERT INTO budget_row_amounts (row_id, income_id, amount) VALUES (" + rowId + ", " + inc.income_id + ", 0)", err => err ? reject(err) : resolve());
            });
        }
        return rowId;
    }

    async getBudgetRowsByPlanId(plan_id: number): Promise<BudgetRow[]> {
        const results: any = [];
        await new Promise<void>((resolve, reject) => {
            this.db.all(this.selectBudgetRowsByPlanId, [plan_id], (err, rows) => {
                if (err) reject(err);
                else { results.push(...(rows || [])); resolve(); }
            });
        });
        return results;
    }

    async deleteBudgetRow(row_id: number): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            this.db.run("DELETE FROM budget_row_amounts WHERE row_id = " + row_id, err => err ? reject(err) : resolve());
        });
        await new Promise<void>((resolve, reject) => {
            this.db.run("DELETE FROM budget_rows WHERE row_id = " + row_id, err => err ? reject(err) : resolve());
        });
    }

    //--------------------------------------------------------------------------------
    // Budget - Row amounts
    //--------------------------------------------------------------------------------

    async getBudgetRowAmountsByPlanId(plan_id: number): Promise<BudgetRowAmount[]> {
        const results: any = [];
        await new Promise<void>((resolve, reject) => {
            this.db.all(this.selectBudgetRowAmountsByPlanId, [plan_id], (err, rows) => {
                if (err) reject(err);
                else { results.push(...(rows || [])); resolve(); }
            });
        });
        return results;
    }

    async setBudgetRowAmount(row_id: number, income_id: number, amount: number): Promise<void> {
        const stmt = "INSERT OR REPLACE INTO budget_row_amounts (row_id, income_id, amount) VALUES (" + row_id + ", " + income_id + ", " + amount + ")";
        await new Promise<void>((resolve, reject) => {
            this.db.run(stmt, err => err ? reject(err) : resolve());
        });
    }
}

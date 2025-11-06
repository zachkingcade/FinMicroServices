import test from 'node:test'
import assert, { Assert } from 'node:assert'
import { DatabaseHandler } from '../database/DatabaseHandler.js';
import type { AccountType } from '../types/AccountType.js';
import type { Account } from '../types/Account.js';

// Testing functionality for DatabaseHandler

let db: DatabaseHandler;

test.before(async () => {
    db = new DatabaseHandler;
    await db.startup();

    //known test type one
    await db.addAccountType("Testing Account 01",1);
    await db.addAccountType("Testing Account 02",1, "This one has notes");

    await db.addAccount("Account test 01", 1);
    await db.addAccount("Account test 02", "Testing Account 02", "This one has notes");
});

test("Check connected status", () => {
    assert.strictEqual(true, db.checkConnectedStatus());
});

test("Checking for type by Id", async () => {
    let testTypeOne: AccountType = await db.getTypeById(1);
    let resultShouldBe: AccountType = {type_code: 1, type_class: 1, type_description: "Testing Account 01"};
    assert.ok(testTypeOne.type_code == resultShouldBe.type_code, "Expected account type_code to be the same.");
    assert.ok(testTypeOne.type_description == resultShouldBe.type_description, "Expected account type_description to be the same.");
})

test("Checking for type by description", async () => {
    let testTypeOne: AccountType = await db.getTypeByDescription("Testing Account 02")
    let resultShouldBe: AccountType = {type_code: 2, type_class: 1, type_description: "Testing Account 02", notes: "This one has notes"};
    assert.ok(testTypeOne.type_code == resultShouldBe.type_code, "Expected account type_code to be the same.");
    assert.ok(testTypeOne.type_description == resultShouldBe.type_description, "Expected account type_description to be the same.");
    assert.ok(testTypeOne.notes == resultShouldBe.notes, "Expected account type notes to be the same.");
})

test("Testing get all types", async () => {
    let types: AccountType[] = await db.getAllTypes();
    let resultShouldBe1: AccountType = {type_code: 1, type_class: 1, type_description: "Testing Account 01"};
    let resultShouldBe2: AccountType = {type_code: 2, type_class: 1, type_description: "Testing Account 02", notes: "This one has notes"};
    assert.ok(types[0]!.type_code == resultShouldBe1.type_code, "Expected account type_code to be the same.");
    assert.ok(types[0]!.type_description == resultShouldBe1.type_description, "Expected account type_description to be the same.");
    assert.ok(types[0]!.notes == resultShouldBe1.notes, "Expected account type notes to be the same.");
    assert.ok(types[1]!.type_code == resultShouldBe2.type_code, "Expected account type_code to be the same.");
    assert.ok(types[1]!.type_description == resultShouldBe2.type_description, "Expected account type_description to be the same.");
    assert.ok(types[1]!.notes == resultShouldBe2.notes, "Expected account type notes to be the same.");
})

test("Testing Add account with number type and get account by id", async () => {
    let result = await db.getAccountById(1);
    let resultShouldBe: Account = {account_code: 1, account_type: 1, account_description: "Account test 01", account_selectable: "Account test 01 [Testing Account 01]", account_active: "Y"};
    assert.ok(result.account_code == resultShouldBe.account_code, "Expected account account_code to be the same.")
    assert.ok(result.account_type == resultShouldBe.account_type, "Expected account account_type to be the same.")
    assert.ok(result.account_description == resultShouldBe.account_description, "Expected account account_description to be the same.")
    assert.ok(result.account_selectable == resultShouldBe.account_selectable, "Expected account account_selectable to be the same.")
    assert.ok(result.account_active == resultShouldBe.account_active, "Expected account account_active to be the same.")
})

test("Testing Add account with description type and get account by id", async () => {
    let result = await db.getAccountById(2);
    let resultShouldBe: Account = {account_code: 2, account_type: 2, account_description: "Account test 02", account_selectable: "Account test 02 [Testing Account 02]", account_active: "Y"};
    assert.ok(result.account_code == resultShouldBe.account_code, "Expected account account_code to be the same.")
    assert.ok(result.account_type == resultShouldBe.account_type, "Expected account account_type to be the same.")
    assert.ok(result.account_description == resultShouldBe.account_description, "Expected account account_description to be the same.")
    assert.ok(result.account_selectable == resultShouldBe.account_selectable, "Expected account account_selectable to be the same.")
    assert.ok(result.account_active == resultShouldBe.account_active, "Expected account account_active to be the same.")
})

test("Testing get all accounts", async () => {
    let result = await db.getAllAccounts();
    let resultShouldBe1: Account = {account_code: 1, account_type: 1, account_description: "Account test 01", account_selectable: "Account test 01 [Testing Account 01]", account_active: "Y"};
    let resultShouldBe2: Account = {account_code: 2, account_type: 2, account_description: "Account test 02", account_selectable: "Account test 02 [Testing Account 02]", account_active: "Y"};
    assert.ok(result[0]!.account_code == resultShouldBe1.account_code, "Expected account account_code to be the same.")
    assert.ok(result[0]!.account_type == resultShouldBe1.account_type, "Expected account account_type to be the same.")
    assert.ok(result[0]!.account_description == resultShouldBe1.account_description, "Expected account account_description to be the same.")
    assert.ok(result[0]!.account_selectable == resultShouldBe1.account_selectable, "Expected account account_selectable to be the same.")
    assert.ok(result[0]!.account_active == resultShouldBe1.account_active, "Expected account account_active to be the same.")
    assert.ok(result[1]!.account_code == resultShouldBe2.account_code, "Expected account account_code to be the same.")
    assert.ok(result[1]!.account_type == resultShouldBe2.account_type, "Expected account account_type to be the same.")
    assert.ok(result[1]!.account_description == resultShouldBe2.account_description, "Expected account account_description to be the same.")
    assert.ok(result[1]!.account_selectable == resultShouldBe2.account_selectable, "Expected account account_selectable to be the same.")
    assert.ok(result[1]!.account_active == resultShouldBe2.account_active, "Expected account account_active to be the same.")
})
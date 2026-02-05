import { Account } from "./Account"
import { AccountType } from "./AccountType"

export interface Transaction {
    trans_code: number,
    trans_date: string,
    trans_description: string,
    amount: number,
    credit_account: number,
    debit_account: number,
    notes?: string | null
}

export interface TransactionPresentable {
    trans_code: number,
    trans_date: string,
    trans_description: string,
    amount: number,
    credit_account: string,
    debit_account: string,
    notes: string
}

export interface TransactionDTO {
    trans_date: string,
    trans_description: string,
    amount: number,
    credit_account: number,
    debit_account: number,
    notes: string
}

export interface TransactionAddReturn {
    status: string
    newTransaction: Transaction
}

export interface PendingTransaction {
    trans_code?: number,
    trans_date: string,
    trans_description: string,
    amount: number,
}

export interface UpdateTransactionNotesDTO {
    trans_code: number,
    notes: string
}

export interface TransactionFilters {
    dateRangeStart: Date | null,
    dateRangeEnd: Date | null,
    descriptionContains: string,
    accountsFilter: Account[],
    accountTypesFilter: AccountType[],
    notesContains: string,
}

export interface TransactionFilterReturnObject {
    status: string,
    transactionFitlers: TransactionFilters
}

export interface Playbook {
    playbook_id?: number,
    name: string
}

export interface PlaybookWithEntryCount extends Playbook {
    entry_count: number
}

export interface PlaybookEntry {
    entry_id?: number,
    playbook_id: number,
    trans_description: string,
    amount: number,
    credit_account: number,
    debit_account: number,
    notes?: string,
    sort_order?: number
}

export interface PlaybookWithEntries {
    playbook: Playbook,
    entries: PlaybookEntry[]
}
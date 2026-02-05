export interface Transaction {
    trans_code?: number,
    trans_date: string,
    trans_description: string,
    amount: number, 
    credit_account: number,
    debit_account: number,
    notes?: string 
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
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
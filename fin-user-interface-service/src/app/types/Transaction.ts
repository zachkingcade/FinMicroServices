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

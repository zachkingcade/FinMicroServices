export interface Transaction {
    trans_code?: number,
    trans_date: string,
    trans_description: string,
    amount: number, 
    credit_account: number,
    debit_account: number,
    notes?: string 
}
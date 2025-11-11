export interface Account {
    account_code: number,
    account_type: number,
    account_description: string,
    account_selectable: string,
    account_active: "Y" | "N",
    notes?: string,
}

export interface AccountPresentable {
    account_code: number,
    account_type: string,
    account_description: string,
    balance: number,
    account_selectable?: string,
    notes?: string,
}

export interface AccountDTO {
    account_type: number,
    account_description: string,
    notes: string,
}

export interface AccountAddReturn {
    status: string
    newTransaction: Account
}
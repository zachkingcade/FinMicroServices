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
    account_selectable?: string,
    account_active: "Active" | "Inactive",
    notes?: string,
}
export interface AccountType {
    type_code: number,
    type_description: string,
    type_class: number,
    notes?: string | null
}

export interface AccountTypePresentable {
    type_code?: number,
    type_description: string,
    type_class: string,
    notes?: string
}

export interface AccountTypeDTO {
    type_description: string,
    type_class: number,
    notes: string
}

export interface AccountTypeAddReturn {
    status: string
    newTransaction: AccountType
}
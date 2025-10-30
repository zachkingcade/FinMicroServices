export interface AccountType {
    type_code: number,
    type_description: string,
    notes?: string
}

export interface AccountTypeDTO {
    type_code?: number,
    type_description: string,
    notes?: string
}
export interface AccountType {
    type_code: number,
    type_description: string,
    type_class: number,
    notes?: string
}

export interface AccountTypeDTO {
    type_code?: number,
    type_description: string,
    type_class: number,
    notes?: string
}
export interface AccountType {
    type_code: number,
    type_description: string,
    type_class: number,
    type_active: 'Y' | 'N',
    notes?: string
}

export interface AccountTypeDTO {
    type_code?: number,
    type_description: string,
    type_class: number,
    type_active: 'Y' | 'N',
    notes?: string
}
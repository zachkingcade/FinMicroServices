import { TypeClass } from "./TypeClass"

export interface AccountType {
    type_code: number,
    type_description: string,
    type_class: number,
    type_active: "Y" | 'N',
    notes?: string | null
}

export interface AccountTypePresentable {
    type_code?: number,
    type_description: string,
    type_class: string,
    type_active: "Y" | 'N',
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

export interface AccountTypeUpdateReturn {
    status: string
    newTransaction: AccountType
}

export interface AccountTypeFilters {
    typeClassFilter: TypeClass[] | null,
    descriptionContains: string,
    notesContains: string,
    includeInactive: boolean,
    hideActive: boolean
}

export interface AccountTypeFiltersReturn {
    status: string,
    accountTypeFilters: AccountTypeFilters
}
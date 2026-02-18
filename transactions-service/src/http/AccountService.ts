import { Logger } from "winston";
import { Account } from "../types/Account.js";
import { AccountType } from "../types/AccountType.js";
import { TypeClass } from "../types/TypeClass.js";
import { WLog } from "../WLog.js";

function base(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '');
}

export class AccountService {
    private log: Logger;
    private baseUrl: string;

    constructor(accountsServiceBaseUrl: string) {
        this.log = WLog.getLogger();
        this.baseUrl = base(accountsServiceBaseUrl);
    }

    async requestAccountDetails(account_code: number): Promise<TypeClass> {
        const accountRequest = await fetch(`${this.baseUrl}/account/getbyid/${account_code}`);
        const accountData: Account = await accountRequest.json();
        this.log.info(`Retrieved account [${account_code}]'s account [${JSON.stringify(accountData)}]`);

        const typeRequest = await fetch(`${this.baseUrl}/type/getbyid/${accountData.account_type}`);
        const TypeData: AccountType = await typeRequest.json();
        this.log.info(`Retrieved account [${account_code}]'s account type [${JSON.stringify(TypeData)}]`);

        const typeClassRequest = await fetch(`${this.baseUrl}/type/class/getbyid/${TypeData.type_class}`);
        const TypeClassData: TypeClass = await typeClassRequest.json();
        this.log.info(`Retrieved account [${account_code}]'s type class [${JSON.stringify(TypeClassData)}]`);

        return TypeClassData;
    }
}
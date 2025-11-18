import { Logger } from "winston";
import { Account } from "../types/Account";
import { AccountType } from "../types/AccountType";
import { TypeClass } from "../types/TypeClass";
import { WLog } from "../WLog";


export class AccountService {
    private log: Logger;

    constructor(){
        this.log = WLog.getLogger();
    }

    async requestAccountDetails(account_code: number): Promise<TypeClass> {
        const accountRequest = await fetch(`http://localhost:3001/account/getbyid/${account_code}`);
        const accountData: Account = await accountRequest.json();
        this.log.info(`Retrieved account [${account_code}]'s account [${JSON.stringify(accountData)}]`);

        const typeRequest = await fetch(`http://localhost:3001/type/getbyid/${accountData.account_type}`);
        const TypeData: AccountType = await typeRequest.json();
        this.log.info(`Retrieved account [${account_code}]'s account type [${JSON.stringify(TypeData)}]`);

        const typeClassRequest = await fetch(`http://localhost:3001/type/class/getbyid/${TypeData.type_class}`);
        const TypeClassData: TypeClass = await typeClassRequest.json();
        this.log.info(`Retrieved account [${account_code}]'s type class [${JSON.stringify(TypeClassData)}]`);

        return TypeClassData;
    }
}
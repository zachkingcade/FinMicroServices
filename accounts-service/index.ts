import { DatabaseHandler } from "./src/DatabaseHandler.js";

async function main(){
    let database = new DatabaseHandler;
    await database.startup();

    await database.addAccount("first Account", "1");
    await database.addAccount("testing Account", "2", "This account has notes");
    console.log(await database.getAllAccounts());

    await database.addAccountType("1", "First account type");
    await database.addAccountType("2", "Second account type");
    console.log(await database.getAllTypes());
}

main();
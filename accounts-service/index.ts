import { DatabaseHandler } from "./src/DatabaseHandler.js";
import { WLog } from "./src/WLog.js";

async function main(){
    let log = WLog.getLogger();

    let database = new DatabaseHandler;
    await database.startup();

    await database.addAccount("first Account", "1");
    await database.addAccount("testing Account", "2", "This account has notes");
    log.info(JSON.stringify(await database.getAllAccounts()));

    await database.addAccountType("1", "First account type");
    await database.addAccountType("2", "Second account type");
    log.info(JSON.stringify(await database.getAllTypes()));
}

main();
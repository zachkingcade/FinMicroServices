import { DatabaseHandler } from "./src/DatabaseHandler.js";
import { WLog } from "./src/WLog.js";

async function main(){
    let log = WLog.getLogger();

    let database = new DatabaseHandler;
    await database.startup();
    
    await database.addAccountType("First account type");
    await database.addAccountType("Second account type", "This account type is being tested with notes");
    log.info(JSON.stringify(await database.getAllTypes()));
    //log.info(JSON.stringify(await database.getTypeById(1)));
    //log.info(JSON.stringify(await database.getTypeByDescription("Second account type")));
    

    await database.addAccount("first Account", 1);
    await database.addAccount("testing Account", "Second account type", "This account has notes");
    log.info(JSON.stringify(await database.getAllAccounts()));

    //await database.addAccount("first Account", "5");
    //await database.addAccount("testing Account", "not a real account", "This account has notes");
    //log.info(JSON.stringify(await database.getAllAccounts()));
}

main();
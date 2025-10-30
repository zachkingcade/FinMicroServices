import { RabbitQueueHandler } from "./src/queue/RabbitQueueHandler.js";
import { QueueConsumerService } from "./src/queue/QueueConsumerService.js";
import { WLog } from "./src/WLog.js";

async function main() {
    const startupStartTime = performance.now();

    let log = WLog.getLogger();
    log.info("Logger instance obtained");
    log.info("Starting....");
    let headerString: string = "";
    headerString += "\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n"
    headerString += " .d8b.   .o88b.  .o88b.  .d88b.  db    db d8b   db d888888b      .d8888. d88888b d8888b. db    db d888888b  .o88b. d88888b\n"
    headerString += "d8' `8b d8P  Y8 d8P  Y8 .8P  Y8. 88    88 888o  88 `~~88~~'      88'  YP 88'     88  `8D 88    88   `88'   d8P  Y8 88'    \n"
    headerString += "88ooo88 8P      8P      88    88 88    88 88V8o 88    88         `8bo.   88ooooo 88oobY' Y8    8P    88    8P      88ooooo\n"
    headerString += "88~~~88 8b      8b      88    88 88    88 88 V8o88    88           `Y8b. 88~~~~~ 88`8b   `8b  d8'    88    8b      88~~~~~\n"
    headerString += "88   88 Y8b  d8 Y8b  d8 `8b  d8' 88b  d88 88  V888    88         db   8D 88.     88 `88.  `8bd8'    .88.   Y8b  d8 88.    \n"
    headerString += "YP   YP  `Y88P'  `Y88P'  `Y88P'  ~Y8888P' VP   V8P    YP         `8888Y' Y88888P 88   YD    YP    Y888888P  `Y88P' Y88888P\n"
    headerString += "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n\n\n"
    log.info(headerString);

    let queue = await QueueConsumerService.getInstance(RabbitQueueHandler);
    log.info("RabbitMQ Handler started");

    await queue.setupAccountQueue();
    log.info("Accounts-Queue setup within the RabbitMQ Handler");

    const startupTimeMs = (performance.now() - startupStartTime).toFixed(2);
    log.info("Service Started and Listening on queue [Accounts-Queue]");
    console.log(`Accounts Service started in ${startupTimeMs} milliseconds...`);
}

main();
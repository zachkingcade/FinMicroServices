import { ExpressHandler } from "./src/http/ExpressHandler";
import { WLog } from "./src/WLog";


async function main() {
    const startupStartTime = performance.now();

    let log = WLog.getLogger();
    log.info("Logger instance obtained");
    log.info("Starting....");
    let headerString: string = "";

    headerString += "\n\n88888888888                                                 888    d8b                 \n"
    headerString += "   888                                                      888    Y8P                   \n"
    headerString += "   888                                                      888                          \n"
    headerString += "   888  888d888 8888b.  88888b.  .d8888b   8888b.   .d8888b 888888 888  .d88b.  88888b.  \n"
    headerString += "   888  888P       88b  888  88b 88K           88b d88P     888    888 d88  88b 888  88b \n"
    headerString += "   888  888    .d888888 888  888  Y8888b. .d888888 888      888    888 888  888 888  888 \n"
    headerString += "   888  888    888  888 888  888      X88 888  888 Y88b.    Y88b.  888 Y88..88P 888  888 \n"
    headerString += "   888  888     Y888888 888  888  88888P'  Y888888   Y8888P   Y888 888   Y88P   888  888 \n\n\n"
    headerString += " .d8888b.                            d8b                                                  \n"
    headerString += "d88P  Y88b                           Y8P                                                  \n"
    headerString += "Y88b.                                                                                     \n"
    headerString += "  Y888b.    .d88b.  888d888 888  888 888  .d8888b .d88b.                                  \n"
    headerString += "     Y88b. d8P  Y8b 888P    888  888 888 d88P    d8P  Y8b                                 \n"
    headerString += "       888 88888888 888     Y88  88P 888 888     88888888                                 \n"
    headerString += "Y88b  d88P Y8b.     888      Y8bd8P  888 Y88b.   Y8b.                                     \n"
    headerString += "  Y8888P     Y8888  888       Y88P   888   Y8888P  Y8888  \n\n"
    log.info(headerString);

    let express = await ExpressHandler.getInstance();
    log.info("Express Handler started");

    const startupTimeMs = (performance.now() - startupStartTime).toFixed(2);
    console.log(`Transaction Service started in ${startupTimeMs} milliseconds...`);
}

main();
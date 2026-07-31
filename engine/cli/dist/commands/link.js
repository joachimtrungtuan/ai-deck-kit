// Register or remove the global `aideck` command.
import { isRegistered, pathAdviceFor, registerCommand, unregisterCommand } from "../lib/command-registration.js";
export const linkHelp = `Command registration:
  link                             Make "aideck" typeable from any folder
  unlink                           Remove the registered "aideck" command`;
export function runLink(args) {
    const command = args[0];
    if (args.includes("--help"))
        return console.log(linkHelp);
    if (command === "unlink")
        return unlinkCommand();
    return linkCommand();
}
export function linkCommand() {
    const result = registerCommand();
    console.log(`Registered the "aideck" command: ${result.binary}`);
    console.log("");
    console.log("This is a one-time step. It works in every AI Deck Kit project on this");
    console.log("computer, now and in future, and each project keeps using its own engine.");
    if (!result.onPath) {
        console.log("");
        pathAdviceFor(result.binDir).forEach((line) => console.log(line));
    }
}
function unlinkCommand() {
    const removed = unregisterCommand();
    console.log(removed ? `Removed the "aideck" command: ${removed}` : `No registered "aideck" command found.`);
}
/** Offer registration during install; never fail the install over it. */
export function offerRegistration() {
    if (isRegistered()) {
        console.log(`The "aideck" command is already registered on this computer.`);
        return;
    }
    try {
        linkCommand();
    }
    catch (error) {
        console.log("");
        console.log(`Could not register the "aideck" command: ${error instanceof Error ? error.message : String(error)}`);
        console.log("This is not a problem — use ./aideck from your project folder instead,");
        console.log("or try again later with: aideck link");
    }
}

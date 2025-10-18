export default AppCommandMessage;
declare class AppCommandMessage extends CommandMessage {
    /**
     * @param {*} input
     * @returns {AppCommandMessage}
     */
    static from(input: any): AppCommandMessage;
    /** @returns {AppCommandOptions} */
    get opts(): AppCommandOptions;
}
import { CommandMessage } from "@nan0web/co";
import AppCommandOptions from "./AppCommandOptions.js";

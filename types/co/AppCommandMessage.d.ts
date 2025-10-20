export default class AppCommandMessage extends CommandMessage {
    /**
     * @param {*} input
     * @returns {AppCommandMessage}
     */
    static from(input: any): AppCommandMessage;
    set opts(arg: AppCommandOptions);
    /** @returns {AppCommandOptions} */
    get opts(): AppCommandOptions;
}
import { CommandMessage } from "@nan0web/co";
import AppCommandOptions from "./AppCommandOptions.js";
